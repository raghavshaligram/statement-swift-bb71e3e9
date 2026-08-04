import { Link } from "@tanstack/react-router";
import { Shield, Zap, FileSpreadsheet, UserX } from "lucide-react";

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

const CHIPS = [
  { icon: Shield, label: "100% private", sub: "Never uploaded" },
  { icon: Zap, label: "Instant", sub: "Runs in your browser" },
  { icon: FileSpreadsheet, label: "CSV & Excel", sub: "Real spreadsheet output" },
  { icon: UserX, label: "No signup", sub: "No account, no card" },
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
        {CHIPS.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-surface-muted/40 p-3">
            <Icon className="h-4 w-4 text-emerald" />
            <div className="mt-1.5 text-sm font-semibold text-ink">{label}</div>
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
            className="rounded-full border border-border px-3 py-1.5 text-sm text-ink/80 transition hover:border-emerald/40 hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
