import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmbeddedConverter } from "@/components/embedded-converter";
import {
  ArticleBackLink,
  ArticleHero,
  QuickSummary,
  ArticleProse,
  ArticleH2,
  NumberedSteps,
  ArticleTable,
  LimitsList,
  RelatedArticles,
} from "@/components/article-sections";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Do I need to sign up to convert a photo or scan?",
    a: "Yes — unlike PDF conversion (free with no signup, up to 6 pages), converting a photo or scanned image requires a free account. OCR takes real processing time, so this is tracked against a 10-page lifetime allowance once signed up, shared with any PDF pages you convert too.",
  },
  {
    q: "How accurate is it?",
    a: "It depends on the photo. A clean, well-lit, flat scan reads nearly as well as a real PDF. A blurry phone photo taken at an angle, in poor light, will have more rows flagged as low-confidence. Every extracted row gets a confidence score specifically so you can see what's certain and what's worth a second look before exporting — this isn't hidden from you.",
  },
  {
    q: "What image formats work?",
    a: "JPG, PNG, and WEBP.",
  },
  {
    q: "Can I convert a scanned PDF, not just a photo?",
    a: "Yes — if a PDF page has no real text layer (a common case for older scanned statements), LedgerLocal automatically falls back to the same on-device OCR used for photos, no separate step needed.",
  },
  {
    q: "Is my photo uploaded anywhere?",
    a: "No. OCR runs entirely on your device using your browser's own processing power — you can confirm this yourself by opening DevTools' Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/image-to-excel")({
  head: () => ({
    meta: [
      { title: "Free Image to Excel Converter — LedgerLocal" },
      {
        name: "description",
        content:
          "Convert a photo or scanned image of a bank statement to Excel or CSV. Free to try with a signup, on-device OCR — nothing uploaded.",
      },
      { property: "og:title", content: "Free Image to Excel Converter — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero
        eyebrow="Converter guide"
        title="Free Image to Excel Converter"
        publishedDate="July 2026"
      />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          A photo of a bank statement — a printed copy, an old paper statement, a screenshot from an app that
          doesn't offer a real export — is one of the more common real-world starting points, and one of the
          hardest to get real, structured data out of. This guide covers exactly how converting an image to
          Excel actually works, what real accuracy to expect, and when a photo simply won't work well enough.
        </p>
      </ArticleProse>

      <QuickSummary>
        LedgerLocal reads JPG, PNG, and WEBP images directly, using on-device OCR — no server involved. Every
        extracted transaction gets a confidence score, so a blurry or angled photo doesn't silently produce wrong
        numbers; it flags exactly which rows are worth double-checking. Converting photos and scans requires a
        free account (unlike PDF conversion, which needs no signup) — a real, deliberate limit, not an
        oversight.
      </QuickSummary>

      <ArticleH2>How It Works</ArticleH2>
      <NumberedSteps
        steps={[
          {
            title: "Take or find a clear photo",
            body: "Flat, well-lit, and in focus works best — the same conditions that make text readable to a human eye make it readable to OCR. A photo taken straight-on beats one at an angle.",
          },
          {
            title: "Sign up and upload",
            body: "Photos and scans need a free account, since OCR takes real processing time and is tracked against a lifetime page allowance.",
          },
          {
            title: "Review the confidence scores",
            body: "Every extracted transaction is scored, so you can see at a glance which rows are certain and which are worth checking against the original photo before exporting.",
          },
          {
            title: "Export to Excel or CSV",
            body: "Once you're satisfied with the extracted data, export to Excel, CSV, or any other supported format.",
          },
        ]}
      />

      <ArticleH2>What Affects Accuracy</ArticleH2>
      <ArticleTable
        headers={["Factor", "Real effect"]}
        rows={[
          ["Lighting", "Even, bright light reads far more reliably than shadows or glare across the page"],
          ["Angle", "A straight-on photo avoids the perspective distortion that confuses column alignment"],
          ["Resolution", "A low-resolution or heavily compressed image loses the fine detail OCR needs for small print"],
          ["Focus", "Blur is the single biggest cause of misread characters, especially digits"],
        ]}
      />

      <ArticleH2>When a Photo Won't Work Well</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Handwritten statements", body: "OCR is built for printed text — handwriting isn't reliably readable at all." },
          { lead: "Very low-resolution screenshots", body: "a heavily compressed or tiny screenshot may not have enough detail left to extract cleanly." },
          { lead: "Extreme angles or partial captures", body: "if the statement is cut off or badly skewed, some rows may be missed entirely rather than just flagged as low-confidence." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-border bg-card p-5">
              <div className="font-semibold text-ink">{q}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <RelatedArticles
        articles={[
          { href: "/lloyds-bank-statement-to-csv", title: "Lloyds Bank Statement to CSV", blurb: "A bank-specific guide, for when you have the real PDF instead." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For getting your exported data into QuickBooks Desktop." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
