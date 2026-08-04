import { Link } from "@tanstack/react-router";

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

const COMPARISONS = [
  { href: "/docuclipper-alternative", label: "vs DocuClipper", note: "Cloud, per-page metered" },
  { href: "/statementdesk-alternative", label: "vs StatementDesk", note: "Same price, row-metered" },
  { href: "/moneythumb-alternative", label: "vs MoneyThumb", note: "A product per format" },
  { href: "/propersoft-alternative", label: "vs ProperSoft", note: "An app per conversion" },
];

export function ComparisonLinks({
  heading = "How LedgerLocal compares",
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
        {COMPARISONS.map(({ href, label, note }) => (
          <Link
            key={href}
            to={href}
            className="rounded-xl border border-border p-4 transition hover:border-emerald/40"
          >
            <div className="text-sm font-semibold text-ink">{label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
