/**
 * OFX / QFX / QBO parser verification.
 *
 * These three extensions are the same format, and until now the format
 * parsers had no harness at all -- only the PDF path did. The multi-account
 * work is exactly the kind of change that silently breaks single-account
 * files, which are the overwhelming majority, so it needed a net.
 *
 * Run:  npm run check:ofx
 */

import { parseOfxText, ofxResultToTransactions } from "../src/lib/ofx/parse-ofx";

let failures = 0;
function check(name: string, ok: boolean, got?: string) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || got === undefined ? "" : `  -> got ${got}`}`);
}

// SGML flavour (OFX 1.x): no closing tags on leaf elements. This is what most
// banks actually emit and what our own to-ofx.ts produces.
const SINGLE = `
OFXHEADER:100
DATA:OFXSGML
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS>
<CURDEF>USD
<BANKACCTFROM><ACCTID>1234567890<ACCTTYPE>CHECKING</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20250601120000[0:GMT]<TRNAMT>-45.20<FITID>A1<NAME>STARBUCKS STORE</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20250603<TRNAMT>2000.00<FITID>A2<NAME>PAYROLL<MEMO>ACME CORP</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

// Two statements in one download: a current account and a credit card.
const MULTI = `
<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<CURDEF>USD
<BANKACCTFROM><ACCTID>1111<ACCTTYPE>CHECKING</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN><DTPOSTED>20250601<TRNAMT>-10.00<FITID>B1<NAME>CHEQUING TXN</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1>
<CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS>
<CCACCTFROM><ACCTID>2222</CCACCTFROM>
<BANKTRANLIST>
<STMTTRN><DTPOSTED>20250602<TRNAMT>-30.00<FITID>C1<NAME>CARD TXN</STMTTRN>
<STMTTRN><DTPOSTED>20250604<TRNAMT>-40.00<FITID>C2<NAME>CARD TXN 2</STMTTRN>
</BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1>
</OFX>`;

// No <STMTRS> wrapper at all -- some SGML files in the wild never close or
// even open it. Must keep working exactly as before.
const NO_SECTION = `
<OFX><BANKTRANLIST>
<STMTTRN><DTPOSTED>20250601<TRNAMT>-5.00<FITID>D1<NAME>BARE FILE</STMTTRN>
</BANKTRANLIST></OFX>`;

console.log("\n=== single account ===\n");
{
  const r = parseOfxText(SINGLE);
  check("2 transactions", r.transactions.length === 2, String(r.transactions.length));
  check(
    "timezone suffix stripped from date",
    r.transactions[0]?.date === "2025-06-01",
    r.transactions[0]?.date,
  );
  check("time portion stripped too", r.transactions[1]?.date === "2025-06-03", r.transactions[1]?.date);
  check("negative amount preserved", r.transactions[0]?.amount === -45.2, String(r.transactions[0]?.amount));
  check("FITID captured", r.transactions[0]?.tranId === "A1", String(r.transactions[0]?.tranId));
  check(
    "NAME and MEMO combined when both present",
    r.transactions[1]?.description.includes("PAYROLL") &&
      r.transactions[1]?.description.includes("ACME CORP"),
    r.transactions[1]?.description,
  );
  check("account captured with type", r.transactions[0]?.account === "1234567890 (CHECKING)", String(r.transactions[0]?.account));
  check("one account listed", r.accounts.length === 1, JSON.stringify(r.accounts));
  check("no multi-account warning on a single-account file", r.warnings.length === 0, JSON.stringify(r.warnings));
  check("currency detected", r.currency === "USD", String(r.currency));
}

console.log("\n=== multi-account bundle ===\n");
{
  const r = parseOfxText(MULTI);
  check("3 transactions across both statements", r.transactions.length === 3, String(r.transactions.length));
  check("two accounts detected", r.accounts.length === 2, JSON.stringify(r.accounts));
  check(
    "bank transaction tagged to the chequing account",
    r.transactions.find((t) => t.tranId === "B1")?.account === "1111 (CHECKING)",
    String(r.transactions.find((t) => t.tranId === "B1")?.account),
  );
  check(
    "credit-card transactions tagged to the card account",
    r.transactions.filter((t) => t.account === "2222").length === 2,
    JSON.stringify(r.transactions.map((t) => t.account)),
  );
  check(
    "transactions are NOT merged into one undifferentiated account",
    new Set(r.transactions.map((t) => t.account)).size === 2,
  );
  check("multi-account warning raised", r.warnings.some((w) => /2 accounts/.test(w)), JSON.stringify(r.warnings));
}

console.log("\n=== file with no statement wrapper ===\n");
{
  const r = parseOfxText(NO_SECTION);
  check("still parses", r.transactions.length === 1, String(r.transactions.length));
  check("account is null rather than throwing", r.transactions[0]?.account === null, String(r.transactions[0]?.account));
}

// The public entry point wraps the raw mapper with the shared enrichment pass.
// Asserting here catches the case where enrichment silently stops running on
// this path while parseOfxText itself stays correct -- the unit checks above
// would all still pass while the app exported blank Payee/Category columns.
console.log("\n=== enrichment + export shape on the OFX path ===\n");
{
  const txns = ofxResultToTransactions(parseOfxText(SINGLE), "single.ofx");
  check("payee derived", txns[0]?.payee === "STARBUCKS STORE", txns[0]?.payee);
  check("category derived", txns[0]?.category === "Dining", String(txns[0]?.category));
  check("raw description untouched", txns[0]?.description === "STARBUCKS STORE", txns[0]?.description);
  check(
    "drCr follows the amount sign",
    txns[0]?.drCr === "Dr" && txns[1]?.drCr === "Cr",
    `${txns[0]?.drCr}/${txns[1]?.drCr}`,
  );
  check(
    "account survives into Transaction",
    txns[0]?.account === "1234567890 (CHECKING)",
    String(txns[0]?.account),
  );
}

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed\n`);
  process.exit(1);
}
console.log("all OFX checks passed\n");
