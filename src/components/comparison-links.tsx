import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Links into the comparison pages.
 *
 * Those four pages were a closed cluster: they linked to each other and
 * nothing else on the site linked to them. For the pages targeting the
 * highest-CPC, bottom-funnel terms in this niche, that is the worst possible
 * internal linking -- a crawler reaching them only via the sitemap, and a
 * visitor never reaching them at all.
 *
 * Placed on the pages whose readers are plausibly still choosing a tool: the
 * pricing page (where a competitor table already sits) and the PDF statement
 * guides. Deliberately NOT on every page -- a link block repeated site-wide
 * carries less weight per link and reads as filler.
 */

/**
 * Accent colour per card. Purely to stop four identical grey boxes reading as
 * a static table -- reported directly: "they don't look clickable".
 */
const COMPARISONS = [
  { href: "/docuclipper-alternative", label: "DocuClipper", note: "Cloud, per-page metered", accent: "bg-emerald" },
  { href: "/statementdesk-alternative", label: "StatementDesk", note: "Same price, row-metered", accent: "bg-amber-500" },
  { href: "/moneythumb-alternative", label: "MoneyThumb", note: "A product per format", accent: "bg-sky-500" },
  { href: "/propersoft-alternative", label: "ProperSoft", note: "An app per conversion", accent: "bg-violet-500" },
];

export function ComparisonLinks({
  heading = "How BalanceExtract compares",
  blurb = "Honest side-by-side write-ups, including where each of them is the better choice.",
}: {
  heading?: string;
  blurb?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h2 className="text-lg font-bold text-ink">{heading}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {COMPARISONS.map(({ href, label, note, accent }) => (
          <Link
            key={href}
            to={href}
            className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-emerald/50 hover:shadow-md"
          >
            {/* Coloured spine: the cheapest way to make four cards distinguishable at a glance. */}
            <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden />
            <div className="min-w-0 flex-1 pl-2">
              <div className="text-sm font-semibold text-ink">
                BalanceExtract <span className="text-muted-foreground">vs</span> {label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-emerald" />
          </Link>
        ))}
      </div>
    </div>
  );
}
