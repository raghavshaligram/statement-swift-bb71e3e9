/**
 * Parser for MT940 files (SWIFT's bank statement format -- an international
 * standard, common outside the US/UK/India markets this app otherwise
 * focuses on, hence its lower priority in the build queue, but still real,
 * structured text with no OCR/layout inference needed).
 *
 * Tag-based format, each line starting with ":NN:" (a 2-digit tag, optional
 * letter suffix). The tags that matter for transaction extraction:
 *   :61:  Statement line -- one per transaction, a fixed-field format:
 *         YYMMDD[MMDD] D/C [fundscode] amount txntype reference[//suppl]
 *         e.g. ":61:2506010601D850,00NTRFNONREF//"
 *   :86:  Information to account owner -- the narrative/description for
 *         the transaction in the PRECEDING :61: line, not a separate record.
 *   :60F:/:60M: Opening balance, :62F:/:62M: Closing balance -- same fixed
 *         format as the amount portion of :61:, used here for currency
 *         detection, not per-transaction running balance (MT940, like
 *         OFX/QIF/IIF, doesn't carry a running balance per line).
 */

import type { Transaction } from "../statement-store";

// :61: field: YYMMDD, optional MMDD entry-date, D/C (or reversal RD/RC)
// mark, optional single-letter funds code, then a comma-decimal amount.
const STMT_LINE_RE = /^(\d{2})(\d{2})(\d{2})(?:\d{4})?(R?[DC])[A-Z]?(\d+,\d*)/;
// :60F:/:62F: field: D/C mark, YYMMDD, 3-letter currency, comma-decimal amount.
const BALANCE_RE = /^([DC])(\d{2})(\d{2})(\d{2})([A-Z]{3})(\d+,\d*)/;

function mt940Amount(raw: string): number {
  // Comma is the decimal marker (SWIFT/European convention), same
  // reasoning as the CSV importer's European-amount handling.
  return parseFloat(raw.replace(",", "."));
}

function mt940Date(yy: string, mm: string, dd: string): string {
  const year = parseInt(yy, 10) < 70 ? `20${yy}` : `19${yy}`; // standard SWIFT century pivot
  return `${year}-${mm}-${dd}`;
}

export type Mt940ParseResult = {
  transactions: Array<{ date: string; description: string; amount: number }>;
  currency: string | null;
  warnings: string[];
};

/** Splits the file into {tag, content} pairs -- a tag's content can span multiple physical lines until the next ":NN:" tag starts. */
function splitTags(content: string): Array<{ tag: string; value: string }> {
  const lines = content.split(/\r\n|\r|\n/);
  const tags: Array<{ tag: string; value: string }> = [];
  for (const line of lines) {
    const m = line.match(/^:(\d{2}[A-Z]?):(.*)$/);
    if (m) {
      tags.push({ tag: m[1], value: m[2] });
    } else if (tags.length > 0 && line.trim()) {
      // Continuation of the previous tag's value onto a new physical line.
      tags[tags.length - 1].value += " " + line.trim();
    }
  }
  return tags;
}

export function parseMt940Text(content: string): Mt940ParseResult {
  // Strip a leading UTF-8 BOM if present, same as every other structured-
  // text parser in this app -- MT940's tag regex is start-anchored (^:) per
  // line, so a BOM prefixing the first tag (typically :20:, not needed for
  // transaction extraction) could genuinely break that one line the same
  // way it did for IIF's header line.
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const warnings: string[] = [];
  const tags = splitTags(content);
  const transactions: Mt940ParseResult["transactions"] = [];
  let currency: string | null = null;
  let skipped = 0;
  let stmtLineCount = 0;

  for (let i = 0; i < tags.length; i++) {
    const { tag, value } = tags[i];

    if ((tag === "60F" || tag === "60M" || tag === "62F" || tag === "62M") && !currency) {
      const m = value.match(BALANCE_RE);
      if (m) currency = m[5];
    }

    if (tag !== "61") continue;
    stmtLineCount++;

    const m = value.match(STMT_LINE_RE);
    if (!m) {
      skipped++;
      continue;
    }
    const [, yy, mm, dd, mark, amountRaw] = m;
    const date = mt940Date(yy, mm, dd);
    const amount = mt940Amount(amountRaw);
    const isDebit = mark.endsWith("D"); // D or RD (reversal of a credit is effectively a debit line)
    const signedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);

    // The immediately-following :86: tag (if any) is this transaction's
    // narrative -- not a separate record.
    const next = tags[i + 1];
    const description = next && next.tag === "86" ? next.value.trim() : "(no description)";

    transactions.push({ date, description: description || "(no description)", amount: signedAmount });
  }

  if (skipped > 0) {
    warnings.push(`${skipped} of ${stmtLineCount} statement line${stmtLineCount === 1 ? "" : "s"} didn't match the expected MT940 format and were skipped.`);
  }
  if (stmtLineCount === 0) {
    warnings.push("No :61: statement lines were found. This may not be a valid MT940 file.");
  }

  return { transactions, currency, warnings };
}

export function mt940ResultToTransactions(result: Mt940ParseResult, sourceFile: string): Transaction[] {
  return result.transactions.map((t, i) => ({
    id: `${sourceFile}-${i}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    balance: null,
    sourceFile,
    sourcePage: 1,
    confidence: 94, // structured, tagged data, slightly more conservative than OFX/IIF given MT940's fixed-width field parsing has more room for real-world format variance
    sourceLines: [],
    valueDate: null,
    tranType: null,
    tranId: null,
    chequeDetails: null,
    drCr: t.amount >= 0 ? "Cr" : "Dr",
  }));
}
