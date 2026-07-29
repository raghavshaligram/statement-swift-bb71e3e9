import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Check, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmbeddedConverter } from "@/components/embedded-converter";
import {
  ArticleBackLink,
  ArticleHero,
  QuickSummary,
  ArticleProse,
  ArticleH2,
  NumberedSteps,
  ArticleTable,
  LimitsList,
  RelatedArticles,
} from "@/components/article-sections";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does Chase let me export a CSV or Excel statement directly?",
    a: "Yes for recent activity — Chase's Activity page exports CSV, QFX (Quicken), and QBO (QuickBooks), but there's no native .xlsx button. CSV opens fine in Excel either way. The real limit is the date range: roughly the last 90 days on checking and savings accounts.",
  },
  {
    q: "How far back do Chase PDF statements go?",
    a: "Up to 7 years through online banking's Statements section — but those PDFs have no structured export option at all. That's the real gap this page covers.",
  },
  {
    q: "Will the CSV or Excel export show a running balance?",
    a: "Yes, on deposit accounts (checking and savings) — the native CSV includes a balance column.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — LedgerLocal falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting.",
  },
  {
    q: "Can I combine Chase statements with other banks?",
    a: "Yes. Drop PDFs from Chase and any other bank into the same batch — LedgerLocal detects each one and processes them together into one export.",
  },
  {
    q: "Is my Chase statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/chase-bank-statement-to-excel")({
  head: () => ({
    meta: [
      { title: "Free Chase Bank Statement to Excel Converter — LedgerLocal" },
      {
        name: "description",
        content:
          "Chase's own CSV/QFX/QBO export covers roughly the last 90 days. Convert any older Chase PDF statement to Excel or CSV on-device — free to try, nothing uploaded.",
      },
      { property: "og:title", content: "Free Chase Bank Statement to Excel Converter — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero
        eyebrow="Bank guide"
        title="Chase Bank Statement to Excel: Formats and Limits"
        publishedDate="July 2026"
      />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          Chase is the largest bank in the United States, so getting Chase transactions into a spreadsheet comes
          up constantly — tax season, loan applications, monthly bookkeeping. Chase's own export genuinely
          works for recent activity. This guide covers exactly what it contains, its real date-range limit, and
          how to get data out of the older PDF statements it can't reach.
        </p>
      </ArticleProse>

      <QuickSummary>
        Getting a full year of Chase transactions into a spreadsheet without retyping them means knowing
        where Chase's own export actually stops. Chase's Activity page exports CSV, QFX, and QBO directly —
        free, and the fastest option if the transactions you need are recent. The real limit: roughly the
        last 90 days on checking and savings accounts. PDF statements go back 7 years, but Chase provides no
        structured export for them at all — the gap this page covers.
      </QuickSummary>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Option 1</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Chase's own export</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fastest, within its real limits.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Sign in at chase.com and open the account's Activity view.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  Click the download icon near the top of the transaction list.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Choose a date range, then Spreadsheet (CSV), QFX, or QBO.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink"><Check className="h-4 w-4 shrink-0 text-emerald" /> Free, no third-party tool</div>
                <div className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4 shrink-0 text-rose-400" /> Roughly the last 90 days only</div>
                <div className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4 shrink-0 text-rose-400" /> No native Excel (.xlsx) format</div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border-2 border-emerald bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Option 2</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Convert a PDF statement</h2>
              <p className="mt-2 text-sm text-muted-foreground">Covers what Chase's own export doesn't.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Download the PDF statement from Chase's Statements section — no account needed for up to 6 pages.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  LedgerLocal detects Chase's layout automatically, with a confidence score for anything worth double-checking.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Export to Excel, CSV, or a format Chase doesn't offer at all — Tally XML, IIF, and more.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink"><Check className="h-4 w-4 shrink-0 text-emerald" /> Any statement age — 7 years back</div>
                <div className="flex items-center gap-2 text-ink"><Check className="h-4 w-4 shrink-0 text-emerald" /> Real Excel output, not just CSV</div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" /> Processed on your device — nothing uploaded, ever
              </div>
            </div>
          </div>
        </div>
      </section>

      <ArticleH2>What the Chase CSV Export Looks Like</ArticleH2>
      <ArticleTable
        headers={["Column", "What It Contains"]}
        rows={[
          ["Details", "Transaction type indicator (e.g. DEBIT, CREDIT, CHECK)"],
          ["Posting Date", "The date the transaction posted"],
          ["Description", "Payee or merchant name"],
          ["Amount", "A single signed amount column"],
          ["Balance", "Running balance — deposit accounts only"],
        ]}
      />

      <ArticleH2>The Limits of Chase's Native Export</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Limited lookback", body: "the Activity download covers roughly the last 90 days on checking and savings accounts. PDF statements, by contrast, are available for up to 7 years." },
          { lead: "No native Excel format", body: "Chase offers CSV, QFX, and QBO — no direct .xlsx download, though CSV opens fine in Excel." },
          { lead: "PDF statements have zero structured export", body: "the formal monthly statements Chase keeps for 7 years can only be downloaded as PDF — there's no CSV or Excel option for them at all, regardless of date range." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-border bg-card p-5">
              <div className="font-semibold text-ink">{q}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <RelatedArticles
        articles={[
          { href: "/icici-bank-statement-to-excel", title: "ICICI Bank Statement to Excel", blurb: "A major Indian bank, same real gap." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop specifically." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
