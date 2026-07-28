import type { Transaction } from "../statement-store";
import { sortByDate, triggerDownload } from "./types";

function qifDate(iso: string): string {
  // QIF's classic US format: MM/DD/YYYY
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

/** QIF is one field per line -- an embedded newline in a description would split the P-line into multiple lines, corrupting the record structure (and if the injected text happened to start with a recognized prefix like D/T/^, could even fake a new field or record boundary on re-import). */
function qifField(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

/**
 * Generates a QIF file, bank-account type. QIF is a plain line-based format:
 * D = date, T = amount, P = payee/description, ^ = end of record.
 */
export function exportToQif(transactions: Transaction[], fileName: string) {
  const lines: string[] = ["!Type:Bank"];

  for (const t of sortByDate(transactions)) {
    lines.push(`D${qifDate(t.date)}`);
    lines.push(`T${t.amount.toFixed(2)}`);
    lines.push(`P${qifField(t.description)}`);
    lines.push("^");
  }

  const blob = new Blob([lines.join("\n")], { type: "application/qif" });
  triggerDownload(blob, fileName);
}
