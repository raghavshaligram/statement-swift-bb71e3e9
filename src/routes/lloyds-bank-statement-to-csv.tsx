import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
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

      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Lloyds Bank statement to CSV & Excel
          </h1>
          <p className="mt-4 text-muted-foreground">
            Lloyds' own CSV export is real, but limited — 12 months, 150 transactions, desktop only, and no
            Excel option at all. Here's both that and what to do beyond it.
          </p>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Option 1: Lloyds' own export (fastest, within its limits)
          </h2>
          <ol className="mt-5 space-y-3 text-sm text-ink">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
              Log in to Lloyds Internet Banking on desktop (the CSV export isn't available in the app), and
              select the account you want.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
              Go to <span className="font-semibold">Statement options</span> and choose the CSV export.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
              Set your date range — but only the last 12 months are available, and only up to 150 transactions
              per download.
            </li>
          </ol>
          <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              No native Excel option exists — CSV is as close as Lloyds gets. If you need Excel specifically, or
              a statement older than 12 months, or more than 150 transactions in one file, that's Option 2.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Option 2: Convert a PDF statement (covers what Option 1 doesn't)
          </h2>
          <p className="mt-3 text-muted-foreground">
            Lloyds keeps PDF statements available for 7 years through online banking, and at least 10 years
            through the mobile app — far more history than the 12-month CSV window covers. Convert any of them
            directly on your device:
          </p>
          <ol className="mt-5 space-y-3 text-sm text-ink">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
              Download the PDF statement from Lloyds Internet Banking or the app — no account needed for up to
              6 pages.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
              LedgerLocal detects Lloyds' layout automatically and extracts every transaction, with a confidence
              score so you can see what's certain and what's worth double-checking.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
              Export to Excel, CSV, or — if you need a format Lloyds doesn't offer natively at all, like Tally
              XML or QuickBooks Desktop's IIF — those too.
            </li>
          </ol>
          <div className="mt-8 flex items-center justify-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
            Processed on your device — nothing uploaded, ever
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
