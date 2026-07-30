import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://ledgerlocal.com";

/**
 * Real, indexable content pages only. Deliberately excludes /preview and
 * /export -- both redirect to /upload when there's no parsed statement in
 * the store (see preview.tsx/export.tsx), so a search engine crawling them
 * cold would just hit a redirect or a blank shell. Indexing them would be
 * actively counterproductive, not just unhelpful.
 *
 * IMPORTANT: this list is maintained by hand, not generated from the routes
 * directory. When adding a new real content page (a new bank page, format
 * page, or guide), add it here too -- this exact list drifting out of sync
 * with the real routes is what caused the original bug this file fixes.
 */
const entries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.4" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/image-to-excel", changefreq: "monthly", priority: "0.6" },
  { path: "/upload", changefreq: "monthly", priority: "0.8" },
  { path: "/bank-statement-to-tally", changefreq: "monthly", priority: "0.6" },
  { path: "/bank-statement-to-ofx", changefreq: "monthly", priority: "0.6" },
  { path: "/bank-statement-to-qif", changefreq: "monthly", priority: "0.6" },
  { path: "/bank-statement-to-csv", changefreq: "monthly", priority: "0.7" },
  { path: "/chase-bank-statement-to-excel", changefreq: "monthly", priority: "0.6" },
  { path: "/icici-bank-statement-to-excel", changefreq: "monthly", priority: "0.6" },
  { path: "/natwest-bank-statement-to-csv", changefreq: "monthly", priority: "0.6" },
  { path: "/lloyds-bank-statement-to-csv", changefreq: "monthly", priority: "0.6" },
  { path: "/csv-to-iif", changefreq: "monthly", priority: "0.6" },
  { path: "/iif-to-csv", changefreq: "monthly", priority: "0.6" },
  { path: "/csv-to-qif", changefreq: "monthly", priority: "0.6" },
  { path: "/qif-to-csv", changefreq: "monthly", priority: "0.6" },
  { path: "/csv-to-ofx", changefreq: "monthly", priority: "0.6" },
  { path: "/ofx-to-csv", changefreq: "monthly", priority: "0.6" },
  { path: "/qfx-to-csv", changefreq: "monthly", priority: "0.6" },
  { path: "/mt940-to-csv", changefreq: "monthly", priority: "0.5" },
  { path: "/qbo-to-csv", changefreq: "monthly", priority: "0.7" },
  { path: "/csv-to-qbo", changefreq: "monthly", priority: "0.6" },
  { path: "/qfx-to-qbo", changefreq: "monthly", priority: "0.6" },
  { path: "/qif-to-qbo", changefreq: "monthly", priority: "0.6" },
  { path: "/ofx-to-qbo", changefreq: "monthly", priority: "0.6" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
