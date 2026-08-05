import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, X, ShieldCheck } from "lucide-react";
import { EmbeddedConverter } from "@/components/embedded-converter";

/** Back-to-blog link, shown at the top of every long-form article page. */
export function ArticleBackLink() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-emerald">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to all guides
      </Link>
    </div>
  );
}

/** Featured-image hero: a card-style image (not full-bleed), eyebrow, H1, byline -- matches a real editorial article layout rather than a landing-page hero. Illustration is optional -- format-converter pages skip it in favor of the real converter tool above the fold instead. */
export function ArticleHero({
  eyebrow,
  title,
  publishedDate,
  illustration,
}: {
  eyebrow: string;
  title: string;
  publishedDate: string;
  illustration?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-10 pt-6">
      {illustration && <div className="overflow-hidden rounded-2xl border border-border shadow-sm">{illustration}</div>}
      <span className={`${illustration ? "mt-8" : ""} inline-flex items-center gap-2 rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald`}>
        {eyebrow}
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Published {publishedDate} by BalanceExtract Team</p>
    </div>
  );
}

/** Tinted TL;DR callout box, shown right after the intro paragraph. */
export function QuickSummary({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="rounded-xl border border-emerald/20 bg-emerald-soft/40 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Quick summary</div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{children}</p>
      </div>
    </div>
  );
}

/** Jump-link table of contents, for longer pages with several real H2
 * sections -- earns its place once a page has enough structure to actually
 * navigate, not on every short page. Links to the same #id values passed to
 * ArticleH2 below. */
export function ArticleTOC({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <details className="group rounded-xl border border-border bg-card p-4 sm:hidden">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </summary>
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-sm font-medium text-emerald hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
      <div className="hidden rounded-xl border border-border bg-card p-4 sm:block">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-sm font-medium text-emerald hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Plain prose body copy -- article paragraphs, not boxed cards. */
export function ArticleProse({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="space-y-4 text-[15px] leading-relaxed text-ink/90">{children}</div>
    </div>
  );
}

/**
 * Slugifies heading text for anchor ids.
 *
 * Shared with PageTOC so a heading and its table-of-contents link can never
 * disagree -- previously each heading needed an explicit id and the TOC needed
 * a matching href, which is two places to get wrong and no way to notice.
 */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/&apos;|&#39;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ArticleH2({ children, id }: { children: ReactNode; id?: string }) {
  // Auto-derive the anchor from the heading text when one isn't given, so
  // every H2 is linkable without the author remembering to add an id.
  const auto = typeof children === "string" ? headingId(children) : undefined;
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10">
      {/* Accent rule above each H2. Long guide pages ran as one undifferentiated
          column of text; a coloured marker gives the eye somewhere to land when
          scanning, which is how these pages are actually read. */}
      <div className="mb-3 h-1 w-10 rounded-full bg-emerald" aria-hidden />
      <h2 id={id ?? auto} className="scroll-mt-24 text-2xl font-bold tracking-tight text-ink">
        {children}
      </h2>
    </div>
  );
}

/** Numbered "Step 1 / Step 2" sections as plain prose (bold step title + description), matching a real how-to article rather than card-based UI steps. */
export function NumberedSteps({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="space-y-5">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="font-semibold text-ink">
              Step {i + 1}: {step.title}
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-ink/80">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A real data table -- column name + what it contains, or any two/three-column comparison. */
export function ArticleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-ink">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-surface-muted/40" : ""}>
                {row.map((cell, j) => (
                  <td key={j} className="border-t border-border px-4 py-3 text-ink/85 first:font-medium first:text-ink">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A bulleted list of real, specific limits, each with a bold lead-in phrase and an X marker -- matches a real "here's exactly where the native option falls short" section. */
export function LimitsList({ limits }: { limits: Array<{ lead: string; body: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <ul className="space-y-3">
        {limits.map((limit, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
            <X className="mt-1 h-4 w-4 shrink-0 text-rose-400" />
            <span className="text-ink/85">
              <span className="font-semibold text-ink">{limit.lead}: </span>
              {limit.body}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mid-article or bottom CTA card. */
export function ArticleCta({ heading, body, buttonLabel }: { heading: string; body: string; buttonLabel: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-2xl border border-emerald/30 bg-emerald-soft/50 p-8 text-center">
        <div className="text-lg font-bold text-ink">{heading}</div>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/75">{body}</p>
        <div className="mx-auto mt-5 max-w-md text-left">
          <EmbeddedConverter />
        </div>
      </div>
    </div>
  );
}

/** Related-articles footer section, linking to other real guides -- a genuine content network, not a dead end. */
export function RelatedArticles({ articles }: { articles: Array<{ href: string; title: string; blurb: string }> }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related articles</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {articles.map((a) => (
          <Link key={a.href} to={a.href} className="rounded-lg border border-border bg-card p-4 transition hover:border-emerald/50">
            <div className="text-sm font-semibold text-ink">{a.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{a.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Embeds the real, functional converter tool within the article flow -- not a CTA pointing elsewhere, the actual working dropzone right where the article calls for it. */
export function ConverterEmbed({
  heading,
  body,
  children,
}: {
  heading: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div id="converter" className="scroll-mt-24 rounded-2xl border border-emerald/30 bg-emerald-soft/30 p-6 sm:p-8">
        <div className="text-lg font-bold text-ink">{heading}</div>
        <p className="mt-1.5 max-w-md text-sm text-ink/75">{body}</p>
        {children}
      </div>
    </div>
  );
}
