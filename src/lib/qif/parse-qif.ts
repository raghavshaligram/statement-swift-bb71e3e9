/**
 * Parser for QIF files (Quicken Interchange Format) -- a plain line-based
 * format, the simplest of the structured formats we support. Each
 * transaction is a run of prefixed lines ending in a bare "^":
 *   D06/15/2025   (date)
 *   T-245.50      (amount)
 *   PVendor Name  (payee)
 *   MMemo text    (memo, optional)
 *   ^             (end of record)
 */

import type { Transaction } from "../statement-store";
import { inferDateOrder, resolveAmbiguousDate } from "../pdf/date-inference";
import { enrichTransactions, type UnenrichedTransaction } from "../enrich";

function parseQifDate(raw: string, dateOrder: "DMY" | "MDY"): string | null {
  const trimmed = raw.trim();
  // QIF dates commonly appear as MM/DD/YYYY, MM/DD'YY, or MM-DD-YYYY --
  // normalize the apostrophe-year variant some Quicken exports use.
  const normalized = trimmed.replace(/'/g, "/");
  const m = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!m) return null;
  let [, first, second, year] = m;
  if (year.length === 2) year = `20${year}`;
  return resolveAmbiguousDate(first, second, year, dateOrder);
}

export type QifParseResult = {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    memo: string | null;
  }>;
  warnings: string[];
};

export function parseQifText(content: string): QifParseResult {
  // Strip a leading UTF-8 BOM if present, same as every other structured-
  // text parser in this app. The corrupted first line here would typically
  // just be the "!Type:Bank" header, which is already ignored either way --
  // but applied for consistency rather than relying on that reasoning alone.
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const warnings: string[] = [];
  const lines = content.split(/\r\n|\r|\n/);
  const dateOrder = inferDateOrder(content);

  const transactions: QifParseResult["transactions"] = [];
  let current: { date?: string; amount?: number; payee?: string; memo?: string } = {};
  let recordCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("!")) continue; // account/type header line, e.g. "!Type:Bank" -- not a transaction field

    const prefix = line[0];
    const value = line.slice(1);

    if (prefix === "^") {
      // End of record -- commit what was gathered, then reset for the next one.
      recordCount++;
      if (current.date && current.amount !== undefined) {
        transactions.push({
          date: current.date,
          description: current.payee || current.memo || "(no description)",
          amount: current.amount,
          memo: current.memo && current.memo !== current.payee ? current.memo : null,
        });
      }
      current = {};
      continue;
    }

    switch (prefix) {
      case "D": {
        const iso = parseQifDate(value, dateOrder);
        if (iso) current.date = iso;
        break;
      }
      case "T":
      case "U": // some QIF variants use U for amount instead of/alongside T
        {
          const cleaned = value.replace(/,/g, "");
          const amount = parseFloat(cleaned);
          if (!isNaN(amount)) current.amount = amount;
        }
        break;
      case "P":
        current.payee = value;
        break;
      case "M":
        current.memo = value;
        break;
      // L (category), N (check number), C (cleared status), and other
      // fields exist in real QIF files but aren't needed for a
      // statement-to-spreadsheet conversion -- intentionally ignored
      // rather than mis-mapped into a field they don't belong in.
      default:
        break;
    }
  }

  const skipped = recordCount - transactions.length;
  if (skipped > 0) {
    warnings.push(`${skipped} of ${recordCount} record${recordCount === 1 ? "" : "s"} had a missing or unparseable date/amount and were skipped.`);
  }
  if (recordCount === 0) {
    warnings.push("No transaction records (lines ending in a bare ^) were found. This may not be a valid QIF export.");
  }

  return { transactions, warnings };
}

function qifResultToTransactionsRaw(result: QifParseResult, sourceFile: string): UnenrichedTransaction[] {
  return result.transactions.map((t, i) => ({
    id: `${sourceFile}-${i}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    balance: null, // QIF, like IIF/OFX, has no running-balance concept per transaction
    sourceFile,
    sourcePage: 1,
    confidence: 96, // fully structured, tagged data -- same reasoning as OFX/IIF
    sourceLines: [],
    valueDate: null,
    tranType: null,
    tranId: null,
    chequeDetails: null,
    drCr: t.amount >= 0 ? "Cr" : "Dr",
  }));
}

/**
 * Public entry point. Wraps the raw mapper with the shared enrichment pass so
 * every input format yields payee/method/category identically -- see
 * src/lib/enrich/index.ts.
 */
export function qifResultToTransactions(...args: Parameters<typeof qifResultToTransactionsRaw>): Transaction[] {
  return enrichTransactions(qifResultToTransactionsRaw(...args));
}
