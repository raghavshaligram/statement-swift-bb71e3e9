/**
 * Client-side PDF text extraction using pdf.js. This must only ever run in the
 * browser (never during SSR) — callers are responsible for checking
 * `typeof window !== "undefined"` before invoking anything here, and this
 * module lazy-loads pdf.js itself to avoid pulling it into the SSR bundle.
 */

export type TextItem = {
  str: string;
  x: number;
  y: number; // pdf.js gives y from the bottom of the page; we keep it as-is and sort descending
  width: number;
  height: number;
};

export type PageText = {
  pageNumber: number;
  items: TextItem[];
  rawText: string;
};

export type ExtractedPdf = {
  pageCount: number;
  pages: PageText[];
  fullText: string;
};

import { openPdfjs } from "@/lib/pdf/pdf-open";

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then(async (lib) => {
      // Worker must be served from a URL pdf.js can fetch at runtime.
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      lib.GlobalWorkerOptions.workerSrc = workerUrl;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

export async function extractPdfText(
  file: File,
  onPageParsed?: (pageNumber: number, totalPages: number) => void,
  password?: string
): Promise<ExtractedPdf> {
  if (typeof window === "undefined") {
    throw new Error("extractPdfText can only run in the browser");
  }

  const arrayBuffer = await file.arrayBuffer();
  const doc = await openPdfjs(arrayBuffer, { password });

  const pages: PageText[] = [];
  let fullText = "";

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items: TextItem[] = content.items
      // pdf.js types these loosely; filter out marked-content/no-str items defensively
      .filter((it: any) => typeof it.str === "string" && it.str.trim().length > 0)
      .map((it: any) => {
        const [, , , , x, y] = it.transform;
        return {
          str: it.str as string,
          x: x as number,
          // Flip y so that 0 is the top of the page, ascending downward — much easier
          // to reason about when reconstructing rows top-to-bottom.
          y: viewport.height - (y as number),
          width: it.width as number,
          height: it.height as number,
        };
      });

    const rawText = items.map((i) => i.str).join(" ");
    pages.push({ pageNumber, items, rawText });
    fullText += rawText + "\n";

    onPageParsed?.(pageNumber, doc.numPages);
    // release the page's resources; pdf.js keeps things around otherwise on big docs
    page.cleanup();
  }

  return { pageCount: doc.numPages, pages, fullText };
}

/**
 * Cheap page-count check -- loads just enough of the PDF to read its page
 * count, without extracting any text. Used for the free-tier page-limit
 * check before committing to a full parse, so a too-long file gets rejected
 * immediately rather than after doing real work on it.
 */
export async function getPdfPageCount(file: File, password?: string): Promise<number> {
  if (typeof window === "undefined") {
    throw new Error("getPdfPageCount can only run in the browser");
  }
  const arrayBuffer = await file.arrayBuffer();
  const doc = await openPdfjs(arrayBuffer, { password });
  return doc.numPages;
}

/**
 * Page count for the free-tier limit check, aware of both PDFs and raw
 * image uploads (a single photo/scan always counts as 1 page -- there's no
 * PDF to ask pdf.js for a page count, and getPdfPageCount would just throw
 * on a non-PDF file).
 */
export async function getStatementPageCount(file: File): Promise<number> {
  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name);
  const isStructuredText = /\.(iif|csv|ofx|qfx|qif|sta|mt940|940)$/i.test(file.name) || file.type === "text/csv";
  // Neither images nor structured-text formats (IIF/CSV/OFX/QFX/QIF/MT940)
  // have a real "page" concept -- these are lists of transactions, not
  // pages, so each counts as 1. In practice these never reach this
  // function at all, since isPageLimitExempt filters them out before the
  // page-count check runs -- this is just defensive consistency if it's
  // ever called directly.
  if (isImage || isStructuredText) return 1;
  return getPdfPageCount(file);
}

/**
 * Format-conversion inputs (IIF, and future CSV/OFX/QFX/QIF-as-input) are
 * deliberately exempt from the free-tier page limit entirely -- not just
 * "happens to pass because it counts as 1 page." Real competitive research
 * (checked directly against several dedicated CSV<->QIF/OFX/QBO/IIF
 * converters) confirms free/unlimited/no-signup is the actual norm for this
 * category, unlike PDF/image bank-statement parsing (where OCR is
 * genuinely expensive to run, and CapyParse/DocuClipper's page limits
 * reflect that real cost). Gating format conversion the same way would
 * undermine our own "unlimited, no cap" positioning in a category where
 * competitors are already more generous than a page-limit model allows.
 * These tools are also meant to work as a free acquisition funnel toward
 * the actual paid, differentiated product (bank-statement parsing), not to
 * be gated as their own premium feature.
 */
export function isPageLimitExempt(file: File): boolean {
  return /\.(iif|csv|ofx|qfx|qif|sta|mt940|940)$/i.test(file.name) || file.type === "text/csv";
}
