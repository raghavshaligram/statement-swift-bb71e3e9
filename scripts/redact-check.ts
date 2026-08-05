/**
 * Redaction harness.
 *
 * This feature makes two claims that are in tension, and both have to hold or
 * it is worse than useless:
 *
 *   1. The report contains nothing that identifies the account holder or
 *      reveals their finances.
 *   2. The report still reproduces the bug.
 *
 * Fail (1) and it is a privacy breach dressed as a support feature. Fail (2)
 * and it is a file nobody can act on. So both are asserted directly, including
 * against the real Federal Bank strings that drove this session's parser work.
 *
 * Run:  npm run check:redact
 */

import { redactPages } from "../src/lib/diagnostics/redact";
import type { PageText } from "../src/lib/pdf/extract-text";

let failures = 0;
function check(name: string, ok: boolean, got?: string) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${JSON.stringify(got)}`}`);
}

const item = (str: string, x: number, y: number) => ({ str, x, y, width: str.length * 5, height: 10 });

// Real shapes from the Federal Bank statement that exposed the wrapped-cell
// continuation bug, plus a German comma-decimal row.
const PAGES: PageText[] = [
  {
    pageNumber: 1,
    items: [
      item("04-APR-2025", 23.3, 616.8),
      item("UPI IN/546035039121", 129.5, 616.8),
      item("TFR", 273.3, 616.8),
      item("2500.00", 480.7, 616.8),
      item("10089.41", 520.5, 616.8),
      item("/dripchatagency@okicici/U/0000", 129.5, 625.2),
      item("RAGHAV SHALIGRAM", 129.5, 641.9),
      item("1.234,56", 480.7, 641.9),
      item("03.04.2025", 23.3, 641.9),
    ],
    rawText: "",
  },
];

const [page] = redactPages(PAGES);
const byY = (y: number) => page.items.filter((i) => i.y === y).map((i) => i.str);
const all = page.items.map((i) => i.str).join(" ");

console.log("\n=== privacy: sensitive content must be gone ===\n");
check("account holder name removed", !all.includes("RAGHAV") && !all.includes("SHALIGRAM"), all);
check("counterparty VPA removed", !all.includes("dripchatagency"), all);
check("bank rail text removed", !all.includes("UPI") && !all.includes("TFR"), all);
check("real amount 2500.00 not present", !all.includes("2500.00"), all);
check("real balance 10089.41 not present", !all.includes("10089.41"), all);
check(
  "no long digit run survives verbatim (UTR/reference numbers)",
  !all.includes("546035039121"),
  all,
);

console.log("\n=== parseability: the bug must still reproduce ===\n");
check(
  "geometry preserved exactly",
  page.items[0].x === 23.3 && page.items[0].y === 616.8,
  `${page.items[0].x},${page.items[0].y}`,
);
check(
  "continuation line still sits 8.4pt below its anchor",
  Math.abs(page.items[5].y - page.items[0].y - 8.4) < 0.01,
  String(page.items[5].y - page.items[0].y),
);
check("dates preserved verbatim", byY(616.8).includes("04-APR-2025"), JSON.stringify(byY(616.8)));
check("dot-separated dates preserved too", byY(641.9).includes("03.04.2025"), JSON.stringify(byY(641.9)));
check(
  "amount keeps its separator layout so number-format inference still works",
  byY(641.9).some((s) => /^\d\.\d{3},\d{2}$/.test(s)),
  JSON.stringify(byY(641.9)),
);
check(
  "amount keeps its decimal-point layout",
  byY(616.8).some((s) => /^\d{4}\.\d{2}$/.test(s)),
  JSON.stringify(byY(616.8)),
);
check(
  "text token keeps its length and case shape",
  page.items[6].str.length === "RAGHAV SHALIGRAM".length && /^X+ X+$/.test(page.items[6].str),
  page.items[6].str,
);
check(
  "separators inside redacted text preserved",
  page.items[5].str.includes("/") && page.items[5].str.includes("@"),
  page.items[5].str,
);

console.log("\n=== determinism ===\n");
const again = redactPages(PAGES);
check(
  "same input redacts identically",
  JSON.stringify(again) === JSON.stringify(redactPages(PAGES)),
);

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed\n`);
  process.exit(1);
}
console.log("all redaction checks passed\n");
