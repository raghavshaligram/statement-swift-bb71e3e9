/**
 * Generic CSV importer: takes an arbitrary bank/tool CSV export (not a
 * fixed schema -- unlike IIF/OFX, CSV has no banking standard, every bank
 * and tool invents its own column names and layout) and produces the app's
 * real Transaction shape. Design decision (made explicitly, not a default):
 * best-effort header auto-detection first, since most real CSV exports do
 * have sensible column headers -- a mandatory manual-mapping step on every
 * upload would add friction for the common case to guard against an
 * uncommon one. Falls back to reporting what couldn't be detected rather
 * than guessing silently wrong.
 */

import { inferDateOrder, resolveAmbiguousDate } from "../pdf/date-inference";
import type { Transaction } from "../statement-store";
import { enrichTransactions, type UnenrichedTransaction } from "../enrich";

export type CsvColumnRole = "date" | "description" | "amount" | "debit" | "credit" | "balance" | "ignore";

type ColumnMapping = { index: number; role: CsvColumnRole; header: string };

export type CsvParseResult = {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    balance: number | null;
  }>;
  warnings: string[];
  mapping: ColumnMapping[] | null; // null if header detection failed entirely
};

// Header keyword patterns, same spirit as detect-columns.ts's ROLE_KEYWORDS
// but simpler -- CSV columns are identified by index, not x-position, so no
// column-boundary math is needed, just a name-to-role lookup per header cell.
const HEADER_PATTERNS: Array<{ role: CsvColumnRole; patterns: RegExp[] }> = [
  { role: "date", patterns: [/^date$/i, /^transaction date$/i, /^txn date$/i, /^posted date$/i] },
  { role: "description", patterns: [/^description$/i, /^particulars?$/i, /^narration$/i, /^details?$/i, /^payee$/i, /^memo$/i, /^merchant$/i] },
  { role: "debit", patterns: [/^debit$/i, /^withdrawals?$/i, /^money out$/i, /^dr\.?$/i] },
  { role: "credit", patterns: [/^credit$/i, /^deposits?$/i, /^money in$/i, /^cr\.?$/i] },
  { role: "amount", patterns: [/^amount$/i, /^amt\.?$/i, /^value$/i] },
  { role: "balance", patterns: [/^balance$/i, /^closing balance$/i, /^running balance$/i] },
];

function matchHeaderRole(header: string): CsvColumnRole {
  const cleaned = header.trim().replace(/["']/g, "");
  for (const { role, patterns } of HEADER_PATTERNS) {
    if (patterns.some((p) => p.test(cleaned))) return role;
  }
  return "ignore";
}

/**
 * Detects the delimiter by checking which candidate produces the most
 * consistent field count across the first several lines -- real CSVs vary
 * (comma is the US/UK norm, semicolon is common across continental Europe
 * since those locales use comma as the decimal separator).
 */
function detectDelimiter(lines: string[]): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestScore = -1;
  for (const delim of candidates) {
    const counts = lines.slice(0, 10).map((l) => splitCsvLine(l, delim).length);
    const nonTrivial = counts.filter((c) => c > 1);
    if (nonTrivial.length === 0) continue;
    // Score: how consistent the field count is across sampled lines, and
    // how many fields it produces (a real delimiter should split into
    // several columns, not just 1-2).
    const mode = nonTrivial.sort((a, b) => nonTrivial.filter((v) => v === a).length - nonTrivial.filter((v) => v === b).length).pop()!;
    const consistency = nonTrivial.filter((c) => c === mode).length / nonTrivial.length;
    const score = consistency * mode;
    if (score > bestScore) {
      bestScore = score;
      best = delim;
    }
  }
  return best;
}

/** Splits one CSV line respecting quoted fields (a quoted field can contain the delimiter itself, e.g. a description with a comma inside). */
function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/**
 * European CSVs (semicolon-delimited, since those locales use comma as the
 * decimal separator, which would collide with a comma delimiter) write
 * amounts like "850,00" -- comma as the decimal point, not a thousands
 * separator. Stripping the comma unconditionally (the US/UK convention)
 * would silently corrupt every European amount into a wrong, much larger
 * number ("850,00" -> "85000"). isEuropean is passed based on the detected
 * delimiter, not guessed per-amount.
 */
function parseCsvAmount(raw: string, isEuropean: boolean): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const negative = /^\(.*\)$/.test(trimmed) || trimmed.startsWith("-");
  let cleaned = trimmed.replace(/[()$£€¥₹+\s-]/g, "");
  if (isEuropean) {
    // "1.234,56" -> strip the thousands-separator periods, then swap the
    // decimal comma for a period so parseFloat reads it correctly.
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;
  return negative ? -Math.abs(value) : value;
}

const NUMERIC_DATE_RE = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseCsvDate(raw: string, dateOrder: "DMY" | "MDY"): string | null {
  const trimmed = raw.trim();
  const iso = trimmed.match(ISO_DATE_RE);
  if (iso) return trimmed;
  const numeric = trimmed.match(NUMERIC_DATE_RE);
  if (numeric) {
    let [, first, second, year] = numeric;
    if (year.length === 2) year = `20${year}`;
    return resolveAmbiguousDate(first, second, year, dateOrder);
  }
  return null;
}

export function parseCsvText(content: string): CsvParseResult {
  const warnings: string[] = [];
  // Strip a leading UTF-8 BOM if present -- extremely common in real bank
  // CSV exports (many banking systems and Excel itself prepend one so Excel
  // reliably detects UTF-8 on open, the same reason to-csv.ts's own export
  // now adds one). Confirmed as a real, silent failure without this: the
  // BOM attaches to the first header cell ("Date" becomes the unrecognized
  // "\uFEFFDate"), which broke header detection entirely and produced zero
  // transactions with a confusing "couldn't identify columns" warning.
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const rawLines = content.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length < 2) {
    return { transactions: [], warnings: ["This file doesn't have enough rows to contain a header and any data."], mapping: null };
  }

  const delimiter = detectDelimiter(rawLines);
  const headerRow = splitCsvLine(rawLines[0], delimiter);
  const mapping: ColumnMapping[] = headerRow.map((header, index) => ({
    index,
    role: matchHeaderRole(header),
    header,
  }));

  const dateCol = mapping.find((m) => m.role === "date");
  const descCol = mapping.find((m) => m.role === "description");
  const amountCol = mapping.find((m) => m.role === "amount");
  const debitCol = mapping.find((m) => m.role === "debit");
  const creditCol = mapping.find((m) => m.role === "credit");
  const balanceCol = mapping.find((m) => m.role === "balance");

  if (!dateCol || (!amountCol && !debitCol && !creditCol)) {
    return {
      transactions: [],
      warnings: [
        `Couldn't confidently identify the date and amount columns from this file's headers (found: ${headerRow.join(", ")}). This CSV's column names may not match a recognized pattern.`,
      ],
      mapping,
    };
  }

  const isEuropean = delimiter === ";"; // semicolon delimiter is the real, well-established signal for comma-decimal locales
  // Semicolon delimiter is a real, independent signal that this is a
  // European-locale file -- DMY is the standard convention there, but
  // inferDateOrder's own ambiguous-date fallback defaults slash-separated
  // dates to MDY (a reasonable prior for the PDF bank-statement case it was
  // originally built for, which skews US-heavy, but wrong here). Override
  // rather than rely on that fallback for this file type. Confirmed as a
  // real bug via a real test file: "01/06/2025" (June 1st) was parsed as
  // January 6th before this fix.
  const dateOrder = isEuropean ? "DMY" : inferDateOrder(content);
  const transactions: CsvParseResult["transactions"] = [];
  let skipped = 0;

  for (const line of rawLines.slice(1)) {
    const fields = splitCsvLine(line, delimiter);
    const dateRaw = fields[dateCol.index] ?? "";
    const iso = parseCsvDate(dateRaw, dateOrder);
    if (!iso) {
      skipped++;
      continue;
    }

    let amount: number | null = null;
    if (amountCol) {
      amount = parseCsvAmount(fields[amountCol.index] ?? "", isEuropean);
    } else {
      const debit = debitCol ? parseCsvAmount(fields[debitCol.index] ?? "", isEuropean) : null;
      const credit = creditCol ? parseCsvAmount(fields[creditCol.index] ?? "", isEuropean) : null;
      if (credit !== null) amount = Math.abs(credit);
      else if (debit !== null) amount = -Math.abs(debit);
    }
    if (amount === null) {
      skipped++;
      continue;
    }

    const balance = balanceCol ? parseCsvAmount(fields[balanceCol.index] ?? "", isEuropean) : null;
    const description = descCol ? fields[descCol.index] ?? "" : "(no description column detected)";

    transactions.push({ date: iso, description: description || "(no description)", amount, balance });
  }

  if (skipped > 0) {
    warnings.push(`${skipped} row${skipped === 1 ? "" : "s"} had a missing or unparseable date/amount and were skipped.`);
  }
  if (transactions.length === 0) {
    warnings.push("No valid transaction rows were found after the header. Double-check this is really a transaction export, not a summary or report file.");
  }

  return { transactions, warnings, mapping };
}

/**
 * Converts a parsed CSV result into the app's real Transaction shape --
 * same pattern as every other structured-format parser
 * (iifResultToTransactions, ofxResultToTransactions, etc.). Previously this
 * mapping was only inlined once, directly in parse-statement.ts; extracted
 * here as a proper exported helper so a second caller (the standalone
 * csv-to-iif/qif/ofx page converters) can reuse the exact same logic
 * instead of a second, drift-prone copy of it.
 */
function csvResultToTransactionsRaw(result: CsvParseResult, sourceFile: string): UnenrichedTransaction[] {
  return result.transactions.map((t, i) => ({
    id: `${sourceFile}-${i}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    balance: t.balance,
    sourceFile,
    sourcePage: 1,
    // Auto-detected header mapping is a real, unambiguous signal once it
    // succeeds (unlike a layout-inferred PDF read) -- but genuinely lower
    // confidence than IIF's fully-structured tags, since CSV column
    // *names* are inferred from arbitrary, non-standardized header text
    // rather than a fixed schema.
    confidence: 88,
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
export function csvResultToTransactions(...args: Parameters<typeof csvResultToTransactionsRaw>): Transaction[] {
  return enrichTransactions(csvResultToTransactionsRaw(...args));
}
