/**
 * Keyword cluster coverage.
 *
 * Every other gate here checks that the code works. None can see what the copy
 * says, and this business runs on search -- so a dropped phrase is a revenue
 * bug that lint, five harnesses and the link checker all pass straight
 * through. Not hypothetical: a hero rewrite silently removed "bank statement
 * to Excel software" (1,600/mo, the highest-volume term in the set) with every
 * check green. A person reading the page caught it.
 *
 * MODEL: clusters, not keywords.
 *
 * The first version of this file mapped one keyword to one page and demanded
 * every phrase appear in a heading. Wrong model, and it showed in the output --
 * it produced headings like "Convert bank statement to QBO file: common
 * problems", written to satisfy a checker rather than a reader. Search engines
 * cluster synonyms to a single intent and rank one page for the group. A page
 * does not need a heading per variant, and a variant does not need its own
 * page.
 *
 * So each cluster has:
 *   - ONE owning page. This file is therefore also the record of which page is
 *     meant to win which group; two pages competing for one cluster is worse
 *     than one page holding it.
 *   - A HEAD term that must appear in the title or H1 -- the page's formal
 *     claim on the cluster.
 *   - VARIANTS that must appear anywhere in visible copy. Plurals, word-order
 *     changes and question forms belong in prose, where they read naturally.
 *
 * WHAT THIS DOES NOT DO: judge whether the copy is good, or whether a term is
 * worth targeting. Those are decisions. This only stops a decision being
 * reversed by accident.
 *
 * Run:  npm run check:keywords
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES = join(import.meta.dirname, "../src/routes");

type Cluster = {
  name: string;
  page: string;
  head: string;
  variants: string[];
  volume: number;
};

const CLUSTERS: Cluster[] = [
  {
    name: "Bank statement converter (head term)",
    page: "index",
    head: "free bank statement converter",
    variants: ["bank statement to excel software", "convert bank statement to excel", "convert pdf to csv"],
    volume: 2900,
  },
  {
    name: "Bank statement to Excel",
    page: "bank-statement-to-excel",
    head: "convert bank statement pdf to excel",
    variants: [
      "convert bank statement to excel",
      "bank statement pdf to excel",
      "convert bank statements to excel",
      "pdf bank statement to excel",
      "bank statement to excel software",
      "ocr bank statements to excel",
    ],
    volume: 2020,
  },
  {
    name: "Bank statement to QBO / QuickBooks import",
    page: "bank-statement-to-qbo",
    head: "convert bank statement to qbo",
    variants: [
      "bank statement to qbo converter",
      "convert pdf bank statement to qbo",
      "convert bank statement to qbo file",
      "import bank statements into quickbooks",
      "import bank statements into quickbooks online",
      "how to upload bank statements to quickbooks",
    ],
    volume: 940,
  },
  {
    name: "Bank statement to CSV",
    page: "bank-statement-to-csv",
    head: "bank statement to csv",
    variants: ["bank statement to csv file"],
    volume: 560,
  },
  {
    name: "QBO to CSV",
    page: "qbo-to-csv",
    head: "qbo to csv",
    variants: ["qbo to csv converter", "export qbo to csv"],
    volume: 3280,
  },
  {
    name: "QBO to Excel",
    page: "qbo-to-excel",
    head: "qbo to excel converter",
    variants: ["qbo file"],
    volume: 1170,
  },
  {
    name: "QFX to QBO",
    page: "qfx-to-qbo",
    head: "qfx to qbo",
    variants: ["qfx to qbo converter"],
    volume: 1990,
  },
  {
    name: "OFX to QBO",
    page: "ofx-to-qbo",
    head: "ofx to qbo",
    variants: ["ofx to qbo converter"],
    volume: 390,
  },
  {
    name: "OFX explained (definitional intent)",
    page: "ofx-to-csv",
    head: "ofx to csv",
    variants: ["what is ofx", "what is ofx format", "what is ofx file format"],
    volume: 570,
  },
  {
    name: "QFX to Excel",
    page: "qfx-to-excel",
    head: "qfx to excel",
    variants: ["qfx file"],
    volume: 830,
  },
];

/**
 * Deliberately NOT targeted, recorded so the decision isn't silently revisited.
 *
 * Generic PDF cluster -- convert pdf to csv (2400), pdf to csv converter
 * (1900), convert pdf file to csv (590), how to convert pdf to csv (480),
 * online pdf to csv converter (390), turn pdf into csv (390), convert pdf to
 * csv free (320), how to convert pdf to csv file (210). High volume, but
 * KD 26-38 at roughly $1 CPC against Adobe, Smallpdf and ilovepdf. The
 * statement-focused incumbent only reaches position 6-8 on these from a
 * homepage that ranks #1 for everything else it targets -- that is the ceiling
 * for a small site, and chasing it dilutes pages built for $7-41 CPC terms.
 *
 * Reverse-direction terms the product does not do: qbo to pdf converter free
 * (720), ofx to pdf (480).
 *
 * Typo variants: pdf to cvs, pdf to scv, pdf to csv convertor (~470 combined).
 * Real searches, but not worth deliberately misspelling copy for.
 */

function normalise(s: string): string {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Title and H1 only -- the page's formal claim on a cluster.
 *
 * Three shapes exist in this codebase and all three must be read, or the check
 * reports a copy failure that is actually a parsing failure:
 *   { title: "..." }        -- hand-written routes
 *   metaTitle: "..."        -- routes driven by the FormatGuide config object
 *   title: "..."            -- the H1 passed to ToolHero / ArticleHero, and
 *                              the config's own title field
 */
function headSurfaces(src: string): string {
  const parts = [
    /\{ title: "([^"]+)" \}/.exec(src)?.[1],
    /metaTitle:\s*"([^"]+)"/.exec(src)?.[1],
    ...[...src.matchAll(/\btitle[:=]\s*"([^"]+)"/g)].map((m) => m[1]),
  ].filter(Boolean);
  return normalise(parts.join(" "));
}

/**
 * Everything a reader sees: headings, prose, FAQ answers, step bodies, table
 * cells, troubleshooting entries.
 *
 * Naively stripping tags with /<[^>]+>/ does NOT work here and produced a
 * false failure: components that take their copy as PROPS -- NumberedSteps,
 * TroubleshootGrid, NextSteps, MethodTable, FaqList -- contain no ">" inside
 * the tag, so the whole block matched as a single tag and was deleted. On one
 * page that removed 8,200 of 13,400 characters, i.e. most of the copy.
 *
 * Since page text lives either in a string literal (props, arrays, FAQ
 * objects) or as JSX text between tags, both are collected instead. Import
 * paths, class names and route paths are excluded -- they are not copy and
 * would produce false passes, e.g. the path "/bank-statement-to-csv" matching
 * a keyword.
 */
function allVisible(src: string): string {
  const withoutComments = src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

  const literals = [...withoutComments.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => m[1])
    .filter(
      (v) =>
        !v.startsWith("@/") &&
        !v.startsWith("/") &&
        !v.startsWith("http") &&
        !/^[a-z0-9:_\- ]*$/i.test(v) === false || v.includes(" "),
    )
    // class strings are long but contain no sentence punctuation or capitals
    .filter((v) => !/^[a-z0-9\-:/\[\]()._ ]+$/.test(v) || /[A-Z]/.test(v));

  const jsxText = withoutComments
    .replace(/<[^>]*>/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("{") && !l.includes("=") && /[a-zA-Z]/.test(l));

  return normalise([...literals, ...jsxText].join(" "));
}

let failures = 0;
console.log("\n=== keyword cluster coverage ===\n");

for (const c of [...CLUSTERS].sort((a, b) => b.volume - a.volume)) {
  let src: string;
  try {
    src = readFileSync(join(ROUTES, `${c.page}.tsx`), "utf8");
  } catch {
    failures++;
    console.log(`FAIL  ${c.name} -> /${c.page} does not exist\n`);
    continue;
  }

  const headOk = headSurfaces(src).includes(c.head);
  const body = allVisible(src);
  const missing = c.variants.filter((v) => !body.includes(v));
  const ok = headOk && missing.length === 0;
  if (!ok) failures++;

  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}  (~${c.volume.toLocaleString()}/mo)  /${c.page}`);
  console.log(`        head "${c.head}" in title/H1: ${headOk ? "yes" : "NO"}`);
  console.log(
    `        variants ${c.variants.length - missing.length}/${c.variants.length}` +
      (missing.length ? `  MISSING: ${missing.join(" | ")}` : ""),
  );
  console.log("");
}

const phrases = CLUSTERS.reduce((n, c) => n + c.variants.length + 1, 0);
const total = CLUSTERS.reduce((n, c) => n + c.volume, 0);
console.log(`${CLUSTERS.length} clusters, ${phrases} phrases, ~${total.toLocaleString()} searches/mo`);

if (failures > 0) {
  console.error(`\n${failures} cluster(s) incomplete\n`);
  process.exit(1);
}
console.log("all clusters covered\n");
