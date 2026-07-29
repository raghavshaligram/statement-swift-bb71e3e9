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
  RelatedArticles,
} from "@/components/article-sections";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Which banks already export QIF directly?",
    a: "Very few do natively — QIF is one of the older personal-finance formats, and most modern banks favor CSV, Excel, or OFX instead. Some business banking portals (Lloyds Online for Business, for example) still offer it.",
  },
  {
    q: "What software reads QIF files?",
    a: "Quicken (Windows and Mac), Banktivity, MYOB, YNAB, GnuCash, and many older or lightweight accounting tools.",
  },
  {
    q: "How do I import the QIF file into Quicken?",
    a: "File > File Import > QIF File, then select the file and choose the account to import into.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — LedgerLocal falls back to on-device OCR automatically when a page has no real text layer. Signing in is required for scans and photos specifically.",
  },
  {
    q: "Is my statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device.",
  },
];

export const Route = createFileRoute("/bank-statement-to-qif")({
  head: () => ({
    meta: [
      { title: "Free Bank Statement to QIF Converter — LedgerLocal" },
      { name: "description", content: "Convert any bank's PDF statement to QIF for Quicken. Free to try, on-device — nothing uploaded." },
      { property: "og:title", content: "Free Bank Statement to QIF Converter — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero eyebrow="Bank guide" title="Free Bank Statement to QIF Converter" publishedDate="July 2026" />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          QIF is one of the oldest personal-finance file formats still in active use, but very few banks export
          it natively anymore — most favor CSV, Excel, or OFX instead. This guide covers converting a PDF
          statement from any bank directly into QIF for Quicken.
        </p>
      </ArticleProse>

      <QuickSummary>
        If Quicken is where your bookkeeping actually happens, getting a bank statement into it without
        retyping every transaction means converting to QIF first. Converts any bank's PDF statement — named
        detection for 23+ major banks, plus a generic parser for any other text-based PDF — into a standard
        QIF file, ready to import into Quicken.
      </QuickSummary>

      <ArticleH2>How It Works</ArticleH2>
      <NumberedSteps
        steps={[
          { title: "Download the PDF statement from your bank", body: "No account needed for up to 6 pages." },
          { title: "Upload to LedgerLocal", body: "Named detection recognizes 23+ major banks automatically; any other bank falls back to the generic layout parser." },
          { title: "Review, then export as QIF", body: "Every row gets a confidence score before you export." },
        ]}
      />

      <ArticleH2>What's Inside the QIF Export</ArticleH2>
      <ArticleTable
        headers={["Field code", "What It Contains"]}
        rows={[
          ["D", "Transaction date"],
          ["T", "Amount"],
          ["P", "Payee"],
          ["M", "Memo"],
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
          { href: "/lloyds-bank-statement-to-csv", title: "Lloyds Bank Statement to CSV", blurb: "A bank whose business accounts still offer QIF export." },
          { href: "/bank-statement-to-ofx", title: "Bank Statement to OFX", blurb: "For QuickBooks, Xero, and other accounting software." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
