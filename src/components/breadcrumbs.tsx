import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SITE_ORIGIN } from "@/lib/site";
import { headingId } from "@/components/article-sections";

/**
 * Breadcrumbs, with BreadcrumbList structured data.
 *
 * Two jobs, only one of which is visual:
 *
 *  1. Google renders BreadcrumbList as the path shown in place of the raw URL
 *     in search results. "balanceextract.com › Guides › Bank statement to
 *     Excel" reads better than a bare URL and is a real CTR difference on a
 *     result page full of competitors.
 *  2. It gives every deep page an always-present link up to its section,
 *     which distributes internal link equity and gives a reader an exit that
 *     isn't the back button.
 *
 * An SEO audit of this app found breadcrumbs on 0 of 35 indexable pages.
 *
 * The trail is passed explicitly rather than derived from the URL. Route paths
 * here are flat -- /bank-statement-to-excel, /qbo-to-csv -- so there is no
 * hierarchy in the path to read, and inventing one from segments would produce
 * nonsense like "Bank › Statement › To › Excel".
 */

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const full: Crumb[] = [{ label: "Home", href: "/" }, ...trail];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: full.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      // The last crumb is the current page and carries no item URL, which is
      // what the spec expects.
      ...(c.href ? { item: `${SITE_ORIGIN}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {full.map((c, i) => (
            <li key={c.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />}
              {c.href ? (
                <Link to={c.href} className="transition-colors hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-ink" aria-current="page">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Table of contents built from heading TEXT rather than hand-written anchors.
 *
 * ArticleH2 derives its id with the same headingId() function, so a heading
 * and its TOC entry cannot disagree. The previous ArticleTOC took explicit
 * {label, href} pairs, which meant two places to keep in sync and no way to
 * notice when they drifted -- exactly the failure mode that has cost time
 * repeatedly in this codebase.
 *
 * Only worth rendering on pages long enough that a reader would otherwise
 * scroll blindly. The audit found six pages over 1,200 words without one.
 */
export function PageTOC({ headings }: { headings: string[] }) {
  if (headings.length < 3) return null;
  return (
    <div className="mx-auto max-w-3xl px-6 pt-6">
      <details open className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </summary>
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {headings.map((h) => (
            <li key={h}>
              <a href={`#${headingId(h)}`} className="text-sm text-ink/80 transition-colors hover:text-emerald">
                {h}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
