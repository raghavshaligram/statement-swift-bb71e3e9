import type { Transaction } from "../statement-store";
import type { ExportOptions } from "./types";
import { sortByDate, triggerDownload } from "./types";
import { formatAmount } from "../pdf/detect-currency";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Forces Excel to treat a value as literal text rather than auto-converting
 * a long digit string to scientific notation (a real reported bug: a Tran
 * ID like "202607010001" was displayed as 2.02607E+11 on open). Wrapping in
 * ="..." is the standard trick -- Excel treats it as a formula that
 * evaluates to the literal text, displayed as-is rather than reformatted as
 * a number. Only applied where it matters: values that are entirely digits
 * and long enough to trigger Excel's auto-formatting (short numeric IDs like
 * "123" display fine as plain numbers and don't need this).
 */
function forceExcelText(value: string): string {
  if (/^\d{9,}$/.test(value)) return `="${value}"`;
  return value;
}

function fmt(value: number, options: ExportOptions, currency: string | null): string {
  return options.includeCurrencySymbol ? formatAmount(value, currency) : value.toFixed(2);
}

export function exportToCsv(
  transactions: Transaction[],
  options: ExportOptions,
  fileName: string,
  currency: string | null = null
) {
  const sorted = sortByDate(transactions);

  // These columns are only included when at least one transaction actually
  // has data for them -- most statements won't have Value Date/Tran Type/
  // Tran ID/Cheque Details at all (confirmed via a real sample that some do),
  // so cluttering every export with empty columns for statements that don't
  // would be worse than just leaving them out entirely.
  const hasValueDate = sorted.some((t) => t.valueDate !== null);
  const hasTranType = sorted.some((t) => t.tranType !== null);
  const hasTranId = sorted.some((t) => t.tranId !== null);
  const hasChequeDetails = sorted.some((t) => t.chequeDetails !== null);

  const headers = ["Date"];
  if (hasValueDate) headers.push("Value Date");
  headers.push("Description");
  if (hasTranType) headers.push("Tran Type");
  if (hasTranId) headers.push("Tran ID");
  if (hasChequeDetails) headers.push("Cheque Details");
  if (options.splitDebitCredit) headers.push("Debit", "Credit");
  else headers.push("Amount");
  headers.push("Dr/Cr");
  if (options.includeBalance) headers.push("Balance");
  if (options.includeSourcePage) headers.push("Source Page");

  const lines = [headers.join(",")];

  for (const t of sorted) {
    const row: (string | number)[] = [t.date];
    if (hasValueDate) row.push(t.valueDate ?? "");
    row.push(t.description);
    if (hasTranType) row.push(t.tranType ?? "");
    if (hasTranId) row.push(t.tranId !== null ? forceExcelText(t.tranId) : "");
    if (hasChequeDetails) row.push(t.chequeDetails !== null ? forceExcelText(t.chequeDetails) : "");
    if (options.splitDebitCredit) {
      row.push(t.amount < 0 ? fmt(Math.abs(t.amount), options, currency) : "", t.amount > 0 ? fmt(t.amount, options, currency) : "");
    } else {
      row.push(fmt(t.amount, options, currency));
    }
    row.push(t.drCr);
    if (options.includeBalance) row.push(t.balance !== null ? fmt(t.balance, options, currency) : "");
    if (options.includeSourcePage) row.push(t.sourcePage);
    lines.push(row.map(csvEscape).join(","));
  }

  // UTF-8 BOM prefix: without it, Excel defaults to guessing ANSI/
  // Windows-1252 for CSV files rather than reliably detecting UTF-8, which
  // is exactly what caused a real reported bug -- a genuine em-dash (used
  // to join NAME and MEMO in OFX/QFX descriptions) rendering as mojibake
  // ("â€”") when opened in Excel, even though the underlying bytes written
  // here were always correctly UTF-8 (Blob's string encoding is UTF-8 per
  // spec; this was purely an Excel-side detection problem, not a writing
  // bug -- confirmed by the fact the file was correct when read back by
  // anything that respects the declared UTF-8 charset).
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, fileName);
}
