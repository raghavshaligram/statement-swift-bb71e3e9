/**
 * Shared template for the format-conversion landing pages (CSV<->IIF,
 * CSV<->QIF, CSV<->OFX, CSV<->QFX, MT940->CSV). Redesigned to match the
 * reference "landing" layout: hero + dropzone card, feature grid, numbered
 * steps as cards, optional "what is / comparison / why convert" content
 * sections, FAQ, and a bottom CTA card.
 *
 * The extra content sections are OPTIONAL so existing routes keep working
 * without changes -- pages can be enriched one at a time by passing
 * `whatIs`, `comparison`, `whyConvert`, or `bottomCta` props.
 */
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Landmark,
  UserX,
  RefreshCw,
  BookOpen,
  Upload,
  FileText,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export type FormatConverterFaqItem = { q: string; a: string };

export type FormatConverterComparison = {
  headers: [string, string, string];
  rows: Array<[string, string, string]>;
};

export function FormatConverterPage({
  title,
  intro,
  steps,
  ctaLabel,
  faq,
  freeNote,
  sourceExt,
  targetExt,
  whatIs,
  comparison,
  whyConvert,
  bottomCta,
}: {
  title: string;
  intro: string;
  steps: string[];
  ctaLabel: string;
  faq: FormatConverterFaqItem[];
  /** Most of these formats are free/unlimited (structured-text parsing, not OCR) -- stated explicitly per page since it's not the default assumption a visitor would make. */
  freeNote: string;
  /** Source file extension chip shown inside the dropzone card (e.g. "QFX"). Falls back to a derived value from the title. */
  sourceExt?: string;
  /** Target file extension chip (e.g. "CSV"). */
  targetExt?: string;
  /** Optional "What is X?" long-form section. */
  whatIs?: { heading: string; body: string };
  /** Optional side-by-side comparison table. */
  comparison?: { heading: string } & FormatConverterComparison;
  /** Optional bulleted "why convert" section. */
  whyConvert?: { heading: string; intro?: string; bullets: string[] };
  /** Optional footer CTA card. */
  bottomCta?: { heading: string; body: string; label: string };
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const derived = deriveExts(title);
  const src = sourceExt ?? derived.source;
  const tgt = targetExt ?? derived.target;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-surface-muted/40 to-background py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Free {src} to {tgt} Converter,{" "}
            <span className="text-emerald">{title.replace(/ Converter$/i, "")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{intro}</p>

          {/* Dropzone card */}
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText className="h-4 w-4 text-emerald" />
              Free {src} to {tgt} Converter
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Select or drop your {src} file below and we'll convert it to {tgt}. Runs in your browser —
              your data is never uploaded to any server.
            </p>

            <Link
              to="/upload"
              className="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-muted/40 px-6 py-10 text-center transition hover:border-emerald hover:bg-emerald-soft/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald text-primary-foreground">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ink">
                Drag and drop your {src} file here
              </span>
              <span className="text-xs text-muted-foreground">or click to browse your files</span>
              <span className="mt-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="rounded-md bg-surface-muted px-2 py-0.5">{src}</span>
                <span className="rounded-md bg-surface-muted px-2 py-0.5">{tgt}</span>
                <span className="rounded-md bg-surface-muted px-2 py-0.5">Max 10MB</span>
              </span>
            </Link>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald" />
              Runs entirely in your browser. Your files never leave your computer.
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title: t, body }) => (
              <div key={t} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-soft text-emerald">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">{t}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{body}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
              {freeNote}
            </span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink">
            How to Convert {src} to {tgt} in {steps.length} Steps
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <div className="font-mono text-2xl font-bold text-emerald">{i + 1}</div>
                <div className="mt-3 text-sm font-semibold text-ink">Step {i + 1}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-background transition hover:bg-ink/90"
            >
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is X? */}
      {whatIs && (
        <section className="border-b border-border py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink">{whatIs.heading}</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {whatIs.body}
            </p>
          </div>
        </section>
      )}

      {/* Comparison table */}
      {comparison && (
        <section className="border-b border-border py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink">{comparison.heading}</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted/60">
                  <tr>
                    {comparison.headers.map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-ink">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((c, j) => (
                        <td key={j} className={j === 0 ? "px-4 py-3 font-semibold text-ink" : "px-4 py-3 text-muted-foreground"}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Why convert */}
      {whyConvert && (
        <section className="border-b border-border py-14">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink">{whyConvert.heading}</h2>
            {whyConvert.intro && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{whyConvert.intro}</p>
            )}
            <ul className="mt-5 space-y-2">
              {whyConvert.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-sm text-ink">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-3">
            {faq.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-lg border border-border bg-card p-5 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-180">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA card */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border border-emerald/20 bg-emerald-soft/40 p-8 text-center">
            <h3 className="text-xl font-bold text-ink">
              {bottomCta?.heading ?? "Need to Convert PDF Bank Statements too?"}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              {bottomCta?.body ??
                "LedgerLocal extracts transactions from any PDF bank statement and exports to Excel, CSV, OFX, QIF, QBO, and more — 100% on-device."}
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-emerald/90"
            >
              {bottomCta?.label ?? "Try PDF Bank Statement Converter"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-3 text-[11px] text-muted-foreground">
              6 free pages included · no credit card required
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

const FEATURES = [
  { icon: ShieldCheck, title: "100% Private", body: "Files never leave your browser." },
  { icon: Zap, title: "Instant Conversion", body: "Results in under a second." },
  { icon: Landmark, title: "Works With Any Bank", body: "Format-based — no bank list to check." },
  { icon: UserX, title: "No Signup Required", body: "No account, no limits, no ads." },
  { icon: RefreshCw, title: "Widely Compatible", body: "Open in Excel, QuickBooks, Tally, and more." },
  { icon: BookOpen, title: "Clean Output", body: "Properly structured, ready to import." },
] as const;

/** Best-effort parse of source/target extensions from a title like "QFX to CSV Converter". */
function deriveExts(title: string): { source: string; target: string } {
  const match = title.match(/([A-Za-z0-9]+)\s+to\s+([A-Za-z0-9]+)/i);
  if (match) return { source: match[1].toUpperCase(), target: match[2].toUpperCase() };
  return { source: "File", target: "CSV" };
}
