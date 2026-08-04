import * as XLSX from "xlsx";
import type { Transaction } from "../statement-store";
import type { ExportOptions } from "./types";
import { sortByDate, triggerDownload } from "./types";

/** Groups transactions by their source statement file, for "one sheet per statement". */
function groupByFile(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const arr = map.get(t.sourceFile) ?? [];
    arr.push(t);
    map.set(t.sourceFile, arr);
  }
  return map;
}

// A small set of common currency symbols for the Excel number format string.
// Falls back to a plain "#,##0.00" (no symbol) for anything not listed here,
// rather than guessing a symbol we're not sure of.
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", EUR: "€", JPY: "¥", AUD: "A$", CAD: "C$", SGD: "S$",
};

function amountNumFmt(currency: string | null): string {
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : undefined;
  return symbol ? `"${symbol}"#,##0.00` : "#,##0.00";
}

function buildSheetRows(transactions: Transaction[], options: ExportOptions) {
  const sorted = sortByDate(transactions);
  // Computed once across the whole batch (not per-row) so every row gets the
  // same set of columns -- Excel's column order comes from each row object's
  // own key insertion order, so inconsistent keys between rows would produce
  // misaligned data.
  const hasValueDate = sorted.some((t) => t.valueDate !== null);
  const hasTranType = sorted.some((t) => t.tranType !== null);
  const hasTranId = sorted.some((t) => t.tranId !== null);
  const hasChequeDetails = sorted.some((t) => t.chequeDetails !== null);
  // Derived columns -- see to-csv.ts for why these are gated on both the
  // option and on real data being present.
  const hasAccount = sorted.some((t) => t.account !== null);
  const hasPayee = options.includeEnrichment && sorted.some((t) => t.payee && t.payee !== t.description);
  const hasCategory = options.includeEnrichment && sorted.some((t) => t.category !== null);

  const rows: Record<string, string | number>[] = [];
  for (const t of sorted) {
    const row: Record<string, string | number> = { Date: t.date };
    if (hasAccount) row["Account"] = t.account ?? "";
    if (hasValueDate) row["Value Date"] = t.valueDate ?? "";
    if (hasPayee) row["Payee"] = t.payee;
    row["Description"] = t.description;
    if (hasCategory) row["Category"] = t.category ?? "";
    if (hasTranType) row["Tran Type"] = t.tranType ?? "";
    if (hasTranId) row["Tran ID"] = t.tranId ?? "";
    if (hasChequeDetails) row["Cheque Details"] = t.chequeDetails ?? "";
    if (options.splitDebitCredit) {
      row["Debit"] = t.amount < 0 ? Math.abs(t.amount) : "";
      row["Credit"] = t.amount > 0 ? t.amount : "";
    } else {
      row["Amount"] = t.amount;
    }
    row["Dr/Cr"] = t.drCr;
    if (options.includeBalance) row["Balance"] = t.balance ?? "";
    if (options.includeSourcePage) row["Source Page"] = t.sourcePage;
    rows.push(row);
  }
  return rows;
}

/** Applies a currency number format to the numeric amount/balance columns, keeping cells as real numbers (not strings) so sorting/formulas still work. */
function applyCurrencyFormat(ws: XLSX.WorkSheet, headerRow: string[], options: ExportOptions, currency: string | null) {
  if (!options.includeCurrencySymbol) return;
  const numFmt = amountNumFmt(currency);
  const amountCols = ["Amount", "Debit", "Credit", "Balance"];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  headerRow.forEach((header, colIdx) => {
    if (!amountCols.includes(header)) return;
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
      const cell = ws[cellRef];
      if (cell && typeof cell.v === "number") cell.z = numFmt;
    }
  });
}

export function exportToXlsx(
  transactions: Transaction[],
  options: ExportOptions,
  fileName: string,
  oneSheetPerStatement: boolean,
  currency: string | null = null
) {
  const wb = XLSX.utils.book_new();

  // A multi-account OFX/QBO download is one FILE but several statements, so
  // grouping by sourceFile would still merge them. Account grouping takes
  // precedence when the file carries more than one, which is the behaviour
  // that makes a bundled download usable at all.
  const accounts = [...new Set(transactions.map((t) => t.account).filter((a): a is string => !!a))];
  if (accounts.length > 1) {
    for (const account of accounts) {
      const txns = transactions.filter((t) => t.account === account);
      const sheetRows = buildSheetRows(txns, options);
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      if (sheetRows.length > 0) applyCurrencyFormat(ws, Object.keys(sheetRows[0]), options, currency);
      // Excel caps sheet names at 31 chars and forbids : \ / ? * [ ]
      const sheetName = account.replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  } else if (oneSheetPerStatement) {
    const groups = groupByFile(transactions);
    let i = 0;
    for (const [sourceFile, txns] of groups) {
      i++;
      const sheetName = sanitizeSheetName(sourceFile, i);
      const sheetRows = buildSheetRows(txns, options);
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      if (sheetRows.length > 0) applyCurrencyFormat(ws, Object.keys(sheetRows[0]), options, currency);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  } else {
    const sheetRows = buildSheetRows(transactions, options);
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    if (sheetRows.length > 0) applyCurrencyFormat(ws, Object.keys(sheetRows[0]), options, currency);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  }

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, fileName);
}

function sanitizeSheetName(name: string, index: number): string {
  // Excel sheet names: max 31 chars, no []:*?/\
  const cleaned = name.replace(/\.[^.]+$/, "").replace(/[\[\]:*?/\\]/g, "");
  const truncated = cleaned.slice(0, 25) || `Statement`;
  return `${truncated}_${index}`.slice(0, 31);
}
