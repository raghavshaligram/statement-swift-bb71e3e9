import type { FaqItem } from "./faq-list";

/**
 * Structured data for converter pages.
 *
 * These pages previously emitted FAQPage only. Two things were missing that
 * matter for how this page type gets surfaced:
 *
 *  - SoftwareApplication with a price. These pages compete against results
 *    that say "free" in the SERP, and "free" is the single strongest modifier
 *    in this keyword cluster ("qbo to csv converter free" ranks separately
 *    from "qbo to csv converter"). Declaring price 0 for the free tool makes
 *    that claim machine-readable rather than something buried in body copy.
 *  - HowTo. The three-step conversion flow is exactly the shape HowTo
 *    describes, and it mirrors the on-page steps rather than inventing them.
 *
 * Emitted as a single @graph so one script tag carries all three, which is
 * both cleaner and avoids the duplicate-context noise of three separate tags.
 *
 * The HowTo steps and the visible NumberedSteps come from the SAME array at
 * the call site, so the markup and the structured data cannot drift -- the
 * same reasoning as faqJsonLd sharing its array with FaqList.
 */

export type HowToStep = { title: string; body: string };

export function converterPageJsonLd({
  name,
  description,
  url,
  steps,
  faq,
}: {
  name: string;
  description: string;
  /** Path only, e.g. "/qbo-to-csv" — resolved against the canonical origin. */
  url: string;
  steps: HowToStep[];
  faq: FaqItem[];
}) {
  const origin = "https://ledgerlocal.com";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name,
        description,
        url: `${origin}${url}`,
        applicationCategory: "FinanceApplication",
        // Browser-based, so no OS constraint. This is a real differentiator
        // against the desktop converters in this space and worth declaring.
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free to use — no signup required",
        },
      },
      {
        "@type": "HowTo",
        name: `How to ${name.replace(/^Free /, "").toLowerCase()}`,
        description,
        totalTime: "PT1M",
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}

/** The conversion flow is identical across every converter, so it lives here once. */
export function converterSteps(source: string, target: string): HowToStep[] {
  return [
    {
      title: `Drop in your ${source} file`,
      body: `Drag the file onto the box above or click to browse. It is read in your browser — nothing is uploaded to a server, which you can confirm in the Network tab.`,
    },
    {
      title: "Check what was found",
      body: `Every transaction is read out with its date, payee, description, amount and transaction ID, along with any warnings about rows that need a look.`,
    },
    {
      title: `Download the ${target}`,
      body: `The ${target} file saves straight to your device, ready to open in a spreadsheet or import into your accounting software.`,
    },
  ];
}
