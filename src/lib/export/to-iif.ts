import type { Transaction } from "../statement-store";
import { sortByDate, triggerDownload } from "./types";

function iifDate(iso: string): string {
  // IIF's standard US date format: M/D/YYYY (no leading zeros required, but
  // QuickBooks accepts either -- using padded form for consistency/clarity).
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${parseInt(m[2], 10)}/${parseInt(m[3], 10)}/${m[1]}`;
}

/** IIF fields are tab-separated, one record per line -- a stray tab or newline inside a description would corrupt the structure (a tab breaks column alignment; a newline splits one record into multiple malformed lines). Neither is a realistic thing to preserve literally in a single-line field. */
function iifField(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ");
}

/**
 * Generates an IIF file (QuickBooks Desktop's tab-delimited import format),
 * one TRNS/SPL/ENDTRNS block per transaction -- the standard structure for
 * a simple bank-transaction import, offsetting each transaction against a
 * single "Uncategorized" expense/income account (the same convention real
 * bank-to-IIF converters use, since we don't know the real chart-of-accounts
 * categorization for these transactions -- the user assigns real accounts
 * inside QuickBooks after import).
 */
export function exportToIif(transactions: Transaction[], fileName: string) {
  const lines: string[] = [
    "!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO",
    "!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tMEMO",
    "!ENDTRNS",
  ];

  sortByDate(transactions).forEach((t, i) => {
    const id = i + 1;
    const date = iifDate(t.date);
    const type = t.amount >= 0 ? "DEPOSIT" : "CHECK";
    const offsetAccount = t.amount >= 0 ? "Uncategorized Income" : "Uncategorized Expense";
    const name = iifField(t.description);
    const memo = iifField(t.description);

    lines.push(`TRNS\t${id}\t${type}\t${date}\tBank Account\t${name}\t${t.amount.toFixed(2)}\t\t${memo}`);
    lines.push(`SPL\t${id}\t${type}\t${date}\t${offsetAccount}\t${(-t.amount).toFixed(2)}\t${memo}`);
    lines.push("ENDTRNS");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, fileName);
}
