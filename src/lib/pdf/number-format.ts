/**
 * Number format inference.
 *
 * Deliberately mirrors date-inference.ts: infer ONCE per document from the
 * least ambiguous evidence available, then apply that single convention to
 * every token. Guessing per-token is a coin flip -- "1.234" is one thousand
 * two hundred thirty four in Berlin and one point two three four in Boston,
 * and nothing about the token itself resolves it.
 *
 * Why this exists: the amount matcher hardcoded "." as the decimal separator
 * and made the decimal part mandatory. Two consequences, both silent and both
 * total rather than partial --
 *
 *   - Comma-decimal locales (Germany, France, Spain, Italy, Netherlands,
 *     Brazil, most of Latin America) matched ZERO number tokens, and since
 *     buildTransactionFromBlock bails on `numbers.length === 0`, every row was
 *     dropped. Same failure signature as the ICICI date bug: an empty result
 *     that reads to a user as "your file didn't work".
 *   - Zero-decimal currencies (JPY, KRW, VND, IDR, HUF, CLP) could never match
 *     at all, since "\.\d{2}" was required.
 */

export type DecimalSeparator = "." | ",";

export type NumberFormat = {
  decimal: DecimalSeparator;
  /** How the decision was reached, surfaced in warnings when it was a guess. */
  basis: "mixed-separators" | "trailing-group" | "default";
};

/** Group separators seen in the wild: comma, dot, apostrophe (CH), space, NBSP, thin space. */
const GROUP_CHARS = ",.'\u2019 \u00a0\u202f";

/**
 * Currency symbols that may prefix or suffix an amount. Superset of
 * detect-currency.ts's symbol list -- an unrecognised symbol causes the whole
 * token to miss, so breadth here is cheap insurance.
 *
 * Split into single characters (a character class) and multi-character codes
 * (an alternation). Collapsing both into one alternation is what broke the UK
 * fixture: "£" ended up inside a multi-char literal rather than a class, so
 * "+£0.04" stopped matching.
 */
const SYMBOL_CHARS = "$£€¥₹₩₪₺₫₦₱฿₴₸₡₲₵₭៛R";
const SYMBOL_WORDS = ["Rp", "zł", "CHF", "kr", "R\\$"];

/**
 * A number-shaped token, ignoring which separator means what.
 *
 * Whitespace is deliberately NOT allowed here even though space-grouped
 * numbers exist ("1 234,56"). Allowing it made the matcher span across token
 * boundaries and swallow the following date -- on a German statement,
 * "87,20 1.234,56 04.04.2025" scored as "dot last", inverting the vote and
 * selecting "." for a comma-decimal document. Space grouping is detected
 * separately by SPACE_GROUPED_RE below, where it can be bounded safely.
 */
const CANDIDATE_RE = /\d[\d.,'\u2019]*\d/g;

/**
 * Space-grouped numbers with a comma decimal ("1 234,56") -- the French and
 * Nordic convention. Space grouping essentially never co-occurs with a comma
 * as the GROUP separator, so a hit here is strong evidence for a comma
 * decimal on its own.
 */
const SPACE_GROUPED_RE = /\b\d{1,3}(?:[ \u00a0\u202f]\d{3})+,\d{1,2}\b/;

/**
 * Infers the decimal separator for a whole document.
 *
 * Evidence, strongest first:
 *
 * 1. A token containing BOTH "." and "," -- whichever appears LAST is the
 *    decimal. "1.234,56" and "1,234.56" are each unambiguous on their own.
 *    This is the equivalent of date-inference's ">12 means it's the day".
 * 2. Failing that, a separator followed by exactly TWO digits at end-of-token
 *    is a decimal ("1234,56"); exactly THREE is grouping ("1.500"). Counted
 *    across the document and the majority wins, because a single token can be
 *    genuinely ambiguous while a whole statement rarely is.
 * 3. Default "." -- correct for the markets this product actually targets
 *    (US, UK, Canada, India).
 */
export function inferNumberFormat(fullText: string): NumberFormat {
  // Split on whitespace first so a candidate can never straddle two tokens.
  const tokens = fullText
    .split(/\s+/)
    .flatMap((word) => word.match(CANDIDATE_RE) ?? []);

  if (SPACE_GROUPED_RE.test(fullText)) return { decimal: ",", basis: "mixed-separators" };

  // --- 1. Unambiguous: both separators present in one token ---
  let commaLast = 0;
  let dotLast = 0;
  for (const tok of tokens) {
    const lastDot = tok.lastIndexOf(".");
    const lastComma = tok.lastIndexOf(",");
    if (lastDot === -1 || lastComma === -1) continue;
    if (lastComma > lastDot) commaLast++;
    else dotLast++;
  }
  if (commaLast > dotLast && commaLast > 0) return { decimal: ",", basis: "mixed-separators" };
  if (dotLast > commaLast && dotLast > 0) return { decimal: ".", basis: "mixed-separators" };

  // --- 2. Trailing group size ---
  let commaDecimal = 0;
  let dotDecimal = 0;
  for (const tok of tokens) {
    const m = tok.match(/([.,])(\d+)$/);
    if (!m) continue;
    const [, sep, digits] = m;
    // Exactly 3 trailing digits is grouping, not a decimal -- and a token with
    // only ONE separator and 3 trailing digits ("1.500") tells us nothing about
    // which char is the decimal, so it is skipped rather than counted.
    if (digits.length === 3) continue;
    if (digits.length === 1 || digits.length === 2) {
      if (sep === ",") commaDecimal++;
      else dotDecimal++;
    }
  }
  if (commaDecimal > dotDecimal && commaDecimal > 0) return { decimal: ",", basis: "trailing-group" };
  if (dotDecimal > commaDecimal && dotDecimal > 0) return { decimal: ".", basis: "trailing-group" };

  return { decimal: ".", basis: "default" };
}

/**
 * Builds the amount matcher for a given decimal separator.
 *
 * One property is preserved deliberately from the original regex: a bare run
 * of digits with NO grouping and NO decimal part never matches. That is what
 * keeps 12-digit UPI reference numbers and transaction IDs out of the amount
 * columns, and losing it would be a worse regression than the bug being fixed
 * here. So a token qualifies only if it is grouped, or has a decimal part, or
 * both.
 */
export function buildAmountRegex(decimal: DecimalSeparator): RegExp {
  const groupChars = GROUP_CHARS.replace(decimal, "");
  const g = `[${groupChars.replace(/[\]\\^-]/g, "\\$&")}]`;
  const d = decimal === "." ? "\\." : ",";
  const sym = `(?:${SYMBOL_WORDS.join("|")}|[${SYMBOL_CHARS}])?`;

  // Grouped: 1,234 / 1.234.567 / 12,34,567 (Indian lakh) / 1'234 / 1 234
  const grouped = `\\d{1,3}(?:${g}\\d{2,3})+`;
  const decimalPart = `(?:${d}\\d{1,2})`;

  return new RegExp(
    `^\\(?[+-]?\\s?${sym}\\s?(?:${grouped}${decimalPart}?|\\d+${decimalPart})\\)?\\s?${sym}[CDcd]?$`
  );
}

/**
 * Converts a matched token to a number under the inferred format.
 *
 * Every character that isn't a digit or the decimal separator is stripped --
 * group separators, currency symbols, signs, parens, Dr/Cr suffixes are all
 * handled by the caller's sign logic, not here.
 */
export function normalizeAmountToken(token: string, decimal: DecimalSeparator): string {
  const keep = decimal === "." ? /[^\d.]/g : /[^\d,]/g;
  const stripped = token.replace(keep, "");
  return decimal === "," ? stripped.replace(",", ".") : stripped;
}
