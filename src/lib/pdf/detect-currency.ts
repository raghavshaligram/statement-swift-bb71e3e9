import type { BankId } from "./bank-detection";

/**
 * Detects a statement's currency from the document's own text, rather than
 * assuming one. Tries three layers, in order of reliability:
 *
 * 1. ISO currency codes (INR, USD, GBP, ...) printed directly in the
 *    statement -- e.g. "Statement of Transactions ... in INR for the
 *    period ..." (this exact phrasing appears in the real ICICI statement
 *    this was built against). Unambiguous when present.
 * 2. Currency symbols (₹, £, €, ¥) -- reliable except for "$", which is used
 *    by many countries (USD, CAD, AUD, SGD, ...), so a bare "$" only counts
 *    as weak evidence for USD specifically, not a confident match.
 * 3. A bank-based fallback: if we've named-detected the issuing bank (see
 *    bank-detection.ts) and know which currency that bank's home country
 *    uses, fall back to that.
 *
 * If none of these produce a match, returns null rather than silently
 * defaulting to USD -- asserting a currency the statement never actually
 * showed is exactly the bug this module exists to avoid. Callers should
 * format amounts as plain grouped numbers (no currency symbol) when this
 * returns null.
 */

// Full active ISO 4217 alphabetic currency code list (includes precious-metal
// codes XAU/XAG/XPD/XPT, the IMF's XDR, bond-market units of account
// XBA-XBD, the no-currency code XXX and test code XTS, and both the old and
// new codes for currencies mid-transition e.g. SLL/SLE, ZWL/ZWG -- an unused
// code here is harmless, it simply never matches).
const ISO_4217_CODES = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD",
  "CAD", "CDF", "CHE", "CHF", "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUC", "CUP", "CVE", "CZK",
  "DJF", "DKK", "DOP", "DZD",
  "EGP", "ERN", "ETB", "EUR",
  "FJD", "FKP",
  "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD",
  "HKD", "HNL", "HTG", "HUF",
  "IDR", "ILS", "INR", "IQD", "IRR", "ISK",
  "JMD", "JOD", "JPY",
  "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT",
  "LAK", "LBP", "LKR", "LRD", "LSL", "LYD",
  "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR", "MZN",
  "NAD", "NGN", "NIO", "NOK", "NPR", "NZD",
  "OMR",
  "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG",
  "QAR",
  "RON", "RSD", "RUB", "RWF",
  "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", "SSP", "STN", "SVC", "SYP", "SZL",
  "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS",
  "UAH", "UGX", "USD", "USN", "UYI", "UYU", "UYW", "UZS",
  "VED", "VES", "VND", "VUV",
  "WST",
  "XAF", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XOF", "XPD", "XPF", "XPT", "XSU", "XTS", "XUA", "XXX",
  "YER",
  "ZAR", "ZMW", "ZWG", "ZWL",
] as const;

const ISO_CODE_RE = new RegExp(`\\b(${ISO_4217_CODES.join("|")})\\b`, "g");

// Single-Unicode-character currency symbols only. Multi-character symbols
// (R$, Kč, zł, Rp, kr, ...) need their own string-based check rather than a
// symbol-map entry, and are intentionally left out here rather than bolted
// on -- ambiguous ones (like "kr" for NOK/SEK/DKK) especially need more care
// than a simple includes() check gives them.
const SYMBOL_MAP: Array<{ symbol: string; currency: string }> = [
  { symbol: "₹", currency: "INR" },
  { symbol: "£", currency: "GBP" },
  { symbol: "€", currency: "EUR" },
  { symbol: "¥", currency: "JPY" },
  { symbol: "₩", currency: "KRW" },
  { symbol: "₦", currency: "NGN" },
  { symbol: "₺", currency: "TRY" },
  { symbol: "₫", currency: "VND" },
  { symbol: "₱", currency: "PHP" },
  { symbol: "฿", currency: "THB" },
  { symbol: "₪", currency: "ILS" },
  { symbol: "₽", currency: "RUB" },
  { symbol: "₴", currency: "UAH" },
  { symbol: "₡", currency: "CRC" },
  { symbol: "₲", currency: "PYG" },
  { symbol: "₵", currency: "GHS" },
  { symbol: "₾", currency: "GEL" },
  { symbol: "₼", currency: "AZN" },
  { symbol: "₸", currency: "KZT" },
  { symbol: "₮", currency: "MNT" },
  { symbol: "₭", currency: "LAK" },
];

// Bank -> currency of the country that bank operates in. Only used as a last
// resort when the statement text itself has no explicit currency evidence.
const BANK_CURRENCY_FALLBACK: Partial<Record<BankId, string>> = {
  chase: "USD",
  bofa: "USD",
  wells_fargo: "USD",
  citi: "USD",
  capital_one: "USD",
  us_bank: "USD",
  pnc: "USD",
  td_bank_us: "USD",
  barclays: "GBP",
  hsbc_uk: "GBP",
  lloyds: "GBP",
  natwest: "GBP",
  santander_uk: "GBP",
  monzo: "GBP",
  tide: "GBP",
  rbc: "CAD",
  td_canada_trust: "CAD",
  scotiabank: "CAD",
  bmo: "CAD",
  cibc: "CAD",
  icici: "INR",
  hdfc: "INR",
  sbi: "INR",
  federal_bank: "INR",
};

export function detectCurrency(fullText: string, bankId: BankId | null): string | null {
  const isoMatches = fullText.match(ISO_CODE_RE);
  if (isoMatches && isoMatches.length > 0) {
    const counts = new Map<string, number>();
    for (const code of isoMatches) counts.set(code, (counts.get(code) ?? 0) + 1);
    let best: string | null = null;
    let bestCount = 0;
    for (const [code, count] of counts) {
      if (count > bestCount) {
        best = code;
        bestCount = count;
      }
    }
    if (best) return best;
  }

  for (const { symbol, currency } of SYMBOL_MAP) {
    if (fullText.includes(symbol)) return currency;
  }
  if (fullText.includes("$")) return "USD"; // weakest signal, but still better than a silent default elsewhere

  if (bankId && BANK_CURRENCY_FALLBACK[bankId]) {
    return BANK_CURRENCY_FALLBACK[bankId]!;
  }

  return null;
}

/** Formats a number as currency using the detected code, or as a plain grouped number if currency is unknown -- never silently asserts a currency the statement didn't show. */
export function formatAmount(n: number, currency: string | null): string {
  if (currency) {
    try {
      return n.toLocaleString(undefined, { style: "currency", currency });
    } catch {
      // Invalid/unsupported ISO code somehow made it through detection -- fall through to plain formatting.
    }
  }
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
