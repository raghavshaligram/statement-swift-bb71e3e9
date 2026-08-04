/**
 * Parser for IIF (Intuit Interchange Format) files -- QuickBooks Desktop's
 * native tab-delimited import/export format. Real, structured text, not a
 * PDF/image -- no layout inference or OCR needed, which is exactly why this
 * was prioritized ahead of the harder format-conversion work: genuinely
 * tractable, not just lower-volume-but-easier.
 *
 * Format basics (stable, unchanged for decades, well-documented):
 * - Tab-separated fields, one record per line.
 * - Lines starting with "!" are header/directive lines that define the
 *   FIELD ORDER for subsequent data lines of that record type -- e.g.
 *   "!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO"
 *   means every following "TRNS" data line has those fields in that exact
 *   order. Different IIF files can define different field orders, so this
 *   MUST be read per-file, not assumed/hardcoded.
 * - Data lines start with the record type itself (no "!"): TRNS (a
 *   transaction), SPL (a split/detail line for multi-account transactions),
 *   ENDTRNS (marks the end of a transaction block). Also account (ACCNT),
 *   customer (CUST), and other definition records exist, but aren't
 *   relevant for statement-style transaction extraction.
 *
 * We only extract TRNS records (the primary transaction line) -- SPL lines
 * are the offsetting split/detail entries for double-entry bookkeeping,
 * not additional transactions to surface separately.
 */

import type { Transaction } from "../statement-store";
import { enrichTransactions, type UnenrichedTransaction } from "../enrich";

type FieldOrder = string[];

function splitLine(line: string): string[] {
  return line.split("\t").map((f) => f.trim());
}

/**
 * IIF dates are typically M/D/YYYY or MM/DD/YYYY (US convention, since IIF
 * is a QuickBooks Desktop US-market format) -- not ambiguous the way a
 * printed statement's date column can be, so no document-wide inference
 * needed here the way parse-transactions.ts needs it for PDFs.
 */
function parseIifDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, mo, day, yearRaw] = m;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${mo.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseIifAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, "");
  if (cleaned === "") return null;
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

export type IifParseResult = {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    tranType: string | null;
    tranId: string | null;
    memo: string | null;
  }>;
  warnings: string[];
};

export function parseIifText(content: string): IifParseResult {
  // Strip a leading UTF-8 BOM if present -- confirmed as a real bug via
  // testing: it attaches to the first header line ("!TRNS" becomes the
  // unrecognized "\uFEFF!TRNS"), which broke the startsWith("!") check and
  // caused every subsequent transaction to be skipped as "before its
  // field-order header was defined."
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const warnings: string[] = [];
  const transactions: IifParseResult["transactions"] = [];

  // Field order is tracked per record type, since a single IIF file can (and
  // real QuickBooks exports often do) redefine it partway through, e.g. once
  // per account section.
  const fieldOrders = new Map<string, FieldOrder>();

  const lines = content.split(/\r\n|\r|\n/);
  let trnsRecordCount = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = splitLine(line);
    const recordType = fields[0];

    if (recordType.startsWith("!")) {
      // Header line: "!TRNS" itself is fields[0], the rest are field names.
      fieldOrders.set(recordType.slice(1), fields.slice(1));
      continue;
    }

    if (recordType !== "TRNS") continue; // SPL/ENDTRNS/ACCNT/etc. -- not a transaction row

    const order = fieldOrders.get("TRNS");
    if (!order) {
      // A TRNS data line appeared before any "!TRNS" header defined its
      // field order -- can't know which value is which. Skip, don't guess.
      warnings.push("Found a transaction line before its field-order header was defined -- skipped, since guessing the field order risks silently wrong data.");
      continue;
    }

    // Zip field names to values (fields[0] is "TRNS" itself, values start at index 1).
    const record: Record<string, string> = {};
    order.forEach((fieldName, i) => {
      record[fieldName] = fields[i + 1] ?? "";
    });

    const dateIso = record.DATE ? parseIifDate(record.DATE) : null;
    const amount = record.AMOUNT ? parseIifAmount(record.AMOUNT) : null;

    if (!dateIso || amount === null) {
      trnsRecordCount++;
      continue; // counted below for an honest "N of M rows skipped" warning
    }

    transactions.push({
      date: dateIso,
      description: record.NAME || record.MEMO || "(no description)",
      amount,
      tranType: record.TRNSTYPE || null,
      tranId: record.DOCNUM || null,
      memo: record.MEMO && record.MEMO !== record.NAME ? record.MEMO : null,
    });
    trnsRecordCount++;
  }

  if (trnsRecordCount === 0) {
    warnings.push("No transaction records (TRNS lines) were found in this file. It may not be a valid IIF export, or may only contain account/list definitions rather than transactions.");
  } else if (transactions.length < trnsRecordCount) {
    const skipped = trnsRecordCount - transactions.length;
    warnings.push(`${skipped} of ${trnsRecordCount} transaction line${trnsRecordCount === 1 ? "" : "s"} had a missing or unparseable date/amount and were skipped.`);
  }

  return { transactions, warnings };
}

/** Converts a parsed IIF result into the app's real Transaction shape, same as parse-statement.ts does for PDFs/images -- everything downstream (Preview, Export, confidence display) works unchanged. */
function iifResultToTransactionsRaw(result: IifParseResult, sourceFile: string): UnenrichedTransaction[] {
  return result.transactions.map((t, i) => ({
    id: `${sourceFile}-${i}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    balance: null, // IIF is a double-entry accounting export, not a bank statement -- no running balance concept
    sourceFile,
    sourcePage: 1,
    // IIF is structured, unambiguous data -- not a layout-inferred PDF read
    // or an OCR guess, so a flat high-confidence score is honest here,
    // rather than running it through the PDF confidence-scoring heuristics
    // that don't apply to this kind of input at all.
    confidence: 95,
    sourceLines: [],
    valueDate: null,
    tranType: t.tranType,
    tranId: t.tranId,
    chequeDetails: null,
    drCr: t.amount >= 0 ? "Cr" : "Dr",
  }));
}

/**
 * Public entry point. Wraps the raw mapper with the shared enrichment pass so
 * every input format yields payee/method/category identically -- see
 * src/lib/enrich/index.ts.
 */
export function iifResultToTransactions(...args: Parameters<typeof iifResultToTransactionsRaw>): Transaction[] {
  return enrichTransactions(iifResultToTransactionsRaw(...args));
}
