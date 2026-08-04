/**
 * Parser for OFX and QFX files (Open Financial Exchange -- QFX is the same
 * format with Quicken-specific headers like INTU.BID, same STMTTRN
 * structure, so one parser handles both). Real, structured text -- no OCR,
 * no layout inference.
 *
 * OFX has two real-world flavors that both need handling:
 * - SGML-style (OFX 1.x, still the most common in practice): tags don't
 *   need closing tags on leaf elements -- "<DTPOSTED>20250601120000" with
 *   no "</DTPOSTED>" is valid. This is exactly the style our own
 *   to-ofx.ts export generator produces.
 * - XML-style (OFX 2.x): proper closing tags, "<DTPOSTED>20250601120000
 *   </DTPOSTED>".
 *
 * Rather than a real SGML/XML parser (overkill for OFX's flat structure),
 * this extracts each <STMTTRN>...</STMTTRN> block via regex, then pulls
 * individual fields from within each block the same way -- works for both
 * flavors since a field regex like /<DTPOSTED>([^<\r\n]+)/ matches the
 * value whether or not a closing tag follows on the same or next line.
 */

import type { Transaction } from "../statement-store";
import { enrichTransactions, type UnenrichedTransaction } from "../enrich";

function ofxField(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

/** OFX dates are YYYYMMDD, optionally followed by a time and/or timezone offset (e.g. "20250601120000" or "20250601120000[-5:EST]") -- only the date portion matters here. */
function parseOfxDate(raw: string): string | null {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export type OfxParseResult = {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    tranId: string | null;
    tranType: string | null;
  }>;
  currency: string | null;
  balance: number | null;
  warnings: string[];
};

export function parseOfxText(content: string): OfxParseResult {
  // Strip a leading UTF-8 BOM if present, same as every other structured-
  // text parser in this app -- applied defensively here even though OFX's
  // regex-based matching isn't anchored to the start of the string (so a
  // BOM is less likely to break it the way it did for IIF/CSV), for
  // consistency rather than relying on that reasoning alone.
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const warnings: string[] = [];

  // <STMTTRN> blocks -- non-greedy match up to the closing tag OR the next
  // <STMTTRN> (covers SGML files that never close the tag at all).
  const blockRe = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/STMTTRN>|<\/BANKTRANLIST>|<\/BANKMSGSRSV1>)/gi;
  const blocks = [...content.matchAll(blockRe)].map((m) => m[1]);

  if (blocks.length === 0) {
    warnings.push("No <STMTTRN> transaction records were found. This may not be a valid OFX/QFX file, or it may use a variant this parser doesn't recognize.");
  }

  const transactions: OfxParseResult["transactions"] = [];
  let skipped = 0;

  for (const block of blocks) {
    const dtposted = ofxField(block, "DTPOSTED");
    const trnamt = ofxField(block, "TRNAMT");
    const iso = dtposted ? parseOfxDate(dtposted) : null;
    const amount = trnamt ? parseFloat(trnamt.replace(/,/g, "")) : NaN;

    if (!iso || isNaN(amount)) {
      skipped++;
      continue;
    }

    // NAME is the primary payee/description field; MEMO is supplementary
    // detail some banks include alongside it, not instead of it -- combine
    // when both are present and genuinely different, same principle as the
    // PDF pipeline's description cleanup.
    const name = ofxField(block, "NAME");
    const memo = ofxField(block, "MEMO");
    const description = name && memo && memo !== name ? `${name} — ${memo}` : name || memo || "(no description)";

    transactions.push({
      date: iso,
      description,
      amount,
      tranId: ofxField(block, "FITID"),
      tranType: ofxField(block, "TRNTYPE"),
    });
  }

  if (skipped > 0) {
    warnings.push(`${skipped} transaction record${skipped === 1 ? "" : "s"} had a missing or unparseable date/amount and were skipped.`);
  }

  const curdefMatch = content.match(/<CURDEF>([A-Z]{3})/i);
  const balMatch = content.match(/<BALAMT>([^\r\n<]+)/i);

  return {
    transactions,
    currency: curdefMatch ? curdefMatch[1].toUpperCase() : null,
    balance: balMatch ? parseFloat(balMatch[1].replace(/,/g, "")) : null,
    warnings,
  };
}

function ofxResultToTransactionsRaw(result: OfxParseResult, sourceFile: string): UnenrichedTransaction[] {
  // OFX gives one ledger balance (as-of a point in time), not a running
  // balance per transaction the way a bank statement PDF does -- so
  // per-row balance is genuinely unknown here, same situation as IIF.
  return result.transactions.map((t, i) => ({
    id: `${sourceFile}-${i}`,
    date: t.date,
    description: t.description,
    amount: t.amount,
    balance: null,
    sourceFile,
    sourcePage: 1,
    // OFX is fully structured, tagged data -- not a layout-inferred PDF
    // read or an OCR guess, so a flat high-confidence score is honest here.
    confidence: 96,
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
export function ofxResultToTransactions(...args: Parameters<typeof ofxResultToTransactionsRaw>): Transaction[] {
  return enrichTransactions(ofxResultToTransactionsRaw(...args));
}
