import { Link } from "@tanstack/react-router";
// Infinity is a JS global, so the icon is aliased -- importing it bare
// silently shadows Number.Infinity inside this module.
import { Shield, Infinity as InfinityIcon, FileSpreadsheet, UserX, ArrowRight } from "lucide-react";

/**
 * Tool-page header, replacing the article framing on converter routes.
 *
 * The converter pages were built with ArticleBackLink + ArticleHero, which
 * carry a "back to blog" link and a published date. Both signal "blog post" to
 * a reader and to a crawler, when the page is actually a tool -- the thing
 * someone searching "qbo to csv converter free" wants to USE, not read. A
 * dateline also ages the page for no benefit: a format converter doesn't go
 * stale the way an article does, but a 2026 dateline makes it look like it has.
 *
 * The chip row states the four things this audience actually filters on, and
 * every one is true of every converter here: nothing uploaded, instant, real
 * spreadsheet output, no account required.
 */

/**
 * One colour per chip. Four identical emerald icons read as a single grey
 * block and the eye skips the row entirely -- the same problem reported on the
 * comparison cards. Distinct colours make it four separate claims.
 */
const CHIPS = [
  { icon: Shield, label: "100% private", sub: "Never uploaded", tint: "text-emerald bg-emerald/10" },
  { icon: InfinityIcon, label: "No page cap", sub: "Unlimited on Pro", tint: "text-amber-600 bg-amber-500/10" },
  { icon: FileSpreadsheet, label: "CSV & Excel", sub: "Real spreadsheet output", tint: "text-sky-600 bg-sky-500/10" },
  { icon: UserX, label: "No signup", sub: "No account, no card", tint: "text-violet-600 bg-violet-500/10" },
];

export function ToolHero({
  title,
  subtitle,
  formatLabel,
}: {
  title: string;
  subtitle: string;
  /** e.g. "Format converter" — small eyebrow above the title. */
  formatLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-8">
      {formatLabel && (
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
          {formatLabel}
        </div>
      )}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CHIPS.map(({ icon: Icon, label, sub, tint }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${tint}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="mt-2 text-sm font-semibold text-ink">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Cross-links to the other converters, rendered as a compact strip rather than
 * the article-style RelatedArticles cards. Converter pages benefit from a tight
 * internal cluster -- it's how CapyParse's seven converter pages reinforce each
 * other -- but the cards take too much room on a page whose job is the tool.
 */
export function ToolCrossLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Other converters
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            to={href}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-ink/80 transition hover:-translate-y-0.5 hover:border-emerald/50 hover:text-ink hover:shadow-sm"
          >
            {label}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-emerald" />
          </Link>
        ))}
      </div>
    </div>
  );
}
