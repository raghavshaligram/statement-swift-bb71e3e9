/**
 * Payee extraction.
 *
 * `buildDescription` deliberately preserves the bank's own text verbatim --
 * see the comment block in parse-transactions.ts. That is correct for
 * reconciliation, but it is not a readable column: a real ICICI row exports as
 *
 *   UPI/malpotesainath-/UPI/KARNATAKA BANK/509373283868/ICI9c363fb8fb1d4336/5ab6/SAINATH SAKHARAM MALPOTE
 *
 * where the useful field for a bookkeeper is `SAINATH SAKHARAM MALPOTE`.
 *
 * This module derives that field WITHOUT discarding anything. The raw
 * description stays on the transaction; payee, method and references are
 * additive. Every removal here is reversible by reading `raw`.
 *
 * Deterministic by design -- no model call, no network. Same input always
 * yields the same output, which is what makes the confidence scoring and the
 * export honest.
 */

export type PayeeParts = {
  /** Human-readable counterparty. Falls back to the cleaned raw string. */
  payee: string;
  /** Payment rail, when the statement named one (UPI, ACH, SEPA, POS...). */
  method: string | null;
  /** Reference-shaped tokens lifted out, in the order they appeared. */
  references: string[];
  /** True when we found a confident alphabetic payee rather than falling back. */
  matched: boolean;
};

/**
 * Payment rails, keyed by the token banks actually print. Ordered longest-first
 * at match time so "STANDING ORDER" wins over "ORDER".
 *
 * Sources: real statements confirmed in-project (ICICI, Federal Bank, Chase,
 * Lloyds) plus the standard rail names for the four markets we target.
 */
const METHOD_TOKENS: Record<string, string> = {
  // India
  UPI: "UPI",
  NEFT: "NEFT",
  IMPS: "IMPS",
  RTGS: "RTGS",
  NACH: "NACH",
  ECS: "ECS",
  // US
  ACH: "ACH",
  WIRE: "Wire",
  ZELLE: "Zelle",
  "DIRECT DEP": "Direct Deposit",
  "DIRECT DEBIT": "Direct Debit",
  // UK / EU
  BACS: "BACS",
  CHAPS: "CHAPS",
  SEPA: "SEPA",
  "FASTER PAYMENT": "Faster Payment",
  "STANDING ORDER": "Standing Order",
  "DIRECT DBT": "Direct Debit",
  // Card / branch, all markets
  POS: "Card",
  ATM: "ATM",
  "CARD PURCHASE": "Card",
  "DEBIT CARD": "Card",
  "CREDIT CARD": "Card",
  CHQ: "Cheque",
  CHEQUE: "Cheque",
  CHECK: "Cheque",
  DD: "Demand Draft",
  EFT: "EFT",
  INTERAC: "Interac",
};

const METHOD_KEYS = Object.keys(METHOD_TOKENS).sort((a, b) => b.length - a.length);

/**
 * Token shapes that are references rather than names. Each is deliberately
 * narrow -- a rule that also matches "MCDONALDS" would silently eat the payee.
 */
const REFERENCE_PATTERNS: RegExp[] = [
  /^\d{6,}$/, // plain transaction/UTR numbers
  /^[A-Z]{4}0[A-Z0-9]{6}$/, // IFSC (Indian bank branch code)
  /^[A-Z]{2,4}[0-9a-f]{12,}$/i, // ICI9c363fb8fb1d4336-style bank refs
  /^[0-9a-f]{16,}$/i, // bare hex transaction ids
  /^[A-Z0-9]{12,}$/, // long opaque alphanumerics
  /^\d{2}:\d{2}(:\d{2})?$/, // timestamps
  /^(REF|RRN|UTR|TXN|TRN|ID|SEQ|AUTH|ARN)[-:#]?[A-Z0-9]*$/i,
  /^X{2,}\d{2,}$/i, // masked card tails: XXXX1234
  /^\*{2,}\d{2,}$/, // masked card tails: ****1234
];

/**
 * Sequences banks use purely as separators.
 *
 * The hyphen is included because Indian rails print whole rows as
 * "NEFT-HDFC0000123-ACME TRADING PVT LTD-N084251234567", where not splitting
 * on it welds the rail token, the IFSC and the payee into one unusable token.
 * The cost is that hyphenated merchant names ("WAL-MART") split into two
 * words; categorize.ts compensates by also matching against a de-punctuated
 * form of the text.
 */
const SEPARATORS = /[/\\|,;-]+/;

function isReference(token: string): boolean {
  return REFERENCE_PATTERNS.some((re) => re.test(token));
}

/**
 * A payee candidate is a token run that reads like a name: mostly letters,
 * not a rail token, not a reference. Digits are allowed inside (7-ELEVEN,
 * H&M) but a token that is *majority* digits is not a name.
 */
function isNameLike(token: string): boolean {
  if (token.length < 2) return false;
  if (isReference(token)) return false;
  const letters = (token.match(/[A-Za-z]/g) ?? []).length;
  const digits = (token.match(/\d/g) ?? []).length;
  return letters >= 2 && letters > digits;
}

function stripEmailLocalPart(token: string): string {
  // "dripchatagency@okicici" -> "dripchatagency". The VPA handle is a rail
  // detail; the name before it is the counterparty.
  const at = token.indexOf("@");
  return at > 0 ? token.slice(0, at) : token;
}

/**
 * Splits a raw description into its readable payee and the machinery around it.
 *
 * Never throws, never returns empty: if nothing name-like survives, `payee`
 * falls back to the separator-normalised raw string and `matched` is false, so
 * the review screen can flag it rather than showing a blank cell.
 */
export function extractPayee(raw: string): PayeeParts {
  const input = (raw ?? "").trim();
  if (!input) {
    return { payee: "", method: null, references: [], matched: false };
  }

  const upper = input.toUpperCase();

  // 1. Payment rail. Longest-first so multi-word rails win.
  let method: string | null = null;
  let working = input;
  for (const key of METHOD_KEYS) {
    // Word-boundary match so "DD" doesn't fire inside "ADDISON".
    const re = new RegExp(`(^|[^A-Z])${key.replace(/ /g, "\\s+")}([^A-Z]|$)`);
    if (re.test(upper)) {
      method = METHOD_TOKENS[key];
      // Remove the rail phrase from the text before tokenising. Single-token
      // rails are dropped later by the METHOD_TOKENS lookup, but multi-word
      // ones ("DIRECT DEBIT", "STANDING ORDER") never match that lookup and
      // would otherwise survive into the payee.
      working = working.replace(new RegExp(key.replace(/ /g, "\\s+"), "i"), " ");
      break;
    }
  }

  // 2. Tokenise on the bank's own separators plus whitespace.
  const tokens = working
    .split(SEPARATORS)
    .flatMap((part) => part.split(/\s+/))
    .map((t) => t.trim())
    .filter(Boolean);

  // 3. Partition.
  const references: string[] = [];
  const nameTokens: string[] = [];
  for (const token of tokens) {
    const cleaned = stripEmailLocalPart(token);
    if (isReference(token)) {
      references.push(token);
      continue;
    }
    // Rail tokens are recorded in `method`, not repeated in the payee.
    if (METHOD_TOKENS[token.toUpperCase()]) continue;
    if (isNameLike(cleaned)) nameTokens.push(cleaned);
  }

  // 4. Prefer the longest contiguous run of name-like tokens. Banks put the
  //    real counterparty in one block; scattered singletons are usually
  //    fragments of the rail description ("BANK", "TRANSFER").
  const runs: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    const cleaned = stripEmailLocalPart(token);
    const usable =
      !isReference(token) && !METHOD_TOKENS[token.toUpperCase()] && isNameLike(cleaned);
    if (usable) {
      current.push(cleaned);
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);

  // Longest run by character count, ties broken by later position -- the
  // counterparty name typically trails the rail preamble.
  let best: string[] = [];
  let bestScore = -1;
  runs.forEach((run) => {
    const score = run.join(" ").length;
    if (score >= bestScore) {
      bestScore = score;
      best = run;
    }
  });

  const payee = (best.length ? best : nameTokens).join(" ").replace(/\s+/g, " ").trim();

  if (!payee) {
    return {
      payee: input.replace(SEPARATORS, " ").replace(/\s+/g, " ").trim(),
      method,
      references,
      matched: false,
    };
  }

  return { payee, method, references, matched: true };
}
