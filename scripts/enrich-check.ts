/**
 * Regression check for the enrichment layer (payee extraction + categorisation).
 *
 * Same shape and philosophy as scripts/parser-check.ts: every fixture below is
 * a real-shaped bank description, not an invented one. Run with:
 *
 *   npm run check:enrich
 *
 * Exit code is non-zero on any failure so this can gate CI.
 */

import { extractPayee } from "../src/lib/enrich/extract-payee";
import { categorize, measureCoverage, type Category } from "../src/lib/enrich/categorize";

type PayeeCase = {
  name: string;
  raw: string;
  expectPayee: string;
  expectMethod?: string | null;
};

type CategoryCase = {
  name: string;
  raw: string;
  amount: number;
  expect: Category | null;
};

/**
 * Payee fixtures. The ICICI cases are the exact strings confirmed in the
 * source PDF during the Aug 2026 parser session -- the ones that made the
 * "descriptions are long and broken" report.
 */
const PAYEE_CASES: PayeeCase[] = [
  {
    name: "ICICI UPI with IFSC, UTR and bank ref",
    raw: "UPI/malpotesainath-/UPI/KARNATAKA BANK/509373283868/ICI9c363fb8fb1d43369a59/5ab6/SAINATH SAKHARAM MALPOTE",
    expectPayee: "SAINATH SAKHARAM MALPOTE",
    expectMethod: "UPI",
  },
  {
    name: "ICICI UPI with VPA handle",
    raw: "UPI IN/546035039121/dripchatagency@okicici",
    expectPayee: "dripchatagency",
    expectMethod: "UPI",
  },
  {
    name: "US card purchase with masked tail",
    raw: "CARD PURCHASE 03/14 STARBUCKS STORE 04821 XXXX4471",
    expectPayee: "STARBUCKS STORE",
    expectMethod: "Card",
  },
  {
    name: "UK direct debit",
    raw: "DIRECT DEBIT THAMES WATER UTILITIES REF 8837261923",
    expectPayee: "THAMES WATER UTILITIES",
    expectMethod: "Direct Debit",
  },
  {
    name: "NEFT with IFSC code",
    raw: "NEFT-HDFC0000123-ACME TRADING PVT LTD-N084251234567",
    expectPayee: "ACME TRADING PVT LTD",
    expectMethod: "NEFT",
  },
  {
    name: "ATM withdrawal",
    raw: "ATM WDL/ATM 12345/BARCLAYS HIGH ST/998877",
    expectPayee: "BARCLAYS HIGH ST",
    expectMethod: "ATM",
  },
  {
    name: "plain merchant, no rail or reference",
    raw: "TESCO STORES 3421",
    expectPayee: "TESCO STORES",
    expectMethod: null,
  },
];

const CATEGORY_CASES: CategoryCase[] = [
  { name: "UPI to individual", raw: "UPI/malpotesainath-/UPI/KARNATAKA BANK/509373283868/SAINATH SAKHARAM MALPOTE", amount: -2500, expect: null },
  { name: "Starbucks debit", raw: "CARD PURCHASE STARBUCKS STORE 04821", amount: -6.4, expect: "Dining" },
  { name: "Thames Water DD", raw: "DIRECT DEBIT THAMES WATER UTILITIES", amount: -42.18, expect: "Utilities" },
  { name: "Tesco groceries", raw: "TESCO STORES 3421", amount: -87.2, expect: "Groceries" },
  { name: "Shell fuel", raw: "POS SHELL SERVICE STATION", amount: -55.0, expect: "Fuel" },
  { name: "AWS is SaaS not shopping", raw: "AMAZON WEB SERVICES AWS EMEA", amount: -212.4, expect: "Software & SaaS" },
  { name: "Amazon retail is shopping", raw: "AMAZON.CO.UK*MT4RT9", amount: -34.99, expect: "Shopping" },
  { name: "payroll credit is income", raw: "DIRECT DEP PAYROLL ACME CORP", amount: 4200, expect: "Income" },
  { name: "payroll debit is NOT income", raw: "PAYROLL SERVICES LTD INVOICE", amount: -350, expect: null },
  { name: "ATM beats merchant name", raw: "ATM WDL/BARCLAYS HIGH ST", amount: -100, expect: "Cash & ATM" },
  { name: "bank fee beats everything", raw: "MONTHLY SERVICE CHARGE", amount: -12, expect: "Bank Fees" },
  { name: "Netflix subscription", raw: "NETFLIX.COM", amount: -15.99, expect: "Subscriptions" },
  { name: "Uber transport", raw: "UBER *TRIP HELP.UBER.COM", amount: -18.3, expect: "Transport" },
  { name: "unknown merchant stays null", raw: "QWERTY HOLDINGS 8827", amount: -50, expect: null },
];

let failures = 0;

console.log("\n=== payee extraction ===\n");
for (const c of PAYEE_CASES) {
  const got = extractPayee(c.raw);
  const payeeOk = got.payee === c.expectPayee;
  const methodOk = c.expectMethod === undefined || got.method === c.expectMethod;
  const ok = payeeOk && methodOk;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}`);
  if (!ok) {
    console.log(`      raw:      ${c.raw}`);
    console.log(`      expected: payee=${JSON.stringify(c.expectPayee)} method=${JSON.stringify(c.expectMethod)}`);
    console.log(`      got:      payee=${JSON.stringify(got.payee)} method=${JSON.stringify(got.method)}`);
  }
}

console.log("\n=== categorisation ===\n");
for (const c of CATEGORY_CASES) {
  const got = categorize(c.raw, c.amount);
  const ok = got.category === c.expect;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}`);
  if (!ok) {
    console.log(`      raw:      ${c.raw}`);
    console.log(`      expected: ${c.expect}`);
    console.log(`      got:      ${got.category} (rule=${got.rule}, conf=${got.confidence})`);
  }
}

const coverage = measureCoverage(CATEGORY_CASES.map((c) => ({ description: c.raw, amount: c.amount })));
console.log(`\ncoverage on fixtures: ${coverage.matched}/${coverage.total} (${(coverage.coverage * 100).toFixed(0)}%)`);
console.log("NOTE: coverage here is meaningless as a product metric -- these fixtures are");
console.log("hand-picked. Run measureCoverage() against real parsed statements before");
console.log("deciding whether a model-backed fallback is warranted.\n");

if (failures > 0) {
  console.error(`${failures} check(s) failed\n`);
  process.exit(1);
}
console.log("all checks passed\n");
