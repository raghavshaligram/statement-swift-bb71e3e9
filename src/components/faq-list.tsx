import type { ReactNode } from "react";

export type FaqItem = { q: string; a: string };

/**
 * FAQ block shared across comparison pages.
 *
 * Extracted after the second page needed the same markup -- the first version
 * was inline JSX in docuclipper-alternative.tsx, and duplicating it is exactly
 * how two pages end up with subtly different heading levels and spacing.
 *
 * Renders a <dl>, which is the correct element for question/answer pairs and
 * is what the FAQPage structured data on these pages describes. The JSON-LD
 * itself stays on each route, built from the same array passed here, so the
 * markup and the structured data can't disagree.
 */
export function FaqList({ items, children }: { items: FaqItem[]; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-4">
      {children}
      <dl className="space-y-5">
        {items.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-semibold text-ink">{q}</dt>
            <dd className="mt-1.5 text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Builds FAQPage structured data from the same array the FaqList renders. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
