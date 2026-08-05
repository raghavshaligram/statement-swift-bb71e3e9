/**
 * Keyword coverage harness.
 *
 * Every other gate in this repo checks that the code works. None of them can
 * see what the copy says -- and this business runs on search, so a dropped
 * phrase is a revenue bug that lint, five harnesses and the link checker all
 * pass straight through.
 *
 * That is not hypothetical. A hero rewrite silently removed "bank statement to
 * Excel software" (1,600/mo, the highest-volume term in the set), weakened
 * "convert PDF to CSV" to "PDF to CSV", and dropped the four-country coverage
 * line. Every check was green. It was caught by a person reading the page.
 *
 * WHAT THIS ASSERTS: each target phrase appears in the <title>, the H1, or an
 * H2 of the page that owns it. Body text does not count -- a term buried in a
 * paragraph is not being targeted, it is being mentioned.
 *
 * WHAT IT DOES NOT DO: judge whether the copy is good, or whether the term is
 * worth targeting. Those are decisions; this only stops a decision being
 * reversed by accident.
 *
 * Run:  npm run check:keywords
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES = join(import.meta.dirname, "../src/routes");

type Target = {
  /** Exact phrase, lowercase. Matched as a substring of the page's surfaces. */
  phrase: string;
  /** Route that owns it, without extension. */
  page: string;
  /** Monthly search volume and CPC, recorded so the list can be re-prioritised. */
  volume: number;
  cpc: number;
};

/**
 * Targets are assigned to ONE owning page each. Two pages competing for the
 * same phrase is worse than one page holding it, so this map is also the
 * record of which page is meant to win which term.
 */
const TARGETS: Target[] = [
  // --- Homepage: the head term and the two highest-value statement phrases ---
  { phrase: "free bank statement converter", page: "index", volume: 1300, cpc: 4.53 },
  { phrase: "bank statement to excel software", page: "index", volume: 1600, cpc: 0 },

  // --- Bank statement to Excel ---
  { phrase: "convert bank statement to excel", page: "bank-statement-to-excel", volume: 480, cpc: 10.22 },
  { phrase: "bank statement pdf to excel", page: "bank-statement-to-excel", volume: 590, cpc: 7.2 },
  { phrase: "convert bank statement pdf to excel", page: "bank-statement-to-excel", volume: 210, cpc: 9.34 },
  { phrase: "convert bank statements to excel", page: "bank-statement-to-excel", volume: 210, cpc: 9.43 },
  { phrase: "pdf bank statement to excel", page: "bank-statement-to-excel", volume: 480, cpc: 7.2 },

  // --- Bank statement to QBO: the highest-CPC cluster on the site ---
  { phrase: "bank statement to qbo converter", page: "bank-statement-to-qbo", volume: 390, cpc: 19.21 },
  { phrase: "convert pdf bank statement to qbo", page: "bank-statement-to-qbo", volume: 110, cpc: 41.02 },
  { phrase: "convert bank statement to qbo file", page: "bank-statement-to-qbo", volume: 90, cpc: 33.88 },
  { phrase: "import bank statements into quickbooks", page: "bank-statement-to-qbo", volume: 170, cpc: 21.38 },
  { phrase: "import bank statements into quickbooks online", page: "bank-statement-to-qbo", volume: 90, cpc: 29.47 },
  { phrase: "how to upload bank statements to quickbooks", page: "bank-statement-to-qbo", volume: 90, cpc: 14.38 },

  // --- Bank statement to CSV ---
  { phrase: "bank statement to csv", page: "bank-statement-to-csv", volume: 390, cpc: 7.13 },
  { phrase: "bank statement to csv file", page: "bank-statement-to-csv", volume: 170, cpc: 4.4 },

  // --- Format converters ---
  { phrase: "qbo to csv", page: "qbo-to-csv", volume: 1300, cpc: 9.36 },
  { phrase: "qbo to csv converter", page: "qbo-to-csv", volume: 590, cpc: 7.12 },
  { phrase: "qbo to excel converter", page: "qbo-to-excel", volume: 1000, cpc: 9.8 },
  { phrase: "qfx to qbo", page: "qfx-to-qbo", volume: 880, cpc: 9.43 },
  { phrase: "qfx to qbo converter", page: "qfx-to-qbo", volume: 720, cpc: 9.46 },
  { phrase: "ofx to qbo converter", page: "ofx-to-qbo", volume: 390, cpc: 7.53 },
  { phrase: "what is ofx", page: "ofx-to-csv", volume: 260, cpc: 6.98 },
  { phrase: "what is ofx format", page: "ofx-to-csv", volume: 170, cpc: 6.98 },
  { phrase: "what is ofx file format", page: "ofx-to-csv", volume: 140, cpc: 6.98 },
];

/**
 * Deliberately NOT targeted, recorded so the decision isn't silently revisited.
 *
 * The generic PDF cluster is high volume and low value: KD 26-38 at roughly
 * $1 CPC, against Adobe, Smallpdf and ilovepdf. The statement-focused
 * incumbent only reaches position 6-8 on those terms from a homepage that
 * ranks #1 for everything else it targets -- that is the ceiling for a small
 * site, and chasing it would dilute pages built for $7-41 CPC terms.
 *
 *   convert pdf to csv (2400), pdf to csv converter (1900),
 *   convert pdf file to csv (590), how to convert pdf to csv (480),
 *   online pdf to csv converter (390), turn pdf into csv (390),
 *   convert pdf to csv free (320), how to convert pdf to csv file (210)
 *
 * Reverse-direction terms are excluded because the product does not do them:
 *   qbo to pdf converter free (720), ofx to pdf (480)
 *
 * Typo variants are excluded because writing deliberately misspelled copy is
 * not worth it: pdf to cvs, pdf to scv, pdf to csv convertor (~470 combined).
 */
const DECLINED = 11;

function surfaces(page: string): string | null {
  let src: string;
  try {
    src = readFileSync(join(ROUTES, `${page}.tsx`), "utf8");
  } catch {
    return null;
  }
  const title = /\{ title: "([^"]+)" \}/.exec(src)?.[1] ?? "";
  const h1 = /title="([^"]+)"/.exec(src)?.[1] ?? "";
  const h2 = [...src.matchAll(/<ArticleH2>([^<]+)<\/ArticleH2>/g)].map((m) => m[1]).join(" ");
  // The hero paragraph on the homepage is the H1's partner and carries terms
  // the H1 cannot hold, so it counts as a surface there specifically.
  const heroP =
    page === "index"
      ? (/<p className="mx-auto mt-5[^>]*>([\s\S]*?)<\/p>/.exec(src)?.[1] ?? "")
      : "";
  return `${title} ${h1} ${h2} ${heroP}`
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

let failures = 0;
const cache = new Map<string, string | null>();

console.log("\n=== keyword coverage (title / H1 / H2) ===\n");
const sorted = [...TARGETS].sort((a, b) => b.volume * (b.cpc + 0.5) - a.volume * (a.cpc + 0.5));
for (const t of sorted) {
  if (!cache.has(t.page)) cache.set(t.page, surfaces(t.page));
  const blob = cache.get(t.page);
  if (blob === null) {
    failures++;
    console.log(`FAIL  ${t.phrase.padEnd(46)} -> /${t.page} does not exist`);
    continue;
  }
  const ok = blob.includes(t.phrase);
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${t.phrase.padEnd(46)} ${String(t.volume).padStart(5)}/mo  $${t.cpc.toFixed(2).padStart(6)}  /${t.page}`,
  );
}

const volume = TARGETS.reduce((n, t) => n + t.volume, 0);
console.log(`\n${TARGETS.length} targets covering ${volume.toLocaleString()} searches/mo`);
console.log(`${DECLINED} high-volume terms deliberately not targeted — see DECLINED in this file`);

console.log("");
if (failures > 0) {
  console.error(`${failures} keyword(s) missing from their owning page\n`);
  process.exit(1);
}
console.log("all keyword targets covered\n");
