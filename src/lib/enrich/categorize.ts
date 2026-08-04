/**
 * Transaction categorisation.
 *
 * Deterministic rules, not a model. Reasons, recorded here because this was a
 * considered decision rather than a shortcut:
 *
 *  1. Merchant -> category is a lookup, not a reasoning task. A rules table
 *     beats a small quantised LLM on accuracy for this specific job.
 *  2. This product's pitch is verifiable output -- confidence scores, no
 *     silently dropped rows. A categoriser that returns different answers on
 *     different runs undermines that claim.
 *  3. It runs everywhere. No WebGPU requirement, no multi-hundred-MB download,
 *     works on mobile, adds nothing to time-to-first-export.
 *
 * A model-backed pass is deliberately possible later: `categorize` returns
 * `null` with `matched: false` for rows the rules miss, so a fallback resolver
 * can be layered on top without touching this file. See `CategoryResolver`.
 */

import { extractPayee } from "./extract-payee";

export type Category =
  | "Income"
  | "Transfer"
  | "Groceries"
  | "Dining"
  | "Transport"
  | "Fuel"
  | "Utilities"
  | "Rent & Mortgage"
  | "Insurance"
  | "Healthcare"
  | "Shopping"
  | "Subscriptions"
  | "Software & SaaS"
  | "Travel"
  | "Education"
  | "Entertainment"
  | "Bank Fees"
  | "Taxes"
  | "Loan & EMI"
  | "Investments"
  | "Cash & ATM"
  | "Charity";

export type CategoryResult = {
  category: Category | null;
  /** 0-99. Never 100 -- consistent with the parser's confidence convention. */
  confidence: number;
  /** Which rule fired, for the review screen and for debugging misfires. */
  rule: string | null;
  matched: boolean;
};

type Rule = {
  /** Stable id shown in the UI when a user asks "why this category?" */
  id: string;
  category: Category;
  /** Matched case-insensitively against the extracted payee. */
  patterns: (string | RegExp)[];
  confidence: number;
  /** Only apply on debits (-1), credits (+1), or either (0). */
  sign?: -1 | 0 | 1;
};

/**
 * Merchant and keyword rules across the four markets this product targets
 * (US, UK, Canada, India). Ordered by specificity: the first match wins, so
 * narrow merchant rules sit above broad keyword rules.
 *
 * This table is meant to be extended from real statement data rather than
 * guessed at. Every entry below is a string that appears verbatim in bank
 * descriptions, not a brand's marketing name.
 */
const RULES: Rule[] = [
  // --- Bank machinery: highest specificity, must beat merchant rules ---
  {
    id: "fees.bank",
    category: "Bank Fees",
    patterns: [
      /\bservice charge\b/i, /\bmaintenance fee\b/i, /\boverdraft\b/i,
      /\bnsf fee\b/i, /\breturned item\b/i, /\bannual fee\b/i,
      /\bforeign transaction fee\b/i, /\bnon.?sufficient\b/i, /\bledger fee\b/i,
      /\bsms charge/i, /\bamc\b/i, /\bgst on\b/i,
    ],
    confidence: 92,
  },
  {
    id: "atm.withdrawal",
    category: "Cash & ATM",
    patterns: [/\batm\b/i, /\bcash withdrawal\b/i, /\bcash wdl\b/i, /\bcardless cash\b/i],
    confidence: 90,
  },
  {
    id: "transfer.internal",
    category: "Transfer",
    patterns: [
      /\btransfer to\b/i, /\btransfer from\b/i, /\bown account\b/i,
      /\binternal transfer\b/i, /\bself\b/i, /\bxfer\b/i,
    ],
    confidence: 78,
  },
  {
    id: "tax.gov",
    category: "Taxes",
    patterns: [
      /\birs\b/i, /\bhmrc\b/i, /\bincome tax\b/i, /\bgst payment\b/i,
      /\bcra\b/i, /\bsales tax\b/i, /\btds\b/i, /\bself assessment\b/i,
    ],
    confidence: 90,
  },
  {
    id: "loan.emi",
    category: "Loan & EMI",
    patterns: [/\bemi\b/i, /\bloan repay/i, /\bloan inst/i, /\bmortgage pmt\b/i, /\bauto loan\b/i],
    confidence: 88,
  },

  // --- Income (credits only) ---
  {
    id: "income.payroll",
    category: "Income",
    patterns: [
      /\bpayroll\b/i, /\bsalary\b/i, /\bdirect dep\b/i, /\bwages\b/i,
      /\bpay run\b/i, /\bremuneration\b/i,
    ],
    confidence: 90,
    sign: 1,
  },
  {
    id: "income.platform",
    category: "Income",
    patterns: [/\bstripe\b/i, /\bpaypal\b/i, /\brazorpay\b/i, /\bupwork\b/i, /\bfiverr\b/i],
    confidence: 72,
    sign: 1,
  },

  // --- Housing & utilities ---
  {
    id: "rent",
    category: "Rent & Mortgage",
    patterns: [/\brent\b/i, /\bmortgage\b/i, /\blandlord\b/i, /\bletting\b/i, /\bhousing soc/i],
    confidence: 86,
  },
  {
    id: "utilities",
    category: "Utilities",
    patterns: [
      /\belectric/i, /\bwater board\b/i, /\bgas bill\b/i, /\bbroadband\b/i,
      /\bcomcast\b/i, /\bxfinity\b/i, /\bverizon\b/i, /\bat&?t\b/i, /\bvodafone\b/i,
      /\bairtel\b/i, /\bjio\b/i, /\bbritish gas\b/i, /\bthames water\b/i,
      /\boctopus energy\b/i, /\bbell canada\b/i, /\brogers\b/i, /\btneb\b/i,
      /\bbses\b/i, /\bmahanagar\b/i,
    ],
    confidence: 86,
  },

  // --- Everyday spend ---
  {
    id: "groceries",
    category: "Groceries",
    patterns: [
      /\btesco\b/i, /\bsainsbury/i, /\basda\b/i, /\bmorrisons\b/i, /\baldi\b/i,
      /\blidl\b/i, /\bwaitrose\b/i, /\bco.?op\b/i, /\bkroger\b/i, /\bsafeway\b/i,
      /\btrader joe/i, /\bwhole ?foods\b/i, /\bpublix\b/i, /\bwegmans\b/i,
      /\bloblaws\b/i, /\bsobeys\b/i, /\bmetro\b/i, /\bbig ?basket\b/i,
      /\bdmart\b/i, /\bblinkit\b/i, /\bzepto\b/i, /\breliance fresh\b/i,
      /\bgrocer/i, /\bsupermarket\b/i, /\bsuper shop/i,
    ],
    confidence: 88,
  },
  {
    id: "dining",
    category: "Dining",
    patterns: [
      /\bstarbucks\b/i, /\bmcdonald/i, /\bsubway\b/i, /\bdomino/i, /\bpizza\b/i,
      /\bkfc\b/i, /\bburger king\b/i, /\bchipotle\b/i, /\bdunkin\b/i,
      /\bcosta\b/i, /\bpret\b/i, /\bnando/i, /\bgreggs\b/i, /\btim horton/i,
      /\bswiggy\b/i, /\bzomato\b/i, /\bdoordash\b/i, /\buber ?eats\b/i,
      /\bdeliveroo\b/i, /\bgrubhub\b/i, /\bjust ?eat\b/i,
      /\brestaurant\b/i, /\bcafe\b/i, /\bcoffee\b/i, /\bbar & grill\b/i,
    ],
    confidence: 88,
  },
  {
    id: "fuel",
    category: "Fuel",
    patterns: [
      /\bshell\b/i, /\bbp\b/i, /\bexxon/i, /\bmobil\b/i, /\bchevron\b/i,
      /\btexaco\b/i, /\besso\b/i, /\bpetro.?canada\b/i, /\bindian oil\b/i,
      /\bhp ?petrol\b/i, /\bbharat petro/i, /\bpetrol\b/i, /\bfuel\b/i,
      /\bgas station\b/i, /\bcircle k\b/i,
    ],
    confidence: 86,
  },
  {
    id: "transport",
    category: "Transport",
    patterns: [
      /\buber\b/i, /\blyft\b/i, /\bola\b/i, /\brapido\b/i, /\btfl\b/i,
      /\btransport for london\b/i, /\bnational rail\b/i, /\btrainline\b/i,
      /\bmta\b/i, /\bparking\b/i, /\btoll\b/i, /\bfastag\b/i, /\bmetro card\b/i,
      /\birctc\b/i, /\bpresto\b/i,
    ],
    confidence: 85,
  },

  // --- Subscriptions & software ---
  {
    id: "software.saas",
    category: "Software & SaaS",
    patterns: [
      /\baws\b/i, /\bamazon web services\b/i, /\bgoogle cloud\b/i, /\bgcp\b/i,
      /\bmicrosoft azure\b/i, /\bdigitalocean\b/i, /\bvercel\b/i, /\bnetlify\b/i,
      /\bgithub\b/i, /\bslack\b/i, /\bnotion\b/i, /\bfigma\b/i, /\bzoom\b/i,
      /\batlassian\b/i, /\bopenai\b/i, /\banthropic\b/i, /\btwilio\b/i,
      /\bsupabase\b/i, /\bcloudflare\b/i, /\bhubspot\b/i, /\bquickbooks\b/i,
      /\bxero\b/i, /\bmailchimp\b/i, /\bstripe billing\b/i,
    ],
    confidence: 90,
  },
  {
    id: "subscriptions",
    category: "Subscriptions",
    patterns: [
      /\bnetflix\b/i, /\bspotify\b/i, /\bdisney\+?\b/i, /\bhulu\b/i,
      /\bapple\.com\/bill\b/i, /\bitunes\b/i, /\bprime video\b/i,
      /\byoutube premium\b/i, /\baudible\b/i, /\bpatreon\b/i, /\bhotstar\b/i,
      /\bsubscription\b/i, /\bmembership\b/i,
    ],
    confidence: 88,
  },
  {
    id: "entertainment",
    category: "Entertainment",
    patterns: [
      /\bcinema\b/i, /\bodeon\b/i, /\bamc theat/i, /\bcineworld\b/i,
      /\bpvr\b/i, /\binox\b/i, /\bticketmaster\b/i, /\bsteam games\b/i,
      /\bplaystation\b/i, /\bxbox\b/i, /\bnintendo\b/i, /\bbookmyshow\b/i,
    ],
    confidence: 85,
  },

  // --- Shopping & travel ---
  {
    id: "shopping",
    category: "Shopping",
    patterns: [
      /\bamazon\b/i, /\bebay\b/i, /\betsy\b/i, /\bwalmart\b/i, /\btarget\b/i,
      /\bcostco\b/i, /\bikea\b/i, /\bargos\b/i, /\bjohn lewis\b/i, /\bm&s\b/i,
      /\bnext retail\b/i, /\bprimark\b/i, /\bflipkart\b/i, /\bmyntra\b/i,
      /\bajio\b/i, /\bmeesho\b/i, /\bnykaa\b/i, /\bshein\b/i, /\bh&m\b/i,
      /\bzara\b/i, /\bbest buy\b/i, /\bhome depot\b/i, /\bcanadian tire\b/i,
    ],
    confidence: 84,
  },
  {
    id: "travel",
    category: "Travel",
    patterns: [
      /\bairlines?\b/i, /\bairways\b/i, /\bryanair\b/i, /\beasyjet\b/i,
      /\bdelta air\b/i, /\bunited air\b/i, /\bindigo\b/i, /\bair india\b/i,
      /\bbooking\.com\b/i, /\bairbnb\b/i, /\bexpedia\b/i, /\bhotels?\.com\b/i,
      /\bmarriott\b/i, /\bhilton\b/i, /\bmakemytrip\b/i, /\bhotel\b/i,
    ],
    confidence: 86,
  },

  // --- Health, insurance, education, giving ---
  {
    id: "healthcare",
    category: "Healthcare",
    patterns: [
      /\bpharmacy\b/i, /\bchemist\b/i, /\bboots\b/i, /\bwalgreens\b/i,
      /\bcvs\b/i, /\bapollo pharm/i, /\bhospital\b/i, /\bclinic\b/i,
      /\bdental\b/i, /\bdr\.? [a-z]+\b/i, /\bmedic/i, /\bdiagnostic/i,
      /\bshoppers drug\b/i, /\bpharmeasy\b/i,
    ],
    confidence: 84,
  },
  {
    id: "insurance",
    category: "Insurance",
    patterns: [
      /\binsurance\b/i, /\bassurance\b/i, /\bgeico\b/i, /\bprogressive\b/i,
      /\bstate farm\b/i, /\ballstate\b/i, /\baviva\b/i, /\baxa\b/i,
      /\blic\b/i, /\bhdfc ergo\b/i, /\bpolicybazaar\b/i, /\bpremium\b/i,
    ],
    confidence: 86,
  },
  {
    id: "education",
    category: "Education",
    patterns: [
      /\btuition\b/i, /\buniversity\b/i, /\bcollege\b/i, /\bschool fee/i,
      /\bcoursera\b/i, /\budemy\b/i, /\bstudent loan\b/i, /\bbyju/i,
    ],
    confidence: 84,
  },
  {
    id: "investments",
    category: "Investments",
    patterns: [
      /\bvanguard\b/i, /\bfidelity\b/i, /\bschwab\b/i, /\brobinhood\b/i,
      /\bcoinbase\b/i, /\bzerodha\b/i, /\bgroww\b/i, /\bsip\b/i,
      /\bmutual fund\b/i, /\bbrokerage\b/i, /\bisa contrib/i, /\brrsp\b/i,
    ],
    confidence: 86,
  },
  {
    id: "charity",
    category: "Charity",
    patterns: [/\bdonation\b/i, /\bcharity\b/i, /\bunicef\b/i, /\bred cross\b/i, /\boxfam\b/i],
    confidence: 86,
  },
];

/**
 * Rails that are used person-to-person as well as merchant-to-customer.
 * A UPI/Zelle/Interac payment to something that reads like a person's name is
 * a transfer, not an uncategorisable row -- and on Indian statements this is
 * the single largest bucket. No merchant rule can ever match these, because a
 * person's name carries no category signal, so a model would not help either.
 */
const P2P_RAILS = /\b(UPI|IMPS|NEFT|ZELLE|INTERAC|VENMO|CASH APP|PAYTM|PHONEPE|GPAY|E-?TRANSFER)\b/i;

/** Two to four capitalised alphabetic words, no digits -- i.e. a person's name. */
const PERSON_NAME = /^[A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3}$/;

/** Company suffixes that mean this is a business, not an individual. */
const BUSINESS_SUFFIX = /\b(LTD|LIMITED|LLC|LLP|INC|PVT|PLC|GMBH|CORP|CO|COMPANY|SERVICES|SOLUTIONS|ENTERPRISES|TRADING|TECHNOLOGIES|STORES?)\b/i;

function matches(payee: string, pattern: string | RegExp): boolean {
  return typeof pattern === "string"
    ? payee.toLowerCase().includes(pattern.toLowerCase())
    : pattern.test(payee);
}

/**
 * Optional second-pass resolver for rows the rules miss.
 *
 * This is the seam a local model would plug into, if and when it earns its
 * place: measure rules coverage on real statements first, and only reach for a
 * model if coverage is genuinely short. Anything supplied here must stay
 * on-device -- the product's guarantee is that no statement data leaves the
 * browser, and that applies to categorisation as much as extraction.
 */
export type CategoryResolver = (input: {
  payee: string;
  raw: string;
  amount: number;
}) => CategoryResult | null;

/**
 * Categorise one transaction. Pure and synchronous.
 *
 * `amount` is used only for sign-gated rules (payroll is income when credited,
 * but a debit to a company called "Payroll Services" is not).
 */
export function categorize(
  rawDescription: string,
  amount: number,
  resolver?: CategoryResolver
): CategoryResult {
  const { payee, matched: payeeMatched } = extractPayee(rawDescription);
  // Rules read the raw text too: rail words like "ATM" and "NEFT" are stripped
  // out of the payee by design, but they are exactly what some rules key on.
  // Also match against a de-punctuated form so hyphenated and dotted merchant
  // names ("WAL-MART", "AMAZON.CO.UK") match patterns written in plain form.
  const combined = `${payee} ${rawDescription}`;
  const haystack = `${combined} ${combined.replace(/[-.*_]/g, "")}`;
  const sign: -1 | 1 = amount >= 0 ? 1 : -1;

  for (const rule of RULES) {
    if (rule.sign && rule.sign !== 0 && rule.sign !== sign) continue;
    if (rule.patterns.some((p) => matches(haystack, p))) {
      // A payee we couldn't cleanly extract means the match came off raw text,
      // which is weaker evidence. Reflect that rather than overstating it.
      const confidence = payeeMatched ? rule.confidence : Math.max(50, rule.confidence - 15);
      return { category: rule.category, confidence, rule: rule.id, matched: true };
    }
  }

  // Person-to-person transfer fallback. Runs after every merchant rule has
  // been tried, so a merchant paid over UPI still categorises as the merchant.
  // Confidence is deliberately modest -- this is a shape heuristic, not a
  // lookup, and the review screen should treat it as reviewable.
  if (
    payeeMatched &&
    P2P_RAILS.test(rawDescription) &&
    PERSON_NAME.test(payee) &&
    !BUSINESS_SUFFIX.test(payee)
  ) {
    return {
      category: sign > 0 ? "Income" : "Transfer",
      confidence: 62,
      rule: "p2p.person-transfer",
      matched: true,
    };
  }

  if (resolver) {
    const fallback = resolver({ payee, raw: rawDescription, amount });
    if (fallback) return fallback;
  }

  return { category: null, confidence: 0, rule: null, matched: false };
}

/**
 * Coverage measurement. Run this against real parsed statements before
 * considering any model-backed fallback -- the decision to add one should be
 * driven by a number, not a hunch.
 */
export function measureCoverage(
  transactions: { description: string; amount: number }[]
): { total: number; matched: number; coverage: number; unmatched: string[] } {
  const unmatched: string[] = [];
  let matched = 0;
  for (const t of transactions) {
    if (categorize(t.description, t.amount).matched) matched++;
    else unmatched.push(t.description);
  }
  const total = transactions.length;
  return {
    total,
    matched,
    coverage: total ? matched / total : 0,
    unmatched,
  };
}
