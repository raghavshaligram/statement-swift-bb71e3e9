import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { ShieldCheck, Check, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolChips } from "@/components/tool-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqList, faqJsonLd } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { EmbeddedConverter } from "@/components/embedded-converter";
import {
  ArticleHero,
  QuickSummary,
  ArticleTOC,
  ArticleProse,
  ArticleH2,
  ArticleTable,
  LimitsList,
  RelatedArticles,
} from "@/components/article-sections";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does Bank of America let me export a CSV or Excel statement directly?",
    a: "Yes for recent activity — Bank of America's account activity page exports CSV directly, free. The real limits: roughly the last 18 months of history, no running balance column, and no native Excel (.xlsx) format (CSV opens fine in Excel regardless).",
  },
  {
    q: "How far back do Bank of America PDF statements go?",
    a: "Up to 7 years through online banking's Statements and Documents section — but those PDFs have no structured export option at all. That's the real gap this page covers.",
  },
  {
    q: "Will the CSV export show a running balance?",
    a: "No — Bank of America's CSV export is transaction data only, with no balance column. If you need the balance alongside each transaction, you need the PDF statement (which does show it) converted instead.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — BalanceExtract falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting.",
  },
  {
    q: "Can I combine Bank of America statements with other banks?",
    a: "Yes. Drop PDFs from Bank of America and any other bank into the same batch — BalanceExtract detects each one and processes them together into one export.",
  },
  {
    q: "Is my Bank of America statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/bank-of-america-statement-to-excel")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/bank-of-america-statement-to-excel` }],
    meta: [
      { title: "Free Bank of America Statement to Excel Converter — BalanceExtract" },
      {
        name: "description",
        content:
          "Bank of America's own CSV export covers roughly 18 months, with no running balance column. Convert any older Bank of America PDF statement to Excel or CSV on-device — free to try, nothing uploaded.",
      },
      {
        property: "og:title",
        content: "Free Bank of America Statement to Excel Converter — BalanceExtract",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const jsonLd = faqJsonLd(FAQ);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        trail={[
          { label: "Bank statement converters", href: "/blog" },
          { label: "Free Bank of America Statement to Excel Converter" },
        ]}
      />
      <ArticleHero
        eyebrow="Bank guide"
        title="Bank of America Statement to Excel: Formats and Limits"
        publishedDate="August 2026"
      />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ToolChips />

      <QuickSummary>
        Getting a full year of Bank of America transactions into a spreadsheet without retyping them
        means knowing where Bank of America's own export actually stops. The account activity page
        exports CSV directly — free, and the fastest option if the transactions you need are recent.
        The real limits: roughly 18 months of history, and no running balance column at all. PDF
        statements go back 7 years and do show the balance, but have no structured export — the gap
        this page covers.
      </QuickSummary>

      <ArticleProse>
        <p>
          Bank of America is one of the largest banks in the United States, so getting BofA
          transactions into a spreadsheet comes up constantly — tax season, loan applications,
          monthly bookkeeping. Bank of America's own export genuinely works for recent activity.
          This guide covers exactly what it contains, its real limits, and how to get data out of
          the older PDF statements it can't reach.
        </p>
      </ArticleProse>

      <ArticleTOC
        items={[
          { label: "Bank of America's export vs. converting a PDF", href: "#options" },
          { label: "What the export looks like", href: "#export-looks-like" },
          { label: "Native export limits", href: "#limits" },
          { label: "FAQ", href: "#faq" },
        ]}
      />

      <section id="options" className="scroll-mt-24 border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Option 1
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
                Bank of America's own export
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">Fastest, within its real limits.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">
                    1
                  </span>
                  Sign in at bankofamerica.com and open the account's activity view.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">
                    2
                  </span>
                  Set a date range and choose the download/export option.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">
                    3
                  </span>
                  Choose CSV (Comma Separated) — this opens directly in Excel.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Free, no third-party tool
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> Roughly 18 months of history only
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> No running balance column
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> No native Excel (.xlsx) format
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border-2 border-emerald bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
                Option 2
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
                Convert a PDF statement
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Covers what Bank of America's own export doesn't.
              </p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">
                    1
                  </span>
                  Download the PDF statement from Statements and Documents — no account needed for
                  up to 6 pages.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">
                    2
                  </span>
                  BalanceExtract detects Bank of America's layout automatically, with a confidence
                  score for anything worth double-checking.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">
                    3
                  </span>
                  Export to Excel, CSV, or a format Bank of America doesn't offer at all — Tally
                  XML, IIF, and more, with the running balance included.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Any statement age — 7 years
                  back
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Running balance included
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Real Excel output, not just
                  CSV
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" /> Processed on your
                device — nothing uploaded, ever
              </div>
            </div>
          </div>
        </div>
      </section>

      <ArticleH2 id="export-looks-like">What the Bank of America CSV Export Looks Like</ArticleH2>
      <ArticleTable
        headers={["Column", "What It Contains"]}
        rows={[
          ["Date", "The date the transaction posted"],
          ["Description", "Payee or merchant name"],
          ["Amount", "A single signed amount column"],
          ["Running balance", "Not included — PDF statements only"],
        ]}
      />

      <ArticleH2 id="limits">The Limits of Bank of America's Native Export</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "Limited lookback",
            body: "the activity download covers roughly the last 18 months. PDF statements, by contrast, are available for up to 7 years.",
          },
          {
            lead: "No running balance in the CSV",
            body: "the export is transaction data only — date, description, and amount. The balance column that appears on the PDF statement isn't included.",
          },
          {
            lead: "No native Excel format",
            body: "Bank of America offers CSV as the primary export — no direct .xlsx download, though CSV opens fine in Excel.",
          },
          {
            lead: "PDF statements have zero structured export",
            body: "the formal monthly statements Bank of America keeps for 7 years can only be downloaded as PDF — there's no CSV or Excel option for them at all, regardless of date range.",
          },
        ]}
      />

      <ArticleH2 id="faq">Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          {
            href: "/chase-bank-statement-to-excel",
            title: "Chase Bank Statement to Excel",
            blurb: "Another major US bank, same real gap.",
          },
          {
            href: "/wells-fargo-statement-to-excel",
            title: "Wells Fargo Statement to Excel",
            blurb: "18-month CSV window, PDF statements go back further.",
          },
          {
            href: "/blog",
            title: "All Guides & Converters",
            blurb: "Every bank guide and format converter BalanceExtract offers.",
          },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
