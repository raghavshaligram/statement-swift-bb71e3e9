import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList, faqJsonLd } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
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
    q: "Which banks already export OFX directly?",
    a: "Several major banks do — NatWest and Chase both offer native OFX export from online banking, for example. Check your specific bank's guide on this site, since a native export (when it exists) is usually the fastest route.",
  },
  {
    q: "When do I actually need this converter instead?",
    a: "When your bank doesn't offer OFX natively, the transactions you need are older than your bank's export window, or you only have a PDF — an emailed statement, a closed account, or a scan.",
  },
  {
    q: "What software imports OFX files?",
    a: "Most accounting and personal-finance software — QuickBooks, Quicken, Xero, and many banks' own import tools — accepts OFX as a standard transaction-import format.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — BalanceExtract falls back to on-device OCR automatically when a page has no real text layer. Signing in is required for scans and photos specifically.",
  },
  {
    q: "Is my statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device.",
  },
];

export const Route = createFileRoute("/bank-statement-to-ofx")({
  head: () => ({
    meta: [
      { title: "Free Bank Statement to OFX Converter — BalanceExtract" },
      { name: "description", content: "Convert any bank's PDF statement to OFX for QuickBooks, Quicken, or Xero. Free to try, on-device — nothing uploaded." },
      { property: "og:title", content: "Free Bank Statement to OFX Converter — BalanceExtract" },
    ],
  }),
  component: Page,
});

function Page() {
  const jsonLd = faqJsonLd(FAQ);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero eyebrow="Bank guide" title="Free Bank Statement to OFX Converter" publishedDate="July 2026" />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          Some banks offer OFX export natively — worth checking your specific bank's own guide on this site
          first, since that's usually faster. This page covers converting a PDF statement directly when your
          bank doesn't offer OFX, the transactions you need are outside its export window, or a PDF is all you
          have.
        </p>
      </ArticleProse>

      <QuickSummary>
        Getting a bank statement into QuickBooks, Quicken, or Xero as a real transaction feed — not a
        spreadsheet you have to reshape by hand — is what OFX is for. Converts any bank's PDF statement —
        named detection for 23+ major banks, plus a generic parser for any other text-based PDF — into a
        standard OFX transaction file, ready to import into QuickBooks, Quicken, Xero, and most accounting
        software.
      </QuickSummary>

      <ArticleH2>How It Works</ArticleH2>
      <NumberedSteps
        steps={[
          { title: "Download the PDF statement from your bank", body: "No account needed for up to 6 pages." },
          { title: "Upload to BalanceExtract", body: "Named detection recognizes 23+ major banks automatically; any other bank falls back to the generic layout parser." },
          { title: "Review, then export as OFX", body: "Every row gets a confidence score before you export." },
        ]}
      />

      <ArticleH2>What's Inside the OFX Export</ArticleH2>
      <ArticleTable
        headers={["Field", "What It Contains"]}
        rows={[
          ["DTPOSTED", "Transaction date"],
          ["TRNAMT", "Signed amount"],
          ["NAME", "Payee or description"],
          ["FITID", "A unique transaction ID, used to avoid duplicate imports"],
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          { href: "/natwest-bank-statement-to-csv", title: "NatWest Bank Statement to CSV", blurb: "A bank that already offers native OFX export." },
          { href: "/bank-statement-to-qif", title: "Bank Statement to QIF", blurb: "For Quicken specifically." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
