import type { PageText } from "../pdf/extract-text";
import type { TextItem } from "../pdf/extract-text";

/**
 * Turns a badly-parsed statement into a bug report that can be shared safely.
 *
 * The constraint this is built around: the product's central claim is that a
 * statement never leaves the device, and the comparison pages actively invite
 * people to verify that in the Network tab. So no automatic upload of the file
 * is possible, and none happens here -- this produces a JSON blob the user
 * downloads and chooses whether to send.
 *
 * What makes it work is that every parser bug fixed in this codebase has been
 * GEOMETRIC rather than textual:
 *
 *   - wrapped-cell continuations attaching to the wrong anchor (row-index ties
 *     resolved the wrong way, fixed by comparing vertical distance)
 *   - repeated page furniture absorbed into the last transaction on a page
 *   - column classification from header x-positions
 *   - decimal separator and date order inferred per document
 *
 * None of those needed the real merchant names or the real amounts. They
 * needed token positions, token shapes, and the separators between them. So we
 * keep the geometry exactly and destroy the content.
 *
 * Three different treatments, because a blanket scramble would break the very
 * bugs this exists to catch:
 *
 *   TEXT      -> letters become X/x, digits become 9. Payees and descriptions
 *                are the most identifying part of a statement and carry no
 *                information the parser needs.
 *   DATES     -> preserved verbatim. Date-order inference depends on seeing a
 *                value above 12 somewhere in the document; randomising digits
 *                would destroy the exact bug class. A bare list of dates is
 *                close to non-identifying on its own.
 *   AMOUNTS   -> digits randomised, separators and length preserved. Number
 *                format inference only cares about where the separators fall
 *                ("9.999,99" behaves identically to "1.234,56"), and the real
 *                figures are somebody's salary.
 */

export type RedactedItem = { str: string; x: number; y: number; width: number; height: number };
export type RedactedPage = { pageNumber: number; items: RedactedItem[] };

export type DiagnosticBundle = {
  version: 1;
  createdAt: string;
  /** What the parser concluded, so a maintainer can compare against the pages. */
  meta: {
    detectedBank: string | null;
    currency: string | null;
    pageCount: number;
    transactionsFound: number;
    flaggedRows: number;
    reconciliationBreaks: number[];
    warnings: string[];
    ocrUsed: boolean;
  };
  pages: RedactedPage[];
};

/** Date-shaped: 03-04-2025, 2025/04/03, 15-Jan-2025, 03.04.2025 */
const DATE_RE =
  /^\(?(\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s]?[A-Za-z]{3}[-\s]?\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\)?$/;

/** Amount-shaped: any run of digits with grouping and/or a decimal part. */
const AMOUNT_RE = /^\(?[+-]?[$£€¥₹₩₪₺R]?\s?[\d][\d.,'\s]*\d\)?[CDcd]?$/;

/** Deterministic per-bundle digit shuffle, so the same input redacts the same way. */
function makeDigitScrambler(seed: number) {
  let s = seed >>> 0;
  return () => {
    // xorshift32 -- no crypto needed, this only has to be non-reversible
    // enough that a redacted amount can't be read back as the original.
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return String(s % 10);
  };
}

function redactToken(raw: string, nextDigit: () => string): string {
  const t = raw.trim();
  if (!t) return raw;

  // Dates survive intact -- see the module comment.
  if (DATE_RE.test(t)) return raw;

  if (AMOUNT_RE.test(t)) {
    // Keep every separator, sign, symbol and the token's length; replace only
    // the digits. Leading digit is never 0 so magnitude stays plausible.
    let first = true;
    return raw.replace(/\d/g, () => {
      if (first) {
        first = false;
        const d = nextDigit();
        return d === "0" ? "1" : d;
      }
      return nextDigit();
    });
  }

  // Everything else: preserve case shape and all punctuation, destroy content.
  return raw.replace(/[A-Z]/g, "X").replace(/[a-z]/g, "x").replace(/\d/g, "9");
}

export function redactPages(pages: PageText[], seed = 0x9e3779b9): RedactedPage[] {
  const nextDigit = makeDigitScrambler(seed);
  return pages.map((p) => ({
    pageNumber: p.pageNumber,
    items: p.items.map((it: TextItem) => ({
      str: redactToken(it.str, nextDigit),
      // Rounded to 1dp: enough precision for every geometric rule in the
      // parser (row clustering tolerance is 3, tie-breaks compare gaps of
      // several points), and it keeps the bundle small.
      x: Math.round(it.x * 10) / 10,
      y: Math.round(it.y * 10) / 10,
      width: Math.round((it.width ?? 0) * 10) / 10,
      height: Math.round((it.height ?? 0) * 10) / 10,
    })),
  }));
}
