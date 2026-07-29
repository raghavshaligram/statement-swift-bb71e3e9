import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Check, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { BankBuildingArt } from "@/components/format-art";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does NatWest let me export a CSV statement directly?",
    a: "Yes. In NatWest Online Banking, go to Statements & transactions, then View transactions, set your date range, and export to CSV, Excel, or PDF directly — no third-party tool needed. NatWest also offers a Sage Line 50-compatible OFX export for accounting software. That's the fastest route if you can log in and the account is still open.",
  },
  {
    q: "So when do I actually need a converter?",
    a: "When you only have a PDF and can't (or don't want to) re-export from online banking — an old statement someone emailed you, a closed account, or a paper statement you scanned. LedgerLocal reads the PDF directly and gives you CSV, Excel, or other formats from that.",
  },
  {
    q: "Will the dates come out right, or will Excel flip day and month?",
    a: "NatWest statements use DD/MM/YYYY. LedgerLocal infers the date order from the statement itself and normalises output dates to ISO (YYYY-MM-DD) by default, which Excel reads unambiguously regardless of your system's regional settings — the usual cause of a date like 03/04 silently becoming April 3rd instead of March 4th.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — LedgerLocal falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting. Signing in is required for scans and photos specifically, since OCR runs longer and needs the lifetime-usage tracking.",
  },
  {
    q: "Can I combine NatWest statements with other banks?",
    a: "Yes. Drop PDFs from NatWest and any other bank into the same batch — LedgerLocal detects each one and processes them together into one export.",
  },
  {
    q: "Does this work for NatWest business accounts, not just personal?",
    a: "NatWest is named-detected specifically for the standard personal statement layout. Business account statements often use a different layout, so they'll likely fall back to the generic parser — it works with any text-based PDF, but double-check the extracted rows before exporting, same as with any statement the generic parser handles.",
  },
  {
    q: "Is my NatWest statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/natwest-bank-statement-to-csv")({
  head: () => ({
    meta: [
      { title: "NatWest Bank Statement to CSV — LedgerLocal" },
      {
        name: "description",
        content:
          "NatWest lets you export CSV directly from online banking. If you only have a PDF statement, convert it to CSV or Excel on-device with LedgerLocal — free to try, nothing uploaded.",
      },
      { property: "og:title", content: "NatWest Bank Statement to CSV — LedgerLocal" },
      {
        property: "og:description",
        content: "NatWest's own CSV export, plus a free converter for when you only have a PDF.",
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

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bank guide
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                NatWest bank statement to CSV
              </h1>
              <p className="mt-4 text-muted-foreground">
                The fastest route depends on what you actually have: access to your NatWest account, or just a
                PDF. Two honest options below.
              </p>
            </div>
            <BankBuildingArt titleText="A NatWest statement being issued from the bank" className="w-full rounded-2xl shadow-sm" />
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Option 1</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Export from NatWest</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fastest, if you can log in and the account is open.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Log in at <span className="font-mono">onlinebanking.natwest.com</span>, or the NatWest app.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  Select <span className="font-semibold">Statements &amp; transactions</span>, then{" "}
                  <span className="font-semibold">View transactions</span>.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Set your date range, choose <span className="font-semibold">CSV</span>, Excel, OFX, or PDF.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Free, no third-party tool
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Excel, CSV, and OFX — straight from NatWest
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-rose-400" /> Only works if the account's still open and you can log in
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border-2 border-emerald bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Option 2</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Convert a PDF statement</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                For a PDF you already have — emailed to you, a closed account, mail you scanned.
              </p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Drop your NatWest PDF into the converter — no account needed for up to 6 pages.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  LedgerLocal detects NatWest's layout automatically, with a confidence score for anything worth
                  double-checking.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Export to CSV, Excel, or a format NatWest doesn't offer at all — Tally XML, IIF, and more.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> Works on closed accounts, old emailed PDFs, scans
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="h-4 w-4 shrink-0 text-emerald" /> More export formats — Tally, IIF, and more
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" />
                Processed on your device — nothing uploaded, ever
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-background transition hover:bg-ink/90"
            >
              Convert a NatWest statement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">What you actually get in the output</h2>
          <p className="mt-3 text-muted-foreground">
            Every NatWest transaction converts into a real row with Date, Description, Amount, Dr/Cr, and Balance
            columns — split into separate Debit and Credit columns if you'd rather have that than a signed Amount
            column. Dates are read directly from the statement's own DD/MM/YYYY format and normalised to
            unambiguous ISO dates by default (a real, common failure point: opening a US-formatted CSV in a
            UK-regional Excel, or vice versa, silently swaps day and month for any date under the 13th).
          </p>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Which format should you actually use?</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">CSV or Excel — for spreadsheet work</div>
              <p className="mt-1 text-muted-foreground">
                Budgeting, reconciliation, or anything you'll sort, filter, or pivot yourself.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">OFX or QBO — for accounting software</div>
              <p className="mt-1 text-muted-foreground">
                If the end goal is an accounting import rather than manual review, OFX usually lands more cleanly
                than reshaping a CSV by hand — NatWest offers this natively too, so it's often the better first
                stop if you can still log in.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="font-semibold text-ink">Tally XML, IIF, or QIF</div>
              <p className="mt-1 text-muted-foreground">
                For Tally, QuickBooks Desktop, or Quicken specifically — none of which NatWest offers natively.
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
