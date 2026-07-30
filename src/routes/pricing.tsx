import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X, ShieldCheck, Zap, Landmark, Star, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LedgerLocal" },
      {
        name: "description",
        content:
          "One flat Pro price. Genuinely unlimited pages. Convert PDF bank statements to Excel, CSV, Tally, OFX, QIF, and QBO — entirely on your device.",
      },
      { property: "og:title", content: "Pricing — LedgerLocal" },
      { property: "og:description", content: "Flat monthly Pro plan. Unlimited pages. No credits, no caps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const FREE_ROWS: Array<[string, boolean]> = [
  ["6 pages per conversion, no signup needed", true],
  ["10-page lifetime allowance once signed up", true],
  ["Excel and CSV export", true],
  ["Named detection for 23+ major banks (US, UK, Canada, India) + generic parser for any other bank", true],
  ["100% on-device — nothing ever uploaded", true],
  ["Tally XML, OFX, QIF, QBO, IIF export", false],
];

const PRO_ROWS: string[] = [
  "Everything in Free",
  "Unlimited pages per statement",
  "All 7 export formats (Excel, CSV, Tally XML, OFX, QIF, QBO, IIF)",
];

const COMPARISON_COLS: Array<{ key: string; label: string; highlight?: boolean }> = [
  { key: "ll", label: "LedgerLocal", highlight: true },
  { key: "capy", label: "CapyParse" },
  { key: "docu", label: "DocuClipper" },
  { key: "bsc", label: "bankstatementconverter.com" },
  { key: "usc", label: "usstatementconverter.com" },
];

const COMPARISON_ROWS: Array<{ label: string; values: Record<string, string> }> = [
  {
    label: "Processing",
    values: {
      ll: "100% on-device",
      capy: "Cloud, AI-powered",
      docu: "Cloud-based",
      bsc: "Cloud-based, rule-based",
      usc: "Cloud-based",
    },
  },
  {
    label: "Free tier",
    values: {
      ll: "6 pages/conversion (no signup), 10 pages lifetime (signed up)",
      capy: "10 pages, lifetime pool",
      docu: "None — 14-day / 120-page trial only",
      bsc: "Not specified as permanent",
      usc: "Not specified",
    },
  },
  {
    label: "Cheapest paid tier",
    values: {
      ll: "One flat plan, unlimited pages",
      capy: "$24/mo — 150 pages/mo ($0.16/pg)",
      docu: "$20/mo — 60 pages/mo ($0.33/pg)",
      bsc: "$15/mo — 400 pages/mo ($0.0375/pg)",
      usc: "$35/mo — 1,000 pages/mo ($0.035/pg)",
    },
  },
  {
    label: "Highest paid tier shown",
    values: {
      ll: "Same flat plan",
      capy: "—",
      docu: "$159/mo — 2,000 pages/mo",
      bsc: "$50/mo — 4,000 pages/mo",
      usc: "$58/mo — 2,000 pages/mo",
    },
  },
  {
    label: "Export formats",
    values: {
      ll: "7: Excel, CSV, Tally XML, OFX, QIF, QBO, IIF",
      capy: "3: Excel, CSV, QBO",
      docu: "Excel, CSV, QBO, OFX, Xero",
      bsc: "Not confirmed",
      usc: "Excel, CSV, QuickBooks/Xero",
    },
  },
  {
    label: "Bank coverage",
    values: {
      ll: "Named detection, 23+ banks + generic parser for any bank",
      capy: '"Any bank" via AI',
      docu: '"Any bank" via AI',
      bsc: "Not confirmed",
      usc: "US banks only",
    },
  },
  {
    label: "Reads scans/photos of statements",
    values: {
      ll: "Yes — on-device OCR",
      capy: "No — PDF only for statements (photos supported for receipts only)",
      docu: "Scanned PDFs only, not raw photos",
      bsc: "Not confirmed",
      usc: "Not confirmed",
    },
  },
];

const FAQ: Array<[string, string]> = [
  [
    "How do the free pages work?",
    "6 pages per statement with no signup at all, and no persistent tracking on that anonymous tier — convert as many separate statements as you like. Signing up gives you 10 pages total, but as a lifetime pool shared across every PDF page and photo/scan you convert combined, not a per-statement allowance — once those 10 pages are used, you'll need Pro for anything more.",
  ],
  ["What counts as a \"page\"?", "Each page of the PDF you upload, counted before any processing starts."],
  [
    "What happens if my statement is longer than the limit?",
    "You'll see the page count and a clear message before anything processes — no partial or silently-truncated results. Sign up free for the 10-page limit, or upgrade to Pro for no limit at all.",
  ],
  [
    "Which banks and formats are supported?",
    "Named detection for 23+ banks across the US, UK, Canada, and India, plus a generic parser for any other bank's text-based PDF. Six export formats on Pro; Excel and CSV on Free.",
  ],
  [
    "Does it work with scanned PDFs?",
    "Yes, via on-device OCR, automatically when a scanned page is detected — slower and less precise than reading real text, so double-check results.",
  ],
];

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald-soft/40 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald">
            Pricing
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Stop retyping bank statements
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Convert PDF bank statements to Excel, CSV, Tally, OFX, QIF, and QBO — entirely on your device.
            Try instantly with no signup, or sign up free for more.
          </p>

          {/* Trust row */}
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald" /> <span className="font-semibold text-ink">0 bytes</span> uploaded, ever</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-emerald" /> <span className="font-semibold text-ink">Seconds</span> per statement</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4 text-emerald" /> <span className="font-semibold text-ink">23+ banks</span> named, works with any bank</span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 px-6 lg:grid-cols-2">
          {/* FREE */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free</div>
            <p className="mt-1 text-sm text-muted-foreground">Try it instantly</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold text-ink">$0</span>
              <span className="text-sm text-muted-foreground">forever · no credit card</span>
            </div>
            <Link
              to="/upload"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-ink bg-background px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-muted"
            >
              Start free
            </Link>
            <ul className="mt-8 space-y-3 text-sm">
              {FREE_ROWS.map(([label, ok]) => (
                <li key={label} className="flex items-start gap-3">
                  {ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={ok ? "text-ink" : "text-muted-foreground/70 line-through"}>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald bg-ink p-8 text-background shadow-xl shadow-emerald/10">
            <div className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-emerald px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              <Star className="h-3 w-3" /> Best value
            </div>
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald">LedgerLocal Pro</div>
            <p className="mt-1 text-sm text-background/70">For unlimited page counts and every export format</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold">$19</span>
              <span className="text-sm text-background/60">/ month · flat</span>
            </div>
            <Link
              to="/account/billing"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-emerald/90"
            >
              Get Pro
            </Link>
            <ul className="mt-8 space-y-3 text-sm">
              {PRO_ROWS.map((label) => (
                <li key={label} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  <span className="text-background/90">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Callout + comparison table */}
      <section className="border-b border-border bg-surface-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-2xl border-2 border-emerald/40 bg-emerald-soft/40 p-8">
            <h2 className="text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Every competitor here caps your pages and charges more as you grow. We don't.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-accent-foreground">
              LedgerLocal's Pro tier is <strong className="font-bold text-ink">one flat price</strong>,{" "}
              <strong className="font-bold text-ink">genuinely unlimited pages</strong> — not a bigger number,
              not a higher tier to unlock. It's the one structural thing none of them do.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-muted-foreground">
              Cheapest competitor plan: <span className="font-mono font-semibold text-ink">$15/mo for 400 pages</span>.
              Ours: <span className="font-mono font-semibold text-emerald">unlimited</span>, same price whether
              you convert 10 pages or 10,000.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
                  {COMPARISON_COLS.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                        c.highlight ? "text-emerald" : "text-muted-foreground"
                      }`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 font-semibold text-ink">{row.label}</td>
                    {COMPARISON_COLS.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-4 align-top text-xs leading-relaxed ${
                          c.highlight ? "bg-emerald-soft/40 font-semibold text-ink" : "text-muted-foreground"
                        }`}
                      >
                        {row.values[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink">Why choose LedgerLocal</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [
                "Works with any bank",
                "No templates needed. Upload a PDF from Chase, Barclays, RBC, ICICI, or any other bank — the parser reads the statement's own layout.",
              ],
              [
                "Nothing ever leaves your device",
                "Every statement is parsed locally in your browser. Competitors upload your PDF to their servers to process it; we don't, structurally can't, by design.",
              ],
              [
                "Verify before you export",
                "Every extracted transaction gets a real confidence score. Review flagged rows side-by-side against your original statement before downloading anything.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink">Frequently asked questions</h2>
          <dl className="mt-10 space-y-4">
            {FAQ.map(([q, a]) => (
              <div key={q} className="rounded-lg border border-border bg-card p-5">
                <dt className="font-semibold text-ink">{q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl bg-ink p-10 text-center text-background shadow-xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to stop retyping transactions?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-background/70">
              6 pages free, no signup. 10 pages free with an account. No credit card, ever, on Free.
            </p>
            <Link
              to="/upload"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-emerald px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-emerald/90"
            >
              Try it now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
