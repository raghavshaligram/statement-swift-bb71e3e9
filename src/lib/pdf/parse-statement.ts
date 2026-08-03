import { EncryptedPdfError, MalformedPdfError } from "@/lib/pdf/pdf-open";
import { extractPdfText } from "./extract-text";
import { parseTransactionsFromPages, groupIntoRows } from "./parse-transactions";
import { detectBank, BANK_LABELS } from "./bank-detection";
import { detectCurrency } from "./detect-currency";
import { getConfidenceTier } from "./confidence";
import { ocrPdfToTextItems, ocrImageToTextItems, looksLikeScannedPage } from "./ocr";
import { findHeaderRow, headerLabelsInOrder } from "./detect-columns";
import { detectBankFromHeaderSignature } from "./bank-header-signatures";
import { parseIifText, iifResultToTransactions } from "../iif/parse-iif";
import { parseCsvText, csvResultToTransactions } from "../csv/parse-csv";
import { parseOfxText, ofxResultToTransactions } from "../ofx/parse-ofx";
import { parseQifText, qifResultToTransactions } from "../qif/parse-qif";
import { parseMt940Text, mt940ResultToTransactions } from "../mt940/parse-mt940";
import type { ExtractedPdf, PageText } from "./extract-text";
import type { ParsedStatement, Transaction } from "../statement-store";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function parseStatementFile(
  file: File,
  onPageParsed?: (pageNumber: number, totalPages: number) => void,
  ocrLanguages: string[] = ["eng"],
  password?: string
): Promise<ParsedStatement> {
  const warnings: string[] = [];

  if (/\.iif$/i.test(file.name)) {
    // IIF is structured text, not a PDF/image -- a completely different,
    // much simpler code path (no OCR, no layout inference, no page
    // rendering), so it short-circuits here rather than flowing through
    // the PDF/image logic below at all.
    const content = await file.text();
    const result = parseIifText(content);
    const transactions = iifResultToTransactions(result, file.name);
    onPageParsed?.(1, 1);
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount: 1,
      detectedBank: null, // IIF exports don't typically name the issuing bank
      currency: detectCurrency(content, null),
      transactions,
      warnings: result.warnings,
    };
  }

  if (/\.(ofx|qfx)$/i.test(file.name)) {
    // Same short-circuit pattern as IIF -- OFX/QFX are the same underlying
    // format (QFX just adds Quicken-specific headers), one parser handles
    // both.
    const content = await file.text();
    const result = parseOfxText(content);
    const transactions = ofxResultToTransactions(result, file.name);
    onPageParsed?.(1, 1);
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount: 1,
      detectedBank: null,
      currency: result.currency ?? detectCurrency(content, null),
      transactions,
      warnings: result.warnings,
    };
  }

  if (/\.qif$/i.test(file.name)) {
    const content = await file.text();
    const result = parseQifText(content);
    const transactions = qifResultToTransactions(result, file.name);
    onPageParsed?.(1, 1);
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount: 1,
      detectedBank: null,
      currency: detectCurrency(content, null), // QIF has no explicit currency field
      transactions,
      warnings: result.warnings,
    };
  }

  if (/\.(sta|mt940|940)$/i.test(file.name)) {
    const content = await file.text();
    const result = parseMt940Text(content);
    const transactions = mt940ResultToTransactions(result, file.name);
    onPageParsed?.(1, 1);
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount: 1,
      detectedBank: null,
      currency: result.currency ?? detectCurrency(content, null),
      transactions,
      warnings: result.warnings,
    };
  }

  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    // Same short-circuit pattern as IIF -- generic structured text, not a
    // PDF/image, and a genuinely different parsing problem (auto-detected
    // headers + delimiter, not layout inference).
    const content = await file.text();
    const result = parseCsvText(content);
    onPageParsed?.(1, 1);
    const transactions: Transaction[] = csvResultToTransactions(result, file.name);
    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount: 1,
      detectedBank: null,
      currency: detectCurrency(content, null),
      transactions,
      warnings: result.warnings,
    };
  }

  const isImage = IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);

  let extracted!: ExtractedPdf;
  let usedOcr = false;

  if (isImage) {
    // Not a PDF at all -- "statement to Excel," not "PDF to Excel." Route
    // straight to image OCR (skips pdf.js entirely, no PDF to render).
    try {
      const result = await ocrImageToTextItems(file, (e) => onPageParsed?.(e.sourcePage, e.totalPages), ocrLanguages);
      extracted = {
        pageCount: 1,
        pages: [{ pageNumber: 1, items: result.items, rawText: result.rawText }] as PageText[],
        fullText: result.rawText,
      };
      usedOcr = true;
      warnings.push(
        "This was read using on-device OCR from an image file, not a PDF. OCR is less precise than reading real text -- double-check extracted rows carefully before exporting."
      );
    } catch (err) {
      return {
        fileName: file.name,
        fileSizeBytes: file.size,
        pageCount: 0,
        detectedBank: null,
        currency: null,
        transactions: [],
        warnings: [
          `Couldn't read this image (${err instanceof Error ? err.message : "unknown error"}). Try a clearer photo or a PDF instead.`,
        ],
      };
    }
  } else {
    try {
      extracted = await extractPdfText(file, onPageParsed, password);
    } catch (err) {
      // Now that openPdfjs raises typed errors, say which of the three
      // things actually went wrong instead of listing all of them and
      // making the reader guess.
      let warning: string;
      if (err instanceof EncryptedPdfError) {
        warning =
          `"${file.name}" is password-protected. Re-upload it and enter the password when prompted — ` +
          `the password is used entirely on your device and never sent anywhere.`;
      } else if (err instanceof MalformedPdfError) {
        warning = `"${file.name}" appears to be corrupted or isn't a readable PDF.`;
      } else {
        warning =
          `Couldn't read "${file.name}" (${err instanceof Error ? err.message : "unknown error"}). ` +
          `It may be scanned/image-only, or in an unexpected format.`;
      }
      return {
        fileName: file.name,
        fileSizeBytes: file.size,
        pageCount: 0,
        detectedBank: null,
        currency: null,
        transactions: [],
        warnings: [warning],
      };
    }
  }

  // Runs full-document OCR and swaps it in as the extraction result -- but
  // only if OCR actually found more text than the fast path did. If OCR also
  // comes back empty (a truly blank page, or an image OCR can't read), the
  // original result is kept rather than silently discarding whatever little
  // text was there. Returns true only when the swap actually happened.
  const attemptOcrSwap = async (successWarning: string): Promise<boolean> => {
    try {
      const ocrResult = await ocrPdfToTextItems(file, (e) => onPageParsed?.(e.sourcePage, e.totalPages), ocrLanguages);
      const ocrPages: PageText[] = ocrResult.pages.map((p) => ({
        pageNumber: p.pageNumber,
        items: p.items,
        rawText: p.rawText,
      }));
      const ocrFullText = ocrPages.map((p) => p.rawText).join("\n");
      if (ocrFullText.trim().length > extracted.fullText.trim().length) {
        extracted = { pageCount: ocrResult.pageCount, pages: ocrPages, fullText: ocrFullText };
        usedOcr = true;
        warnings.push(successWarning);
        return true;
      }
    } catch (err) {
      warnings.push(
        `This looked like a scanned statement, but on-device OCR failed (${err instanceof Error ? err.message : "unknown error"}). Falling back to whatever text could be read directly, which may be incomplete.`
      );
    }
    return false;
  };

  // A page with almost no real text items is very likely a scanned/photographed
  // page (image-only), not a text-based PDF -- fall back to on-device OCR for
  // the whole document rather than silently returning nothing. This is
  // genuinely slower than normal text extraction, so only do it when the
  // fast path actually looks scanned, not on every upload. Doesn't apply to
  // the isImage path above, which already went through OCR directly.
  //
  // The majority test is >= 0.5, not > 0.5: a 2-page document made of a
  // real-text cover page plus one scanned statement page is exactly half
  // scanned, and under a strict > test it never triggered OCR at all -- the
  // scanned page (the one with the actual transactions) came back empty.
  if (!isImage) {
    const scannedPageCount = extracted.pages.filter((p) => looksLikeScannedPage(p.items.length)).length;
    const looksScanned = extracted.pages.length > 0 && scannedPageCount / extracted.pages.length >= 0.5;

    if (looksScanned) {
      await attemptOcrSwap(
        "This looked like a scanned or photographed statement, so text was read using on-device OCR instead of a normal text layer. OCR is less precise than reading real text -- double-check extracted rows carefully before exporting."
      );
    }
  }

  let raw = parseTransactionsFromPages(extracted.pages, extracted.fullText);

  // Rescue pass: scanned statements frequently carry a real-text WRAPPER --
  // a bank footer stamp on every page ("Page 1 of 4", disclaimers) or a
  // scanner app's embedded low-quality text layer -- which pushes the page
  // over the looksLikeScannedPage item threshold, so the trigger above never
  // fires even though the transactions themselves are only in the image. The
  // tell is the combination: the fast path parsed ZERO transactions AND the
  // document's text density is far below what a real text-layer statement
  // produces (hundreds of items per page). In that case, try OCR anyway.
  // Deliberately NOT triggered for genuinely text-dense documents that
  // parsed to zero -- there OCR can't outdo the real text layer (and the
  // attemptOcrSwap length guard would discard its result anyway), so running
  // it would only add minutes of work for nothing; that failure mode is a
  // parser-layout gap, not an extraction gap, and the honest response is the
  // "no transaction rows" warning below.
  if (!isImage && !usedOcr && raw.length === 0 && extracted.pages.length > 0) {
    const totalItems = extracted.pages.reduce((sum, p) => sum + p.items.length, 0);
    const avgItemsPerPage = totalItems / extracted.pages.length;
    if (avgItemsPerPage < 60) {
      const swapped = await attemptOcrSwap(
        "This PDF's text layer had too little real content to read transactions from -- likely a scanned statement with a text footer or a scanner-generated text layer -- so it was re-read using on-device OCR. OCR is less precise than reading real text -- double-check extracted rows carefully before exporting."
      );
      if (swapped) raw = parseTransactionsFromPages(extracted.pages, extracted.fullText);
    }
  }

  let bankId = detectBank(extracted.fullText);
  if (bankId === "unknown") {
    // Fallback signal: check the first page's detected header row against
    // known bank header-signatures (see bank-header-signatures.ts). Only
    // consulted when the primary, more reliable text-based detection
    // (the bank's name/domain printed somewhere in the statement) found
    // nothing -- a column-layout fingerprint is a weaker signal on its own.
    const firstPageWithText = extracted.pages.find((p) => p.items.length > 0);
    if (firstPageWithText) {
      const rows = groupIntoRows(firstPageWithText.items);
      const pageWidth = Math.max(...firstPageWithText.items.map((i) => i.x + i.width), 1);
      const header = findHeaderRow(rows, pageWidth);
      if (header) {
        const fromHeader = detectBankFromHeaderSignature(headerLabelsInOrder(header));
        if (fromHeader) bankId = fromHeader;
      }
    }
  }
  const detectedBank = bankId === "unknown" ? null : BANK_LABELS[bankId];
  if (bankId === "unknown") {
    warnings.push(
      "Bank not recognized from statement text — used the generic layout parser. Double-check extracted rows before exporting."
    );
  }

  const currency = detectCurrency(extracted.fullText, bankId === "unknown" ? null : bankId);
  if (!currency) {
    warnings.push(
      "Couldn't detect this statement's currency — amounts are shown as plain numbers below. Double-check before exporting if that matters for your records."
    );
  }

  if (raw.length === 0) {
    warnings.push(
      usedOcr
        ? "No transaction rows were detected, even after OCR. This statement's layout may not match the generic parser yet, or the scan quality may be too low to read reliably."
        : "No transaction rows were detected. This statement's layout may not match the generic parser yet, or it may be a scanned/image-based PDF -- on-device OCR is attempted automatically when that's detected, but didn't find enough text this time."
    );
  }

  const lowConfidenceCount = raw.filter((t) => getConfidenceTier(t.confidence) === "low").length;
  if (lowConfidenceCount > 0) {
    warnings.push(
      `${lowConfidenceCount} row${lowConfidenceCount > 1 ? "s" : ""} scored below 75% confidence — flagged for manual review before exporting.`
    );
  }

  const transactions: Transaction[] = raw.map((t, i) => ({
    id: `${file.name}-${i}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    balance: t.balance,
    sourceFile: file.name,
    sourcePage: t.sourcePage,
    confidence: t.confidence,
    sourceLines: t.sourceLines,
    valueDate: t.valueDate,
    tranType: t.tranType,
    tranId: t.tranId,
    chequeDetails: t.chequeDetails,
    drCr: t.drCr,
  }));

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    pageCount: extracted.pageCount,
    detectedBank,
    currency,
    transactions,
    warnings,
  };
}
