/**
 * On-device OCR for scanned/image-only PDF statements. Adapted from
 * PDFMacro's ocrPdfToTokens (raghavshaligram/counsel-s-lovable,
 * src/lib/pdf/ocr-pdf.ts) -- that implementation is mature and
 * production-tested (worker pool, per-page skip-if-already-has-text,
 * offscreen canvas), so this ports the same approach rather than
 * reinventing it, trimmed down to just what BalanceExtract needs: word-level
 * text + position, not PDFMacro's fuller "rebuild a searchable PDF" output
 * (which needs pdf-lib and isn't relevant here -- we only need tokens to
 * feed into the existing transaction-parsing pipeline).
 *
 * Runs entirely in the browser via tesseract.js -- no server, same
 * on-device guarantee as the rest of the app.
 */

import type { TextItem } from "./extract-text";

export type OcrStage = "loading-language" | "rendering" | "ocr";

export type OcrProgressEvent = {
  sourcePage: number;
  totalPages: number;
  stage: OcrStage;
  message: string;
};

type OcrWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };

const RENDER_SCALE = 1.5; // ~108dpi -- good balance of OCR accuracy vs. speed/memory for clean bank-statement scans

function collectWords(data: unknown): OcrWord[] {
  const out: OcrWord[] = [];
  const visit = (node: Record<string, unknown> | null | undefined) => {
    if (!node) return;
    const words = node.words as OcrWord[] | undefined;
    if (Array.isArray(words)) out.push(...words);
    for (const key of ["blocks", "paragraphs", "lines"]) {
      const arr = node[key] as Record<string, unknown>[] | undefined;
      if (Array.isArray(arr)) arr.forEach(visit);
    }
  };
  visit(data as Record<string, unknown>);
  return out.filter((w) => w.text && w.text.trim().length > 0);
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    try {
      return new OffscreenCanvas(w, h);
    } catch {
      // fall through to a regular canvas element
    }
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Decodes an image file to an HTMLImageElement, ready to draw to canvas.
 * Ported from PDFMacro's decodeImage (ocr-image.ts) -- standard browser
 * APIs, no dependencies, directly reusable as-is.
 */
async function decodeImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

async function createOcrWorker(langArg: string, useSelfHostedLang: boolean) {
  const tesseract = await import("tesseract.js");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return tesseract.createWorker(langArg, 1, {
    // Worker script + WASM core are always self-hosted -- these are the
    // OCR engine itself, not language-specific, so this covers every
    // language regardless of which one is requested. Only English's
    // language data is self-hosted; everything else uses tesseract.js's
    // default CDN langPath.
    workerPath: `${origin}/tesseract/worker.min.js`,
    corePath: `${origin}/tesseract/tesseract-core-simd-lstm.js`,
    ...(useSelfHostedLang ? { langPath: `${origin}/tesseract` } : {}),
    workerBlobURL: false,
  });
}

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function loadPdfJsForOcr() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then(async (lib) => {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      lib.GlobalWorkerOptions.workerSrc = workerUrl;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

/**
 * OCRs a single image file (JPG/PNG/WEBP/etc, not a PDF) and returns text
 * items in the same shape as the PDF paths, so it feeds into the exact same
 * parseTransactionsFromPages pipeline unchanged -- a raw image upload is
 * just another TextItem source, not a separate parsing path. Adapted from
 * PDFMacro's ocrImageToSearchable (ocr-image.ts): decodes the image
 * straight to canvas, skipping pdf.js rendering entirely (there's no PDF
 * here at all), then runs the exact same tesseract recognize() call the
 * PDF-OCR path already uses.
 */
export async function ocrImageToTextItems(
  file: File,
  onProgress?: (e: OcrProgressEvent) => void,
  languages: string[] = ["eng"]
): Promise<{ items: TextItem[]; rawText: string }> {
  if (typeof window === "undefined") {
    throw new Error("ocrImageToTextItems can only run in the browser");
  }

  const { toTesseractLang } = await import("./ocr-languages");
  const langArg = toTesseractLang(languages);
  const useSelfHostedLang = languages.length === 1 && languages[0] === "eng";

  onProgress?.({ sourcePage: 1, totalPages: 1, stage: "loading-language", message: "Loading OCR language pack…" });

  const img = await decodeImage(file);
  onProgress?.({ sourcePage: 1, totalPages: 1, stage: "rendering", message: "Reading image…" });

  const nativeWidth = img.naturalWidth || img.width;
  const nativeHeight = img.naturalHeight || img.height;
  // Upscale small images before OCR -- the same principle already used for
  // PDF pages (RENDER_SCALE), just applied dynamically here since a raw
  // image upload can arrive at any resolution, unlike a PDF page's fairly
  // consistent native size. Tesseract's accuracy on small text drops
  // meaningfully below ~1800px on the longer dimension; a low-res photo or
  // screenshot (this was confirmed on a real 768x1024 test image) benefits
  // noticeably from upscaling even though no new detail is added -- larger,
  // smoother glyphs segment more reliably. Capped at 3x so an already-large
  // image doesn't get blown up unnecessarily.
  const longerDimension = Math.max(nativeWidth, nativeHeight);
  const scale = Math.min(3, Math.max(1, 1800 / longerDimension));
  const scaledWidth = Math.round(nativeWidth * scale);
  const scaledHeight = Math.round(nativeHeight * scale);

  const canvas = makeCanvas(scaledWidth, scaledHeight);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img as unknown as CanvasImageSource, 0, 0, scaledWidth, scaledHeight);

  const worker = await createOcrWorker(langArg, useSelfHostedLang);
  try {
    onProgress?.({ sourcePage: 1, totalPages: 1, stage: "ocr", message: "Running OCR…" });
    const { data } = await worker.recognize(canvas as HTMLCanvasElement, {}, { blocks: true });
    const words = collectWords(data);
    const inv = 1 / scale; // scale bounding boxes back to the original image's coordinate space
    const items: TextItem[] = [];
    for (const w of words) {
      const text = w.text.replace(/\s+/g, " ").trim();
      if (!text) continue;
      const width = (w.bbox.x1 - w.bbox.x0) * inv;
      const height = (w.bbox.y1 - w.bbox.y0) * inv;
      if (width <= 0 || height <= 0) continue;
      items.push({ str: text, x: w.bbox.x0 * inv, y: w.bbox.y0 * inv, width, height });
    }
    const rawText = items.map((it) => it.str).join(" ");
    return { items, rawText };
  } finally {
    await worker.terminate().catch(() => undefined);
  }
}

/**
 * OCRs every page of a PDF and returns text items in the same shape as
 * extract-text.ts's normal pdf.js extraction (top-left origin x/y/width/
 * height), so the result can feed directly into the existing
 * parseTransactionsFromPages pipeline unchanged -- OCR is just an
 * alternate source of TextItems, not a different parsing path.
 */
export async function ocrPdfToTextItems(
  file: File,
  onProgress?: (e: OcrProgressEvent) => void,
  languages: string[] = ["eng"]
): Promise<{ pageCount: number; pages: Array<{ pageNumber: number; items: TextItem[]; rawText: string }> }> {
  if (typeof window === "undefined") {
    throw new Error("ocrPdfToTextItems can only run in the browser");
  }

  const pdfjsLib = await loadPdfJsForOcr();
  const { toTesseractLang } = await import("./ocr-languages");
  const langArg = toTesseractLang(languages);
  // Only English is self-hosted (see the module comment in ocr-languages.ts
  // for why every other language isn't) -- use our local assets when English
  // is the only language requested, and fall back to tesseract.js's default
  // CDN-based loading for anything else, exactly like PDFMacro does.
  const useSelfHostedLang = languages.length === 1 && languages[0] === "eng";

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = doc.numPages;

  onProgress?.({ sourcePage: 0, totalPages, stage: "loading-language", message: "Loading OCR language pack…" });

  // A small worker pool so multi-page scanned statements OCR in parallel
  // rather than one page at a time -- matters a lot on a 20+ page statement.
  const hw = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 2 : 2;
  const poolSize = Math.max(1, Math.min(4, Math.floor(hw / 2)));
  const workers = await Promise.all(
    Array.from({ length: poolSize }, () => createOcrWorker(langArg, useSelfHostedLang))
  );
  const idleWorkers = [...workers];
  const waiters: Array<(w: (typeof workers)[number]) => void> = [];
  const acquire = (): Promise<(typeof workers)[number]> =>
    new Promise((res) => {
      const w = idleWorkers.pop();
      if (w) return res(w);
      waiters.push(res);
    });
  const release = (w: (typeof workers)[number]) => {
    const next = waiters.shift();
    if (next) next(w);
    else idleWorkers.push(w);
  };

  const pages: Array<{ pageNumber: number; items: TextItem[]; rawText: string }> = new Array(totalPages);

  try {
    await Promise.all(
      Array.from({ length: totalPages }, async (_, i) => {
        const pageNumber = i + 1;
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = makeCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
        if (!ctx) throw new Error("Canvas 2D context unavailable");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        onProgress?.({ sourcePage: pageNumber, totalPages, stage: "rendering", message: `Rendering page ${pageNumber}…` });
        await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport, canvas: canvas as HTMLCanvasElement }).promise;

        const worker = await acquire();
        let words: OcrWord[] = [];
        try {
          onProgress?.({ sourcePage: pageNumber, totalPages, stage: "ocr", message: `Reading page ${pageNumber} (OCR)…` });
          const { data } = await worker.recognize(canvas as HTMLCanvasElement, {}, { blocks: true });
          words = collectWords(data);
        } finally {
          release(worker);
        }

        const inv = 1 / RENDER_SCALE;
        const items: TextItem[] = [];
        for (const w of words) {
          const text = w.text.replace(/\s+/g, " ").trim();
          if (!text) continue;
          const width = (w.bbox.x1 - w.bbox.x0) * inv;
          const height = (w.bbox.y1 - w.bbox.y0) * inv;
          if (width <= 0 || height <= 0) continue;
          items.push({ str: text, x: w.bbox.x0 * inv, y: w.bbox.y0 * inv, width, height });
        }
        const rawText = items.map((it) => it.str).join(" ");
        pages[i] = { pageNumber, items, rawText };
      })
    );
  } finally {
    await Promise.all(workers.map((w) => w.terminate().catch(() => undefined)));
  }

  return { pageCount: totalPages, pages };
}

/** Quick check (no OCR run yet) for whether a page's real text layer is too sparse to trust -- the same threshold PDFMacro uses for its "already has text, skip OCR" decision, applied in reverse (decide whether to bother running OCR at all). */
export function looksLikeScannedPage(itemCount: number): boolean {
  const MIN_TEXT_ITEMS = 12;
  return itemCount < MIN_TEXT_ITEMS;
}
