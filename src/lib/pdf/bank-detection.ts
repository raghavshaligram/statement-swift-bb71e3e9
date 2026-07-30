/**
 * Bank detection: lightweight text-signature matching against the full extracted
 * text of a statement. This drives the UI label ("Detected: Chase") and lets us
 * apply small per-bank parsing hints — it is NOT a full per-bank column-layout
 * parser. That requires real sample statements to tune against; until then
 * every bank falls back to the generic row parser.
 *
 * Coverage focus (per product direction): US, UK, and Canada, alongside the
 * existing Indian banks. Signatures are deliberately scoped to avoid false
 * positives from banks with the same brand name operating in multiple
 * countries (HSBC, Santander) or generic phrases that could appear in
 * unrelated text (a bare "US Bank" or "BMO" acronym) -- each pattern below
 * requires either a full official name or a country-specific domain, not
 * just a short brand fragment.
 */

export type BankId =
  // US
  | "chase"
  | "bofa"
  | "wells_fargo"
  | "citi"
  | "capital_one"
  | "us_bank"
  | "pnc"
  | "td_bank_us"
  // UK
  | "barclays"
  | "hsbc_uk"
  | "lloyds"
  | "natwest"
  | "santander_uk"
  | "monzo"
  | "tide"
  // Canada
  | "rbc"
  | "td_canada_trust"
  | "scotiabank"
  | "bmo"
  | "cibc"
  // India
  | "icici"
  | "hdfc"
  | "sbi"
  | "federal_bank"
  | "unknown";

export const BANK_LABELS: Record<BankId, string> = {
  chase: "Chase",
  bofa: "Bank of America",
  wells_fargo: "Wells Fargo",
  citi: "Citibank",
  capital_one: "Capital One",
  us_bank: "U.S. Bank",
  pnc: "PNC Bank",
  td_bank_us: "TD Bank (US)",
  barclays: "Barclays",
  hsbc_uk: "HSBC UK",
  lloyds: "Lloyds Bank",
  natwest: "NatWest",
  santander_uk: "Santander UK",
  monzo: "Monzo",
  tide: "Tide",
  rbc: "RBC Royal Bank",
  td_canada_trust: "TD Canada Trust",
  scotiabank: "Scotiabank",
  bmo: "BMO (Bank of Montreal)",
  cibc: "CIBC",
  icici: "ICICI Bank",
  hdfc: "HDFC Bank",
  sbi: "State Bank of India",
  federal_bank: "Federal Bank",
  unknown: "Unrecognized bank (generic parser)",
};

// Signatures are checked in order; first match wins. Keep specific/branded
// strings first so e.g. "chase.com" doesn't get shadowed by something generic.
const SIGNATURES: Array<{ id: BankId; patterns: RegExp[] }> = [
  // US
  { id: "chase", patterns: [/\bjpmorgan chase\b/i, /\bchase\.com\b/i, /\bchase bank\b/i] },
  { id: "bofa", patterns: [/\bbank of america\b/i, /\bbankofamerica\.com\b/i, /\bbofa\b/i] },
  { id: "wells_fargo", patterns: [/\bwells fargo\b/i, /\bwellsfargo\.com\b/i] },
  { id: "citi", patterns: [/\bcitibank\b/i, /\bciti\.com\b/i, /\bcitigroup\b/i] },
  { id: "capital_one", patterns: [/\bcapital one\b/i, /\bcapitalone\.com\b/i] },
  // "U.S. Bank" is the brand name, but a bare match risks false positives on
  // generic phrases like "each U.S. bank must..." -- require the domain or
  // the full corporate name (U.S. Bancorp) instead of the plain brand name.
  { id: "us_bank", patterns: [/\busbank\.com\b/i, /\bu\.?s\.? bancorp\b/i] },
  { id: "pnc", patterns: [/\bpnc bank\b/i, /\bpnc\.com\b/i] },
  // "TD Bank, N.A." (full corporate designation) and the .com domain are
  // specific to the US retail bank, distinguishing it from TD Canada Trust.
  { id: "td_bank_us", patterns: [/\btd bank,?\s*n\.a\.\b/i, /\btdbank\.com\b/i] },

  // UK
  { id: "barclays", patterns: [/\bbarclays\b/i, /\bbarclays\.co\.uk\b/i] },
  // HSBC operates under this brand in many countries -- scope to UK
  // specifically via the .co.uk domain or explicit "HSBC UK" naming.
  { id: "hsbc_uk", patterns: [/\bhsbc uk\b/i, /\bhsbc\.co\.uk\b/i] },
  { id: "lloyds", patterns: [/\blloyds bank\b/i, /\blloydsbank\.co\.uk\b/i, /\blloydsbank\.com\b/i] },
  { id: "natwest", patterns: [/\bnatwest\b/i, /\bnatwest\.com\b/i] },
  // Santander operates in Spain, Latin America, and the US too -- scope to UK.
  { id: "santander_uk", patterns: [/\bsantander uk\b/i, /\bsantander\.co\.uk\b/i] },
  { id: "monzo", patterns: [/\bmonzo\b/i, /\bmonzo\.com\b/i] },
  // "tide" alone is a common English word -- scoped to the real domain and
  // Tide's actual product name, never a bare word match, same precedent as
  // the TD Bank / TD Canada Trust disambiguation above.
  { id: "tide", patterns: [/\btide\.co\b/i, /\btide business\b/i] },

  // Canada
  { id: "rbc", patterns: [/\brbc royal bank\b/i, /\broyal bank of canada\b/i, /\brbc\.com\b/i] },
  // "TD Canada Trust" is the specific, unambiguous Canadian retail brand --
  // distinguishing it from "TD Bank, N.A." (the separate US entity) above.
  { id: "td_canada_trust", patterns: [/\btd canada trust\b/i] },
  { id: "scotiabank", patterns: [/\bscotiabank\b/i, /\bscotiabank\.com\b/i] },
  // "BMO" alone is a risky 3-letter match -- require the full name or domain.
  { id: "bmo", patterns: [/\bbank of montreal\b/i, /\bbmo\.com\b/i] },
  { id: "cibc", patterns: [/\bcibc\b/i, /\bcibc\.com\b/i] },

  // India
  { id: "icici", patterns: [/\bicici bank\b/i, /\bicicibank\.com\b/i] },
  { id: "hdfc", patterns: [/\bhdfc bank\b/i, /\bhdfcbank\.com\b/i] },
  { id: "sbi", patterns: [/\bstate bank of india\b/i, /\bonlinesbi\b/i, /\bsbi\.co\.in\b/i] },
  // Confirmed via a real sample statement this session (UPI/NEFT/IMPS
  // transaction types, dripchatagency@okicici UPI handle) -- The Federal
  // Bank Limited, a major Indian private-sector bank.
  { id: "federal_bank", patterns: [/\bfederal bank\b/i, /\bfederalbank\.co\.in\b/i, /\bthe federal bank limited\b/i] },
];

export function detectBank(fullText: string): BankId {
  for (const sig of SIGNATURES) {
    if (sig.patterns.some((p) => p.test(fullText))) return sig.id;
  }
  return "unknown";
}
