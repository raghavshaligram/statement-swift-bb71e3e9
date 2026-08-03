/**
 * Parser verification harness.
 *
 * Every fixture below replicates a REAL failure mode that was found on a real
 * bank statement and fixed in src/lib/pdf/parse-transactions.ts (each fix is
 * documented in that file's comments, citing the statement it came from).
 * This script is the regression net: if a change to the parser breaks any of
 * these, it re-breaks a real statement a real user already hit.
 *
 * Run:  npx tsx scripts/parser-check.ts
 * Exits non-zero on any failure, prints a per-fixture pass/fail summary.
 *
 * Fixtures are synthetic PageText objects (not PDFs) so this runs in Node
 * with zero pdf.js/browser dependency — it tests the parsing layers only:
 * row grouping, block/anchor assignment, column classification, amount
 * parsing, date inference, summary/B-F/appendix filtering, and the
 * balance-continuity sign correction.
 */

import { parseTransactionsFromPages, type RawTransaction } from "../src/lib/pdf/parse-transactions";
import type { PageText, TextItem } from "../src/lib/pdf/extract-text";

// --- fixture construction helpers -------------------------------------------

type LineSpec = Array<{ str: string; x: number }>;

function makeItems(lines: LineSpec[], startY = 10, lineHeight = 12): TextItem[] {
  const items: TextItem[] = [];
  lines.forEach((line, i) => {
    for (const tok of line) {
      items.push({
        str: tok.str,
        x: tok.x,
        y: startY + i * lineHeight,
        width: tok.str.length * 5,
        height: 10,
      });
    }
  });
  return items;
}

/** Convenience: lay a line out left-to-right with fixed gaps, one item per token. */
function flow(...tokens: string[]): LineSpec {
  let x = 10;
  return tokens.map((str) => {
    const spec = { str, x };
    x += str.length * 5 + 15;
    return spec;
  });
}

function page(lines: LineSpec[], pageNumber = 1): PageText {
  const items = makeItems(lines);
  return { pageNumber, items, rawText: items.map((i) => i.str).join(" ") };
}

function fullTextOf(pages: PageText[]): string {
  return pages.map((p) => p.rawText).join("\n");
}

// --- assertion plumbing ------------------------------------------------------

let failures = 0;
let currentFixture = "";

function check(label: string, cond: boolean, detail?: string) {
  if (cond) return;
  failures++;
  console.error(`  ✗ [${currentFixture}] ${label}${detail ? ` — ${detail}` : ""}`);
}

function approx(a: number, b: number) {
  return Math.abs(a - b) < 0.005;
}

function run(name: string, pages: PageText[], assertions: (txns: RawTransaction[]) => void) {
  currentFixture = name;
  const before = failures;
  let txns: RawTransaction[] = [];
  try {
    txns = parseTransactionsFromPages(pages, fullTextOf(pages));
    assertions(txns);
  } catch (err) {
    failures++;
    console.error(`  ✗ [${name}] threw: ${err instanceof Error ? err.message : err}`);
  }
  console.log(`${failures === before ? "✓" : "✗"} ${name} (${txns.length} txns)`);
}

// =============================================================================
// 1. Plain US statement — MM/DD/YYYY slash dates, "last two numbers" layout.
//    The baseline simple case; the positional fallback path must handle this
//    with no header row present.
// =============================================================================
run(
  "us-basic-positional",
  [
    page([
      flow("Statement", "Period", "06/01/2025", "to", "06/30/2025"),
      flow("06/03/2025", "ACH", "DEPOSIT", "PAYROLL", "2,000.00", "5,000.00"),
      flow("06/10/2025", "CARD", "PURCHASE", "GROCERY", "150.25", "4,849.75"),
      flow("06/15/2025", "CHECK", "1042", "300.00", "4,549.75"),
    ]),
  ],
  (t) => {
    check("3 transactions", t.length === 3, `got ${t.length}`);
    check("slash dates inferred MDY", t[0]?.date === "2025-06-03", t[0]?.date);
    check("deposit positive", approx(t[0]?.amount, 2000));
    check("purchase sign corrected to negative via balance continuity", approx(t[1]?.amount, -150.25), String(t[1]?.amount));
    check("check sign corrected to negative", approx(t[2]?.amount, -300));
    check("balances captured", approx(t[2]?.balance ?? NaN, 4549.75));
  }
);

// =============================================================================
// 2. Federal Bank collapse — deposits and withdrawals occupy the SAME visual
//    position ("2500.00 10089.41" is a deposit, "797.00 9292.41" a withdrawal).
//    Position alone gets the sign wrong; the balance delta is the authority.
//    Also: UPI rail/reference must survive into the description (an earlier
//    version stripped "UPI" as noise), and the reference number must land in
//    tranId. DD-MM dash dates must infer DMY.
// =============================================================================
run(
  "federal-bank-sign-collapse",
  [
    page([
      flow("01-04-2025", "UPI", "IN/546035039121/dripchatagency@okicici", "2,500.00", "10,089.41"),
      flow("02-04-2025", "UPI", "OUT/546099887766/merchant@oksbi", "797.00", "9,292.41"),
      flow("15-04-2025", "NEFT", "SALARY", "CREDIT", "50,000.00", "59,292.41"),
    ]),
  ],
  (t) => {
    check("3 transactions", t.length === 3, `got ${t.length}`);
    check("dash dates inferred DMY (15-04 forces it)", t[0]?.date === "2025-04-01", t[0]?.date);
    check("withdrawal sign flipped by balance delta", approx(t[1]?.amount, -797), String(t[1]?.amount));
    check("deposit stays positive", approx(t[2]?.amount, 50000));
    check("UPI rail kept in description", /UPI/.test(t[0]?.description ?? ""), t[0]?.description);
    check("reference recovered into tranId", /546035039121/.test(t[0]?.tranId ?? ""), String(t[0]?.tranId));
    check("drCr reflects balance standing (positive => Cr) even on withdrawal", t[1]?.drCr === "Cr");
  }
);

// =============================================================================
// 3. ICICI shape — header row with distinct columns (incl. Value Date and
//    Cheque No), lakh-grouped amounts (1,00,116.00), a dated B/F row that must
//    be dropped, and a dated appendix row ("Summary of TDS...") that must be
//    dropped. The lakh case previously silently dropped whole transactions;
//    the B/F row previously exported as a phantom ₹97k deposit; the appendix
//    row previously created a -37.9L "transaction".
// =============================================================================
run(
  "icici-columns-lakh-bf-appendix",
  [
    page([
      [
        { str: "Date", x: 10 },
        { str: "Value Date", x: 80 },
        { str: "Particulars", x: 170 },
        { str: "Cheque No.", x: 330 },
        { str: "Withdrawals", x: 420 },
        { str: "Deposits", x: 510 },
        { str: "Balance", x: 600 },
      ],
      [
        { str: "01-04-2025", x: 10 },
        { str: "B/F", x: 170 },
        { str: "97,532.73", x: 600 },
      ],
      [
        { str: "03-04-2025", x: 10 },
        { str: "03-04-2025", x: 80 },
        { str: "NEFT/AXISCN0999/ACME CO", x: 170 },
        { str: "1,00,116.00", x: 510 },
        { str: "1,97,648.73", x: 600 },
      ],
      [
        { str: "05-04-2025", x: 10 },
        { str: "04-04-2025", x: 80 },
        { str: "CHQ PAID TO LANDLORD", x: 170 },
        { str: "000123", x: 330 },
        { str: "25,000.00", x: 420 },
        { str: "1,72,648.73", x: 600 },
      ],
      [
        { str: "Summary of TDS 30-04-2025", x: 10 },
        { str: "3,791,242.79", x: 420 },
      ],
    ]),
  ],
  (t) => {
    check("exactly 2 real transactions (B/F and appendix dropped)", t.length === 2, `got ${t.length}: ${t.map((x) => x.description).join(" | ")}`);
    check("lakh amount parsed", approx(t[0]?.amount, 100116), String(t[0]?.amount));
    check("deposit column => positive without needing continuity", t[0]?.amount > 0);
    check("withdrawal column => negative", approx(t[1]?.amount, -25000), String(t[1]?.amount));
    check("value date captured separately", t[1]?.valueDate === "2025-04-04", String(t[1]?.valueDate));
    check("cheque number captured", t[1]?.chequeDetails === "000123", String(t[1]?.chequeDetails));
    check("value date not leaked into description", !/04-04-2025/.test(t[1]?.description ?? ""), t[1]?.description);
    check("lakh balance parsed", approx(t[0]?.balance ?? NaN, 197648.73));
  }
);

// =============================================================================
// 4. UK Chase — £ currency symbol with explicit leading +/-, no balance
//    column at all. The amount regex previously only knew $/-, found ZERO
//    numbers on every row, and produced nothing. Also: a summary row reading
//    "Opening balance ... Closing balance" must NOT be mistaken for a header
//    row (two matches, but only one distinct role).
// =============================================================================
run(
  "uk-chase-currency-signs",
  [
    page([
      flow("Opening", "balance", "£500.00", "Closing", "balance", "£398.05"),
      flow("02/06/2025", "Interest", "earned", "+£0.04"),
      flow("05/06/2025", "AMAZON", "MARKETPLACE", "-£101.99"),
    ]),
  ],
  (t) => {
    check("2 transactions (summary row not a txn, not a header)", t.length === 2, `got ${t.length}`);
    check("+£ credit parsed positive", approx(t[0]?.amount, 0.04), String(t[0]?.amount));
    check("-£ debit parsed negative", approx(t[1]?.amount, -101.99), String(t[1]?.amount));
    check("no balance invented", t[0]?.balance === null && t[1]?.balance === null);
  }
);

// =============================================================================
// 5. Scanned credit card (OCR) — a date OCR'd onto its own line separated
//    from the rest of its row ("01/22/18" alone, then "SM NORTH TRAVEL CLUB
//    QUEZON CITY 6,500.00" as a separate row): the date-only anchor must
//    reunite them instead of losing the content to the next transaction.
//    "Previous Balance 25,000.00" (no date) must be filtered before block
//    grouping, not absorbed as a bigger amount into the first transaction.
//    A trailing C suffix ("20,000.00C") is an explicit credit marker.
// =============================================================================
run(
  "scanned-card-ocr-splits",
  [
    page([
      flow("Previous", "Balance", "25,000.00"),
      flow("01/22/18"),
      flow("SM", "NORTH", "TRAVEL", "CLUB", "QUEZON", "CITY", "6,500.00"),
      flow("01/25/18", "PAYMENT", "RECEIVED", "THANK", "YOU", "20,000.00C"),
    ]),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}: ${t.map((x) => `${x.date} ${x.description} ${x.amount}`).join(" | ")}`);
    check("split row reunited with its own date", /TRAVEL CLUB/.test(t[0]?.description ?? ""), t[0]?.description);
    check("split row amount stays with its own txn", approx(Math.abs(t[0]?.amount ?? 0), 6500), String(t[0]?.amount));
    check("2-digit year expanded", t[0]?.date === "2018-01-22", t[0]?.date);
    check("Previous Balance not absorbed anywhere", !t.some((x) => approx(Math.abs(x.amount), 25000)));
    check("C suffix forces credit", approx(t[1]?.amount, 20000), String(t[1]?.amount));
  }
);

// =============================================================================
// 6. Month-name dates + OCR digit confusion — "15-Jan-2025", "Jan 16, 2025",
//    missing separators ("01Nov2023"), and O-for-0 misreads ("O1-Nov-2023")
//    must all resolve; "Nov" must NOT be corrupted by O→0 normalization.
// =============================================================================
run(
  "month-name-and-ocr-dates",
  [
    page([
      flow("15-Jan-2025", "COFFEE", "SHOP", "4.50", "995.50"),
      flow("Jan", "16,", "2025", "BOOKSTORE", "20.00", "975.50"),
      flow("01Nov2023", "OLD", "ENTRY", "10.00", "965.50"),
    ]),
  ],
  (t) => {
    check("3 transactions", t.length === 3, `got ${t.length}`);
    check("DD-Mon-YYYY", t[0]?.date === "2025-01-15", t[0]?.date);
    check("Mon DD, YYYY", t[1]?.date === "2025-01-16", t[1]?.date);
    check("no-separator month name survives (Nov not corrupted)", t[2]?.date === "2023-11-01", t[2]?.date);
  }
);

// =============================================================================
// 7. ICICI multi-line block order — prefix line (no date) ABOVE its own
//    date+amount line, then a payee suffix line below. Nearest-anchor
//    assignment must attach the prefix forward to the txn it precedes, not
//    backward into the previous one. Description separator joins must not
//    inject spaces mid-token ("BANK/509373283868", not "BANK /509373283868").
// =============================================================================
run(
  "multiline-prefix-suffix-blocks",
  [
    page([
      flow("01-05-2025", "OPENING", "PURCHASE", "500.00", "9,500.00"),
      flow("UPI/malpotesainath-/UPI/KARNATAKA", "BANK/"),
      flow("03-05-2025", "509373283868/ICI9c36f2", "1,200.00", "8,300.00"),
      flow("SAINATH", "MALPOTE"),
    ]),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check("prefix attached forward, not stolen by earlier txn", !/KARNATAKA/.test(t[0]?.description ?? ""), t[0]?.description);
    check("prefix present on its own txn", /KARNATAKA/.test(t[1]?.description ?? ""), t[1]?.description);
    check("suffix line attached backward", /SAINATH/.test(t[1]?.description ?? ""), t[1]?.description);
    check("mid-token line wrap joined without space", /BANK\/509373283868/.test(t[1]?.description ?? ""), t[1]?.description);
    check("sign corrected via continuity", approx(t[1]?.amount, -1200), String(t[1]?.amount));
  }
);

// -----------------------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.error(`${failures} assertion(s) FAILED`);
  process.exit(1);
} else {
  console.log("All parser fixtures pass.");
}
