import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, AlertTriangle, Check, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does Lloyds let me export a CSV statement directly?",
    a: "Yes, but with real limits: Lloyds' own CSV export only covers the last 12 months of transactions, is capped at 150 transactions per download, and is only available on the desktop site (not the app). For a single recent month on a low-volume account, that's usually enough. For older statements, or if you need more than 150 transactions in one file, that's the real gap this page covers.",
  },
  {
    q: "Can I get an Excel file directly from Lloyds?",
    a: "No — Lloyds doesn't offer a native Excel export. Your options from Lloyds itself are PDF (always available) or the limited CSV above. To get an Excel file, you'd convert the PDF with a tool like this one.",
  },
  {
    q: "How far back can I get Lloyds statements?",
    a: "Up to 7 years through online banking, and at least 10 years through the mobile app. If you need a specific older statement the app doesn't show, Lloyds can also send one on request.",
  },
  {
    q: "Can I still get statements after closing my Lloyds account?",
    a: "Yes. Lloyds can provide copy statements (your transaction history) for up to 5 years after an account closes — you'll need to contact them directly to request it, rather than downloading it yourself online.",
  },
  {
    q: "I need this for proof of address — will a converted CSV or Excel file work?",
    a: "No — keep the original PDF for that. Most organisations accept a bank statement PDF downloaded directly from online banking as proof of address, but a converted file (CSV, Excel, or anything without the bank's own formatting) generally isn't accepted for this purpose. Use LedgerLocal when you need the transaction data itself — budgeting, accounting, reconciliation — not when the PDF itself is what's being requested.",
  },
  {
    q: "Will the dates come out right, or will Excel flip day and month?",
    a: "Lloyds statements use DD/MM/YYYY. LedgerLocal infers the date order from the statement itself rather than assuming a fixed format, and normalises output dates to ISO (YYYY-MM-DD) by default, which Excel reads unambiguously regardless of your system's regional settings — the usual cause of 03/04 silently becoming April 3rd instead of March 4th.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — LedgerLocal falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting. Signing in is required for scans and photos specifically (not for text-based PDFs), since OCR runs longer and needs the lifetime-usage tracking.",
  },
  {
    q: "Can I combine Lloyds statements with other banks?",
    a: "Yes. Drop PDFs from Lloyds and any other bank into the same batch — LedgerLocal detects each one and processes them together into one export.",
  },
  {
    q: "Is my Lloyds statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/lloyds-bank-statement-to-csv")({
  head: () => ({
    meta: [
      { title: "Lloyds Bank Statement to CSV & Excel — LedgerLocal" },
      {
        name: "description",
        content:
          "Lloyds' own CSV export is capped at 12 months and 150 transactions, with no native Excel option at all. Convert any Lloyds PDF statement to CSV or Excel on-device — free to try, nothing uploaded.",
      },
      { property: "og:title", content: "Lloyds Bank Statement to CSV & Excel — LedgerLocal" },
      {
        property: "og:description",
        content: "Lloyds' native export has real limits. Here's both that and a converter for what it doesn't cover.",
      },
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

      <section className="border-b border-border py-16 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bank guide
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Lloyds Bank statement to CSV &amp; Excel
          </h1>
          <p className="mt-4 text-muted-foreground">
            Lloyds' own CSV export is real, but limited — 12 months, 150 transactions, desktop only, and no
            Excel option at all. Two honest options below: theirs, and what to do beyond it.
          </p>
        </div>
      </section>

      {/* Two real options, side by side */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Option 1</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Lloyds' own export</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fastest, within its real limits.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Log in to Lloyds Internet Banking on desktop — the CSV export isn't in the app.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  Go to <span className="font-semibold">Statement options</span> and choose the CSV export.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Set your date range — capped at the last 12 months, up to 150 transactions.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Free, no third-party tool
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> Last 12 months only
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> Capped at 150 transactions
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> No Excel format
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border-2 border-emerald bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Option 2</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Convert a PDF statement</h2>
              <p className="mt-2 text-sm text-muted-foreground">Covers what Lloyds' own export doesn't.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Download the PDF from Lloyds Internet Banking or the app — no account needed for up to 6 pages.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  LedgerLocal detects Lloyds' layout automatically and extracts every transaction, with a
                  confidence score for anything worth double-checking.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Export to Excel, CSV, or a format Lloyds doesn't offer at all — Tally XML, IIF, and more.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Any statement age — 7+ years back
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> No transaction cap
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Real Excel output, not just CSV
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" />
                Processed on your device — nothing uploaded, ever
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Needing this for proof of address? Keep the original Lloyds PDF for that — a converted file isn't
              what gets accepted. See the FAQ below for why.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-background transition hover:bg-ink/90"
            >
              Convert a Lloyds statement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What you actually get */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">What you actually get in the output</h2>
          <p className="mt-3 text-muted-foreground">
            Every Lloyds transaction converts into a real row with Date, Description, Amount, Dr/Cr, and Balance
            columns — split into separate Debit and Credit columns if you'd rather have that than a signed Amount
            column. Dates are read directly from the statement's own DD/MM/YYYY format and normalised to
            unambiguous ISO dates by default (a real, common failure point: opening a US-formatted CSV in a
            UK-regional Excel, or vice versa, silently swaps day and month for any date under the 13th). If your
            Lloyds statement includes a reference number or cheque detail, that comes through as its own column
            too, rather than getting folded into the description text.
          </p>
        </div>
      </section>

      {/* Which format */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Which format should you actually use?</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">CSV or Excel — for spreadsheet work</div>
              <p className="mt-1 text-muted-foreground">
                Budgeting, reconciliation, or anything you'll sort, filter, or pivot yourself. Excel keeps your
                formatting; CSV is the more universal choice if you're feeding it into another tool afterward.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">OFX or QBO — for QuickBooks</div>
              <p className="mt-1 text-muted-foreground">
                If the end goal is an accounting-software import rather than manual review, OFX (or QBO for
                QuickBooks specifically) usually lands more cleanly than reshaping a CSV by hand.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">Tally XML — for Tally users</div>
              <p className="mt-1 text-muted-foreground">
                Common for accountants working with Indian clients or subsidiaries alongside UK accounts — Tally
                XML isn't something Lloyds (or most UK banks) offer natively at all.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">IIF or QIF — for QuickBooks Desktop or Quicken</div>
              <p className="mt-1 text-muted-foreground">
                Older but still common desktop accounting software that expects its own native import format
                rather than a generic CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink text-center">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-border bg-card p-5">
                <div className="font-semibold text-ink">{q}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
