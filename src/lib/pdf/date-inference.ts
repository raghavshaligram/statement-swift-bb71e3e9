/**
 * Infers whether a statement uses day-first (DD-MM / DD/MM) or month-first
 * (MM-DD / MM/DD) numeric date ordering, by scanning every numeric date-like
 * token in the whole document once, rather than guessing per-row.
 *
 * Why this matters: a token like "03-04-2025" is inherently ambiguous in
 * isolation — could be March 4 or April 3. But a single document is
 * internally consistent (a bank doesn't mix conventions within one
 * statement), so if ANY date elsewhere in the same document is unambiguous
 * (e.g. "25-04-2025" — no month 25 exists, so this must be day-first), that
 * resolves every ambiguous date in the document too.
 */

export type DateOrder = "DMY" | "MDY";

const NUMERIC_DATE_RE = /\b(\d{1,2})([-/])(\d{1,2})\2(\d{4})\b/g;
// Year-less fallback for statements where every date on the page is bare
// MM/DD (or DD/MM) with no year at all -- e.g. Chase, Wells Fargo, Capital
// One. NUMERIC_DATE_RE above finds zero matches on such a document (it
// requires a year), which previously meant NO separator evidence was ever
// collected and inferDateOrder fell straight to the hardcoded "DMY"
// default -- wrong for a "/"-separated US statement, where every date is
// year-less by convention. Bounded with a negative lookahead so it doesn't
// also match the leading MM/DD of a real year-bearing date (which
// NUMERIC_DATE_RE above already handles, and takes priority as unambiguous
// evidence when present).
const YEARLESS_DATE_RE = /\b(\d{1,2})([-/])(\d{1,2})\b(?!\2\d)/g;

/**
 * Scans the full document text for the first unambiguous numeric date and
 * returns its implied order. If no date in the document is independently
 * unambiguous, falls back to a separator-based prior rather than one flat
 * global default: slash-separated numeric dates (06/01/2025) are
 * conventionally MM/DD/YYYY (US statements), while dash-separated numeric
 * dates (06-01-2025) are conventionally DD-MM-YYYY (common in Indian/UK
 * statements). This is a real, useful signal — collapsing it to a single
 * default in either direction silently flips whichever convention doesn't
 * match the default on any statement too small to contain disambiguating
 * evidence of its own.
 */
export function inferDateOrder(fullText: string): DateOrder {
  let matches = [...fullText.matchAll(NUMERIC_DATE_RE)];
  if (matches.length === 0) {
    matches = [...fullText.matchAll(YEARLESS_DATE_RE)];
  }
  if (matches.length === 0) return "DMY";

  let slashCount = 0;
  let dashCount = 0;

  for (const m of matches) {
    const first = parseInt(m[1], 10);
    const second = parseInt(m[3], 10);
    const separator = m[2];

    if (first > 12 && second <= 12) return "DMY"; // unambiguous, overrides everything
    if (second > 12 && first <= 12) return "MDY"; // unambiguous, overrides everything

    if (separator === "/") slashCount++;
    else dashCount++;
  }

  // No unambiguous evidence anywhere in the document — fall back to the
  // separator-based prior, using whichever separator is more common in case
  // a document mixes (shouldn't normally happen, but stay deterministic).
  return slashCount >= dashCount ? "MDY" : "DMY";
}

/**
 * Infers the calendar year for statements that print dates as bare MM/DD (or
 * DD/MM) on every transaction row, with no year repeated per row -- common
 * on US bank statements (Chase, Wells Fargo, Capital One confirmed), where
 * the year appears once in a "Statement Period" line rather than per
 * transaction. Falls back to the most frequent 4-digit year-like token
 * anywhere in the document (restricted to a plausible statement range) if no
 * explicit period phrase is found, and finally to the current calendar year
 * as an honest last resort -- this is a best-effort hint, not a guarantee,
 * which is why callers still adjust it forward on month rollover per row.
 */
export function inferStatementYear(fullText: string): number {
  const periodMatch = fullText.match(
    /(?:statement period|for the period|statement date|closing date)[^\d]{0,20}(\d{4})/i,
  );
  if (periodMatch) return parseInt(periodMatch[1], 10);

  const years = [...fullText.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1], 10));
  if (years.length === 0) return new Date().getFullYear();

  const counts = new Map<number, number>();
  for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Resolves a year-less MM/DD (or DD/MM) pair using a running cursor that
 * starts at the document's inferred year and advances when the month
 * sequence rolls backward (e.g. December's transactions followed by
 * January's, on a statement that spans a year boundary) -- since rows are
 * processed in document order, a month that's meaningfully earlier than the
 * last one seen means the calendar has wrapped to the next year, not that
 * time ran backward.
 */
export function resolveYearlessDate(
  first: string,
  second: string,
  order: DateOrder,
  cursor: { year: number; lastMonth: number | null },
): string | null {
  const a = parseInt(first, 10);
  const b = parseInt(second, 10);

  let month: number, day: number;
  if (a > 12 && b <= 12) {
    day = a;
    month = b;
  } else if (b > 12 && a <= 12) {
    month = a;
    day = b;
  } else if (order === "DMY") {
    day = a;
    month = b;
  } else {
    month = a;
    day = b;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // A drop of more than a couple months (not just typical day-to-day
  // noise within the same month) means the year rolled over.
  if (cursor.lastMonth !== null && month < cursor.lastMonth - 2) {
    cursor.year += 1;
  }
  cursor.lastMonth = month;

  return `${cursor.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Applies an inferred order to convert a two-number, ambiguous date pair into an ISO date string. */
export function resolveAmbiguousDate(
  first: string,
  second: string,
  year: string,
  order: DateOrder,
): string | null {
  const a = parseInt(first, 10);
  const b = parseInt(second, 10);

  // Even with a document-level order inferred, an individual token can still
  // force the opposite reading if it's independently unambiguous (e.g. the
  // document is mostly DMY but this one row happens to say "25-04-2025" —
  // no, wait, that's still DMY-consistent; the real case is e.g. a document
  // inferred as MDY encountering "25-04-2025" where 25 can't be a month, so
  // this specific token must be DD-MM regardless of the document default).
  let month: number, day: number;
  if (a > 12 && b <= 12) {
    day = a;
    month = b;
  } else if (b > 12 && a <= 12) {
    month = a;
    day = b;
  } else if (order === "DMY") {
    day = a;
    month = b;
  } else {
    month = a;
    day = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
