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

/**
 * Places description words starting at a fixed x, for fixture rows that
 * also have fixed-position columns after the description (date/amount/
 * balance etc.) -- unlike flow(), a longer description here doesn't shift
 * where the later columns land, matching how a real PDF table renders (each
 * column at a consistent x regardless of description length).
 */
function descWords(words: string[], xStart: number): LineSpec {
  let x = xStart;
  return words.map((w) => {
    const spec = { str: w, x };
    x += w.length * 4.5 + 6;
    return spec;
  });
}

/**
 * Page builder with EXPLICIT per-line y positions.
 *
 * The uniform-spacing `page()` helper below cannot represent layouts where
 * intra-cell line spacing differs from inter-row spacing -- it puts every line
 * exactly `lineHeight` apart, so a wrapped continuation is equidistant from
 * both neighbouring anchors in geometry as well as in row index. That made the
 * Federal Bank continuation bug invisible to this harness: the fixtures could
 * not express the very property the fix relies on.
 */
function pageAtYs(lines: LineSpec[], ys: number[], pageNumber = 1): PageText {
  const items: TextItem[] = [];
  lines.forEach((line, i) => {
    for (const tok of line) {
      items.push({ str: tok.str, x: tok.x, y: ys[i], width: tok.str.length * 5, height: 10 });
    }
  });
  return { pageNumber, items, rawText: items.map((i) => i.str).join(" ") };
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
    check(
      "purchase sign corrected to negative via balance continuity",
      approx(t[1]?.amount, -150.25),
      String(t[1]?.amount),
    );
    check("check sign corrected to negative", approx(t[2]?.amount, -300));
    check("balances captured", approx(t[2]?.balance ?? NaN, 4549.75));
  },
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
    check(
      "withdrawal sign flipped by balance delta",
      approx(t[1]?.amount, -797),
      String(t[1]?.amount),
    );
    check("deposit stays positive", approx(t[2]?.amount, 50000));
    check("UPI rail kept in description", /UPI/.test(t[0]?.description ?? ""), t[0]?.description);
    check(
      "reference recovered into tranId",
      /546035039121/.test(t[0]?.tranId ?? ""),
      String(t[0]?.tranId),
    );
    // This assertion previously required the OPPOSITE -- that a withdrawal on
    // a positive-balance account exports as "Cr". That encoded a misreading of
    // one sample (a balance-state indicator mistaken for transaction
    // direction) and is precisely why the bug survived: the harness was
    // defending it. Confirmed wrong against a real 78-row Federal Bank export
    // where all 44 debits came out "Cr".
    check(
      "withdrawal is Dr even though the balance stays positive",
      t[1]?.drCr === "Dr",
      String(t[1]?.drCr),
    );
  },
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
    check(
      "exactly 2 real transactions (B/F and appendix dropped)",
      t.length === 2,
      `got ${t.length}: ${t.map((x) => x.description).join(" | ")}`,
    );
    check("lakh amount parsed", approx(t[0]?.amount, 100116), String(t[0]?.amount));
    check("deposit column => positive without needing continuity", t[0]?.amount > 0);
    check("withdrawal column => negative", approx(t[1]?.amount, -25000), String(t[1]?.amount));
    check(
      "value date captured separately",
      t[1]?.valueDate === "2025-04-04",
      String(t[1]?.valueDate),
    );
    check("cheque number captured", t[1]?.chequeDetails === "000123", String(t[1]?.chequeDetails));
    check(
      "value date not leaked into description",
      !/04-04-2025/.test(t[1]?.description ?? ""),
      t[1]?.description,
    );
    check("lakh balance parsed", approx(t[0]?.balance ?? NaN, 197648.73));
  },
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
    check(
      "2 transactions (summary row not a txn, not a header)",
      t.length === 2,
      `got ${t.length}`,
    );
    check("+£ credit parsed positive", approx(t[0]?.amount, 0.04), String(t[0]?.amount));
    check("-£ debit parsed negative", approx(t[1]?.amount, -101.99), String(t[1]?.amount));
    check("no balance invented", t[0]?.balance === null && t[1]?.balance === null);
  },
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
    check(
      "2 transactions",
      t.length === 2,
      `got ${t.length}: ${t.map((x) => `${x.date} ${x.description} ${x.amount}`).join(" | ")}`,
    );
    check(
      "split row reunited with its own date",
      /TRAVEL CLUB/.test(t[0]?.description ?? ""),
      t[0]?.description,
    );
    check(
      "split row amount stays with its own txn",
      approx(Math.abs(t[0]?.amount ?? 0), 6500),
      String(t[0]?.amount),
    );
    check("2-digit year expanded", t[0]?.date === "2018-01-22", t[0]?.date);
    check(
      "Previous Balance not absorbed anywhere",
      !t.some((x) => approx(Math.abs(x.amount), 25000)),
    );
    check("C suffix forces credit", approx(t[1]?.amount, 20000), String(t[1]?.amount));
  },
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
    check(
      "no-separator month name survives (Nov not corrupted)",
      t[2]?.date === "2023-11-01",
      t[2]?.date,
    );
  },
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
    check(
      "prefix attached forward, not stolen by earlier txn",
      !/KARNATAKA/.test(t[0]?.description ?? ""),
      t[0]?.description,
    );
    check(
      "prefix present on its own txn",
      /KARNATAKA/.test(t[1]?.description ?? ""),
      t[1]?.description,
    );
    check(
      "suffix line attached backward",
      /SAINATH/.test(t[1]?.description ?? ""),
      t[1]?.description,
    );
    check(
      "mid-token line wrap joined without space",
      /BANK\/509373283868/.test(t[1]?.description ?? ""),
      t[1]?.description,
    );
    check("sign corrected via continuity", approx(t[1]?.amount, -1200), String(t[1]?.amount));
  },
);

// =============================================================================
// 8. Federal Bank stacked two-line header — "Tran Type", "Cheque Details",
//    and "DR/CR" each render as two PDF text items only a few px apart
//    (closer than a real description wrap, but wider than the row-grouping
//    tolerance), landing as their own Row above/below the single-line
//    header labels. Found via a REAL user-submitted Federal Bank statement:
//    the leftover fragment row was getting glued onto the first transaction
//    as a phantom prefix, and "Tran Type" was never registered as a column
//    at all, so its data ("TFR") collided with the neighboring "Tran ID"
//    column and corrupted both fields for every single transaction in the
//    document.
// =============================================================================
run(
  "federal-bank-stacked-two-line-header",
  [
    page([
      [
        { str: "Tran", x: 266 },
        { str: "Cheque", x: 373 },
        { str: "DR", x: 563 },
      ],
      [
        { str: "Date", x: 33 },
        { str: "Value Date", x: 79 },
        { str: "Particulars", x: 173 },
        { str: "Tran ID", x: 311 },
        { str: "Withdrawals", x: 419 },
        { str: "Deposits", x: 474 },
        { str: "Balance", x: 518 },
      ],
      [
        { str: "Type", x: 266 },
        { str: "Details", x: 374 },
        { str: "/CR", x: 562 },
      ],
      [
        { str: "04-APR-2025", x: 22 },
        { str: "04-APR-2025", x: 79 },
        { str: "UPI IN/546035039121", x: 129 },
        { str: "TFR", x: 273 },
        { str: "S82430280", x: 318 },
        { str: "2500.00", x: 481 },
        { str: "10089.41", x: 521 },
        { str: "Cr", x: 572 },
      ],
      [{ str: "/dripchatagency@okicici/U/0000", x: 129 }],
      [
        { str: "19-APR-2025", x: 22 },
        { str: "19-APR-2025", x: 79 },
        { str: "CHRG/DEBIT CARD AMC/XX7162", x: 129 },
        { str: "TFR", x: 273 },
        { str: "S86257980", x: 318 },
        { str: "797.00", x: 419 },
        { str: "9292.41", x: 521 },
        { str: "Cr", x: 572 },
      ],
    ]),
  ],
  (t) => {
    check(
      "2 transactions (header continuation row not treated as a phantom 3rd)",
      t.length === 2,
      `got ${t.length}`,
    );
    check("date parsed correctly", t[0]?.date === "2025-04-04", t[0]?.date);
    check("tranType is TFR, not the tran ID", t[0]?.tranType === "TFR", String(t[0]?.tranType));
    check("tranId is the real ID, not TFR", t[0]?.tranId === "S82430280", String(t[0]?.tranId));
    check("deposit amount positive and correct", approx(t[0]?.amount, 2500), String(t[0]?.amount));
    check("balance correct", approx(t[0]?.balance ?? NaN, 10089.41));
    check(
      "withdrawal amount negative and correct",
      approx(t[1]?.amount, -797),
      String(t[1]?.amount),
    );
    check(
      "second row's tranType also correctly separated from tranId",
      t[1]?.tranType === "TFR" && t[1]?.tranId === "S86257980",
    );
  },
);

// =============================================================================
// 9. Leading separator strand — reported from the live app: every description
//    rendered with a "/" in front of it.
//
//    Cause: statements in this family print the date on the SAME visual line as
//    a separator-prefixed continuation ("03-04-2025    /509373283868/ICI9c36...").
//    removeToken consumes the date plus its surrounding whitespace and joins
//    without a space when either side is a separator — correct mid-string, but
//    at position 0 it leaves the separator exposed. The final normalisation
//    only trimmed whitespace, so it survived all the way into the export.
//
//    The bank's own internal separators must still be preserved verbatim (the
//    decision documented in buildDescription); only the exposed edges go.
// =============================================================================
run(
  "leading-separator-strand",
  [
    page([
      flow("03-04-2025", "/509373283868/ICI9c363fb8fb1d43369a59", "1,000.00", "5,000.00"),
      flow("04-04-2025", "UPI/merchant@okaxis/", "250.00", "4,750.00"),
      flow("15-04-2025", "NEFT/HDFC0000123/ACME TRADING", "500.00", "4,250.00"),
    ]),
  ],
  (t) => {
    check("3 transactions", t.length === 3, `got ${t.length}`);
    check(
      "no leading separator on any description",
      t.every((x) => !/^[/\\-]/.test(x.description)),
      JSON.stringify(t.map((x) => x.description)),
    );
    check(
      "no trailing separator on any description",
      t.every((x) => !/[/\\-]$/.test(x.description)),
      JSON.stringify(t.map((x) => x.description)),
    );
    check(
      "internal separators preserved verbatim",
      t[0]?.description === "509373283868/ICI9c363fb8fb1d43369a59",
      t[0]?.description,
    );
    check(
      "rail token and its slash still preserved",
      t[1]?.description === "UPI/merchant@okaxis",
      t[1]?.description,
    );
  },
);

// =============================================================================
// 10. Comma-decimal locales (DE/FR/ES/IT/NL/BR) and zero-decimal currencies
//     (JPY/KRW/VND/IDR). Both previously matched ZERO number tokens, and
//     buildTransactionFromBlock bails on numbers.length === 0, so every row
//     was silently dropped -- an empty result, not a wrong one. Same failure
//     signature as the ICICI date bug.
// =============================================================================
run(
  "german-comma-decimal",
  [
    page([
      flow("Datum", "Buchungstext", "Betrag", "Saldo"),
      flow("03.04.2025", "REWE MARKT GMBH", "-87,20", "1.234,56"),
      flow("04.04.2025", "GEHALT APRIL", "2.500,00", "3.734,56"),
      flow("15.04.2025", "MIETE WOHNUNG", "-1.100,00", "2.634,56"),
    ]),
  ],
  (t) => {
    check("3 transactions", t.length === 3, `got ${t.length}`);
    check("comma decimal parsed", approx(t[0]?.amount, -87.2), String(t[0]?.amount));
    check("dot grouping not eaten", approx(t[2]?.amount, -1100), String(t[2]?.amount));
    check("grouped balance correct", approx(t[0]?.balance ?? NaN, 1234.56), String(t[0]?.balance));
    check("credit stays positive", approx(t[1]?.amount, 2500), String(t[1]?.amount));
  },
);

run(
  "yen-zero-decimal",
  [
    page([
      flow("2025/04/03", "SEVEN ELEVEN", "-1,500", "125,000"),
      flow("2025/04/04", "SALARY", "350,000", "475,000"),
    ]),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check("zero-decimal amount parsed", approx(t[0]?.amount, -1500), String(t[0]?.amount));
    check(
      "zero-decimal balance parsed",
      approx(t[0]?.balance ?? NaN, 125000),
      String(t[0]?.balance),
    );
  },
);

run(
  "reference-numbers-still-excluded",
  [
    page([
      flow("03-04-2025", "UPI/509373283868/PAYEE NAME", "1,000.00", "5,000.00"),
      flow("04-04-2025", "NEFT/123456789012/OTHER", "250.00", "4,750.00"),
    ]),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check(
      "12-digit reference not read as an amount",
      approx(t[0]?.amount, -1000) || approx(t[0]?.amount, 1000),
      String(t[0]?.amount),
    );
    check("balance is the real balance", approx(t[0]?.balance ?? NaN, 5000), String(t[0]?.balance));
  },
);

// =============================================================================
// 11. Dr/Cr must follow the AMOUNT, not the balance. Derived from the balance
//     sign, every row on a normal (positive-balance) account exported as "Cr"
//     -- confirmed on a real 78-row Federal Bank export where all 44 debits
//     were mislabelled. Silent, and wrong in the direction that matters most.
// =============================================================================
run(
  "drcr-follows-amount-not-balance",
  [
    page([
      flow("03/04/2025", "DEPOSIT PAYROLL", "2,000.00", "5,000.00"),
      flow("04/04/2025", "CARD PURCHASE GROCERY", "150.25", "4,849.75"),
      flow("05/04/2025", "ATM WITHDRAWAL", "300.00", "4,549.75"),
    ]),
  ],
  (t) => {
    check("3 transactions", t.length === 3, `got ${t.length}`);
    check("credit is Cr", t[0]?.drCr === "Cr", String(t[0]?.drCr));
    check("debit is Dr despite positive balance", t[1]?.drCr === "Dr", String(t[1]?.drCr));
    check("second debit is Dr too", t[2]?.drCr === "Dr", String(t[2]?.drCr));
    check(
      "drCr agrees with amount sign on every row",
      t.every((x) => (x.amount < 0 ? x.drCr === "Dr" : x.drCr === "Cr")),
      JSON.stringify(t.map((x) => [x.amount, x.drCr])),
    );
  },
);

// =============================================================================
// 12. Federal Bank wrapped-cell continuation. THE bug behind the "descriptions
//     are broken" report and behind 56% of rows being uncategorisable.
//
//     The Particulars cell wraps, so the counterparty sits on its own line
//     BELOW the dated row:
//
//       y=616.8  24-JUN-2025 ... UPI IN/554108932624 ... 9000.00
//       y=625.2               /dripchatagency@okicici/U/0000
//       y=641.9  10-JUL-2025 ... NFT/PAYPAL PAYMENTS  ... 2185.57
//
//     By ROW INDEX that continuation is exactly 1 from each neighbouring
//     anchor -- a tie -- and the old tie-break always preferred the LATER
//     anchor. So every counterparty was donated to the following transaction,
//     leaving rail fragments ("IN", "IFO", "CHRG") as descriptions.
//
//     Row-index distance cannot distinguish a prefix line from a suffix line.
//     Vertical distance can, because intra-cell line spacing is tighter than
//     inter-row spacing. Fixture below encodes both directions so neither
//     regresses.
// =============================================================================
run(
  "wrapped-cell-continuation-stays-with-own-row",
  [
    // y values taken from the real statement: anchors ~25pt apart, wrapped
    // continuation only ~8pt below its own anchor.
    pageAtYs(
      [
        flow("24-JUN-2025", "UPI IN/554108932624", "TFR", "9,000.00", "62,904.74"),
        flow("/dripchatagency@okicici/U/0000"),
        flow("10-JUL-2025", "NFT/PAYPAL PAYMENTS", "FT", "2,185.57", "65,090.31"),
        flow("/CITIN25592084366/CITI"),
      ],
      [616.8, 625.2, 641.9, 650.3],
      1,
    ),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check(
      "counterparty stays on its own row, not the next one",
      t[0]?.description?.includes("dripchatagency") === true,
      t[0]?.description,
    );
    check(
      "following row is not contaminated by the previous counterparty",
      t[1]?.description?.includes("dripchatagency") === false,
      t[1]?.description,
    );
    check(
      "following row keeps its own continuation",
      t[1]?.description?.includes("CITIN25592084366") === true,
      t[1]?.description,
    );
  },
);

// =============================================================================
// 13. Repeated page furniture (running footers, disclaimers) was being
//     absorbed into whichever transaction ended each page.
//
//     Furniture requires repeated text AND a stable y. Text alone is NOT
//     enough -- the first attempt at this filtered on repetition only and
//     deleted "/dripchatagency@okicici/U/0000" from 21 real transactions,
//     because the same counterparty legitimately recurs across pages. Footers
//     are pinned to a fixed y; transaction content is not.
// =============================================================================
run(
  "repeated-footer-filtered-but-repeated-content-kept",
  [
    // The counterparty line sits at a DIFFERENT y on each page (real content
    // moves down the page); the footer sits at the SAME y on both.
    pageAtYs(
      [
        flow("04-APR-2025", "UPI IN/546035039121", "TFR", "2,500.00", "10,089.41"),
        flow("/dripchatagency@okicici/U/0000"),
        flow("The Federal Bank Ltd. Corporate Office: Federal Towers Market Rd Aluva Kerala"),
      ],
      [120.0, 128.4, 780.0],
      1,
    ),
    pageAtYs(
      [
        flow("12-MAY-2025", "UPI IN/549892392860", "TFR", "15,000.00", "25,089.41"),
        flow("/dripchatagency@okicici/U/0000"),
        flow("The Federal Bank Ltd. Corporate Office: Federal Towers Market Rd Aluva Kerala"),
      ],
      [402.0, 410.4, 780.0],
      2,
    ),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check(
      "footer not absorbed into any description",
      t.every((x) => !/Corporate Office/i.test(x.description)),
      JSON.stringify(t.map((x) => x.description)),
    );
    check(
      "repeated counterparty NOT mistaken for furniture",
      t.every((x) => x.description.includes("dripchatagency")),
      JSON.stringify(t.map((x) => x.description)),
    );
  },
);

// =============================================================================
// 14. Non-English column headers. Number and date parsing already handled
//     comma-decimal locales, but every header label was English, so these
//     statements found no header row and fell through to positional
//     inference -- which is worst at exactly what these layouts need, an
//     explicit Soll/Haben (debit/credit) column split.
//
//     Also asserts diacritic stripping: "Libellé" and "Descrição" must match
//     patterns written unaccented.
// =============================================================================
// Explicit x positions so tokens land under their own header. `flow()` lays
// out by string length, which pushes an amount under the wrong column as soon
// as the payee is long -- the fixture geometry, not the parser, was wrong on
// the first attempt here.
const COLS = [10, 90, 180, 300, 380, 460];
const at = (...cells: Array<string>): LineSpec =>
  cells.map((str, i) => ({ str, x: COLS[i] })).filter((c) => c.str !== "");

run(
  "german-header-labels",
  [
    pageAtYs(
      [
        at("Buchungstag", "Wertstellung", "Buchungstext", "Soll", "Haben", "Saldo"),
        at("03.04.2025", "03.04.2025", "REWE MARKT GMBH", "87,20", "", "1.234,56"),
        at("04.04.2025", "04.04.2025", "GEHALT APRIL", "", "2.500,00", "3.734,56"),
      ],
      [100, 125, 150],
      1,
    ),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check("Soll column read as a debit", approx(t[0]?.amount, -87.2), String(t[0]?.amount));
    check("Haben column read as a credit", approx(t[1]?.amount, 2500), String(t[1]?.amount));
    check(
      "drCr follows the amount",
      t[0]?.drCr === "Dr" && t[1]?.drCr === "Cr",
      `${t[0]?.drCr}/${t[1]?.drCr}`,
    );
  },
);

run(
  "accented-header-labels",
  [
    pageAtYs(
      [
        at("Date", "Date de valeur", "Libell\u00e9", "D\u00e9bit", "Cr\u00e9dit", "Solde"),
        at("03/04/2025", "03/04/2025", "CARREFOUR MARKET", "87,20", "", "1.234,56"),
        at("04/04/2025", "04/04/2025", "SALAIRE AVRIL", "", "2.500,00", "3.734,56"),
      ],
      [100, 125, 150],
      1,
    ),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check("accented Debit read as a debit", approx(t[0]?.amount, -87.2), String(t[0]?.amount));
    check("accented Credit read as a credit", approx(t[1]?.amount, 2500), String(t[1]?.amount));
    check("Date de valeur mapped to value date", t[0]?.valueDate !== null, String(t[0]?.valueDate));
  },
);

// =============================================================================
// 15. US bank year-less dates — Chase, Wells Fargo, and Capital One all
//     print bare MM/DD on every transaction row with no year at all (the
//     year appears once in a "Statement Period" line, not repeated per
//     row). Found via exploratory testing against synthetic layouts
//     modeled on real US bank statements: this returned ZERO transactions
//     before the fix, since every date pattern required a 4-digit year
//     unconditionally. Also covers inferDateOrder's blind spot for
//     documents where every date is year-less (it previously found no
//     year-bearing evidence at all and fell back to a hardcoded DMY
//     default, misreading "01/03" as 1 March instead of 3 January on a
//     "/"-separated US statement), a year rollover mid-statement
//     (Dec -> Jan), and a parenthesized negative amount ("(88.40)" =
//     -88.40, Capital One style).
// =============================================================================
run(
  "us-bank-yearless-dates-with-rollover",
  [
    page([
      [
        { str: "Date", x: 10 },
        { str: "Description", x: 60 },
        { str: "Amount", x: 300 },
        { str: "Balance", x: 380 },
      ],
      [
        { str: "12/28", x: 10 },
        ...descWords(["LATE", "DECEMBER", "PURCHASE"], 60),
        { str: "-40.00", x: 300 },
        { str: "1,960.00", x: 380 },
      ],
      [
        { str: "01/03", x: 10 },
        ...descWords(["EARLY", "JANUARY", "REFUND"], 60),
        { str: "(15.00)", x: 300 },
        { str: "1,945.00", x: 380 },
      ],
      [{ str: "Statement Period: 12/01/2024 to 01/31/2025", x: 10 }],
    ]),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check("year inferred from statement period text", t[0]?.date === "2024-12-28", t[0]?.date);
    check(
      "MM/DD (year-less, slash-separated) read as month-first, not day-first",
      t[0]?.date === "2024-12-28",
      t[0]?.date,
    );
    check(
      "year rolled over Dec -> Jan for the second transaction",
      t[1]?.date === "2025-01-03",
      t[1]?.date,
    );
    check(
      "parenthesized amount parsed as negative",
      approx(t[1]?.amount, -15),
      String(t[1]?.amount),
    );
    check("first amount correct", approx(t[0]?.amount, -40), String(t[0]?.amount));
  },
);

// =============================================================================
// 16. UK bank DD/MM inference + dated closing-summary filtering — Barclays
//     uses day-first dates that are only resolvable correctly once an
//     unambiguous date (day > 12) appears somewhere in the document; Bank
//     of America prints an "Ending balance on 1/31/2025 2,787.81" summary
//     line that carries a real date, so the pre-block no-date filter
//     deliberately lets it through (to protect real transactions that
//     merely mention "closing balance" in their own description) --
//     without a post-hoc filter using the fully-assembled description,
//     this became a phantom zero-amount transaction. Also covers a
//     2-digit-year month-name date ("02 Jan 25", HSBC style), which the
//     month-name pattern previously required a full 4-digit year for.
//     All found via exploratory testing against synthetic layouts modeled
//     on real UK/US bank statements.
// =============================================================================
run(
  "uk-dmy-inference-and-dated-summary-row",
  [
    page([
      [
        { str: "Date", x: 10 },
        { str: "Description", x: 90 },
        { str: "Money out", x: 300 },
        { str: "Money in", x: 380 },
        { str: "Balance", x: 460 },
      ],
      [
        { str: "03/01/2025", x: 10 },
        ...descWords(["TESCO", "STORES"], 90),
        { str: "22.50", x: 300 },
        { str: "1,477.50", x: 460 },
      ],
      // Unambiguous date (day 25 > 12) is the only thing that can correctly
      // force DMY inference here -- every other date in this fixture has a
      // day <= 12 and is genuinely ambiguous on its own.
      [
        { str: "25/01/2025", x: 10 },
        ...descWords(["ATM", "WITHDRAWAL"], 90),
        { str: "50.00", x: 300 },
        { str: "1,427.50", x: 460 },
      ],
      [
        { str: "Ending", x: 10 },
        { str: "balance", x: 60 },
        { str: "on", x: 110 },
        { str: "31/01/2025", x: 140 },
        { str: "1,427.50", x: 460 },
      ],
    ]),
  ],
  (t) => {
    check(
      "2 real transactions (dated 'Ending balance' summary row excluded)",
      t.length === 2,
      `got ${t.length}: ${t.map((x) => x.description).join(" | ")}`,
    );
    check("03/01/2025 read as 3 Jan, not 1 Mar (DMY)", t[0]?.date === "2025-01-03", t[0]?.date);
    check(
      "25/01/2025 read as 25 Jan (the disambiguating date itself)",
      t[1]?.date === "2025-01-25",
      t[1]?.date,
    );
  },
);

run(
  "hsbc-two-digit-year-month-name-date",
  [
    page([
      [
        { str: "Date", x: 10 },
        { str: "Type", x: 90 },
        { str: "Description", x: 130 },
        { str: "Paid out", x: 300 },
        { str: "Paid in", x: 380 },
        { str: "Balance", x: 460 },
      ],
      [
        { str: "02 Jan 25", x: 10 },
        { str: "DEB", x: 90 },
        ...descWords(["SAINSBURYS"], 130),
        { str: "34.12", x: 300 },
        { str: "965.88", x: 460 },
      ],
      [
        { str: "04 Jan 25", x: 10 },
        { str: "BAC", x: 90 },
        ...descWords(["WAGES", "LTD"], 130),
        { str: "2,100.00", x: 380 },
        { str: "3,065.88", x: 460 },
      ],
    ]),
  ],
  (t) => {
    check("2 transactions", t.length === 2, `got ${t.length}`);
    check("2-digit year resolved to 2025", t[0]?.date === "2025-01-02", t[0]?.date);
    check("second date correct too", t[1]?.date === "2025-01-04", t[1]?.date);
  },
);

// -----------------------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.error(`${failures} assertion(s) FAILED`);
  process.exit(1);
} else {
  console.log("All parser fixtures pass.");
}
