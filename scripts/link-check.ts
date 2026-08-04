/**
 * Internal link + sitemap consistency check.
 *
 * Two failures this catches, both already hit in this repo:
 *
 *  1. A RelatedArticles block linking /bank-statement-to-qbo, a route that
 *     does not exist. Broken internal links waste crawl budget and dead-end
 *     readers, and nothing else in the build fails on them.
 *  2. The sitemap drifting from the routes directory. sitemap[.]xml.ts is
 *     maintained BY HAND -- its own header comment records that this exact
 *     drift caused a previous bug -- so a new page can ship unlisted and
 *     never get crawled.
 *
 * NOT covered here: undefined identifiers. A scripted bulk edit once inserted
 * `steps={steps}` into 13 pages while the matching `const steps = ...` failed
 * on 7 of them, blank-screening those routes in production. Two backstops were
 * attempted here and both were removed: enumerating declaration forms produced
 * 67 false positives (missing array destructuring and arrow params), and the
 * weaker "identifier appears nowhere else in the file" rule failed on the very
 * bug it was written for, because `steps,` survived as object shorthand.
 *
 * `npm run lint` catches this correctly. A check that misses the case it was
 * built for is worse than no check, because it invites trust it hasn't earned.
 *
 * Run:  npm run check:links
 * Exits non-zero on any broken link. Sitemap gaps are reported as warnings
 * rather than failures, since some routes (auth, account, preview) are
 * deliberately excluded.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES_DIR = join(import.meta.dirname, "../src/routes");
const SRC_DIRS = [ROUTES_DIR, join(import.meta.dirname, "../src/components")];

/** Routes that intentionally never appear in the sitemap. */
const SITEMAP_EXEMPT = new Set([
  "/__root", "/signin", "/signup", "/forgot-password", "/reset-password",
  "/preview", "/export", "/privacy", "/terms", "/sitemap[.]xml",
]);

function routePaths(): Set<string> {
  const paths = new Set<string>(["/"]);
  const walk = (dir: string, prefix = "") => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}/${entry.name}`);
      else if (entry.name.endsWith(".tsx")) {
        const name = entry.name.replace(/\.tsx$/, "");
        paths.add(name === "index" ? prefix || "/" : `${prefix}/${name}`);
      }
    }
  };
  walk(ROUTES_DIR);
  return paths;
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const routes = routePaths();
let failures = 0;

console.log("\n=== internal links ===\n");
for (const dir of SRC_DIRS) {
  for (const file of collectFiles(dir)) {
    const src = readFileSync(file, "utf8");
    // href: "/x" in data arrays, and href="/x" in JSX. External links skipped.
    const found = [
      ...src.matchAll(/href:\s*"(\/[^"]*)"/g),
      ...src.matchAll(/href="(\/[^"]*)"/g),
    ].map((m) => m[1]);
    for (const href of new Set(found)) {
      const path = href.split(/[#?]/)[0].replace(/\/$/, "") || "/";
      // Static assets served from /public (/favicon.ico, /og/x.png) are not
      // routes. Anything with a file extension is treated as an asset.
      if (/\.[a-z0-9]{2,5}$/i.test(path)) continue;
      if (routes.has(path)) continue;
      failures++;
      console.log(`FAIL  ${file.replace(/.*\/src\//, "src/")}  ->  ${href}`);
    }
  }
}
if (failures === 0) console.log("all internal links resolve to real routes");

console.log("\n=== sitemap coverage ===\n");
const sitemapSrc = readFileSync(join(ROUTES_DIR, "sitemap[.]xml.ts"), "utf8");
const listed = new Set([...sitemapSrc.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]));
const missing = [...routes].filter(
  (r) => !listed.has(r) && !SITEMAP_EXEMPT.has(r) && !r.startsWith("/account"),
);
if (missing.length === 0) console.log("every indexable route is in the sitemap");
else {
  console.log("WARN  indexable routes not in sitemap (add them, or add to SITEMAP_EXEMPT):");
  missing.sort().forEach((r) => console.log(`        ${r}`));
}

/**
 * llms.txt coverage.
 *
 * Both the sitemap and llms.txt are maintained by hand, and both had already
 * drifted: 14 live routes -- including all four comparison pages and every QBO
 * converter -- were in the sitemap but absent from llms.txt. That file is how
 * an LLM reading the site learns what exists, so a gap there is the same class
 * of problem as a gap in the sitemap, just less visible.
 *
 * A warning rather than a failure, matching how sitemap gaps are treated:
 * some pages may be deliberately omitted.
 */
console.log("\n=== llms.txt coverage ===\n");
{
  const llms = readFileSync(join(import.meta.dirname, "../public/llms.txt"), "utf8");
  const undocumented = [...listed].filter(
    (p) => p !== "/" && !llms.includes(`ledgerlocal.com${p}`),
  );
  if (undocumented.length === 0) console.log("every sitemap route appears in llms.txt");
  else {
    console.log("WARN  in sitemap but not llms.txt:");
    undocumented.sort().forEach((p) => console.log(`        ${p}`));
  }
}

console.log("");
if (failures > 0) {
  console.error(`${failures} broken internal link(s)\n`);
  process.exit(1);
}
console.log("link check passed\n");
