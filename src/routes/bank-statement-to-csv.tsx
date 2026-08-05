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
    q: "Why CSV instead of Excel?",
    a: "CSV opens in literally anything — Excel, Google Sheets, Numbers, any accounting tool's import screen, even a plain text editor. It's smaller, has no formatting or formulas to strip out, and is the format most software actually expects when you're importing transactions rather than just reading them.",
  },
  {
    q: "Does my bank need to be on a supported list?",
    a: "No. Named detection covers 23+ major banks across the US, UK, Canada, and India, and any other bank's text-based PDF falls back to a generic layout parser that still reads dates, descriptions, amounts, and balances.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — BalanceExtract falls back to on-device OCR automatically when a page has no real text layer. Signing in is required for scans and photos specifically, since OCR takes real processing time.",
  },
  {
    q: "Can I convert statements from more than one bank at once?",
    a: "Yes. Drop PDFs from different banks into the same batch and they're detected and processed together into a single CSV.",
  },
  {
    q: "Is my statement data uploaded anywhere?",
    a: "No. The PDF is read and converted entirely on your device — nothing is sent to a server. You can confirm this yourself by watching your browser's DevTools Network tab during a conversion.",
  },
];

export const Route = createFileRoute("/bank-statement-to-csv")({
  head: () => ({
    meta: [
      { title: "Free Bank Statement to CSV Converter — BalanceExtract" },
      {
        name: "description",
        content: "Convert any bank's PDF statement to CSV — free, on-device, works with 23+ banks across the US, UK, Canada, and India. Nothing uploaded.",
      },
      { property: "og:title", content: "Free Bank Statement to CSV Converter — BalanceExtract" },
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
      <ArticleHero eyebrow="Bank guide" title="Free Bank Statement to CSV Converter" publishedDate="July 2026" />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          Some banks offer a native CSV export from online banking — worth checking your specific bank's own
          guide on this site first, since that's usually faster when it's available. This page covers converting
          a PDF statement directly, for any bank, when a native export isn't an option: an emailed statement, a
          closed account, transactions outside your bank's export window, or a scan.
        </p>
      </ArticleProse>

      <QuickSummary>
        A CSV is the one format almost every spreadsheet and accounting tool accepts without a fight — no
        version-specific formatting, no proprietary lock-in, just rows of data. This converts any bank's PDF
        statement — named detection for 23+ major banks, plus a generic parser for any other text-based PDF —
        into a clean CSV with date, description, amount, and running balance, ready to open anywhere or import
        into whatever software actually needs the data.
      </QuickSummary>

      <ArticleH2>How It Works</ArticleH2>
      <NumberedSteps
        steps={[
          { title: "Download the PDF statement from your bank", body: "No account needed for up to 6 pages." },
          { title: "Upload to BalanceExtract", body: "Named detection recognizes 23+ major banks automatically; any other bank falls back to the generic layout parser." },
          { title: "Review, then export as CSV", body: "Every row gets a confidence score before you export." },
        ]}
      />

      <ArticleH2>What's Inside the CSV</ArticleH2>
      <ArticleTable
        headers={["Column", "What It Contains"]}
        rows={[
          ["Date", "Transaction date, normalized to ISO (YYYY-MM-DD) so it reads unambiguously regardless of your spreadsheet's regional settings"],
          ["Description", "The payee or transaction description, exactly as it appears on the statement"],
          ["Amount", "Signed — negative for debits, positive for credits"],
          ["Balance", "The running balance, when your statement includes one"],
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          { href: "/lloyds-bank-statement-to-csv", title: "Lloyds Bank Statement to CSV", blurb: "A bank that already offers a native CSV export." },
          {
            href: "/bank-statement-to-qbo",
            title: "Bank Statement to QBO",
            blurb: "Import into QuickBooks as a bank feed rather than a spreadsheet.",
          },
          { href: "/bank-statement-to-excel", title: "Bank Statement to Excel", blurb: "The same conversion as a real .xlsx workbook." },
          { href: "/bank-statement-to-ofx", title: "Bank Statement to OFX", blurb: "For QuickBooks, Quicken, or Xero as a real transaction feed." },
          { href: "/image-to-excel", title: "Image to Excel", blurb: "For a photo or scan instead of a real PDF." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
