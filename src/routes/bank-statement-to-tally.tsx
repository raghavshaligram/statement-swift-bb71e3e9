import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
    q: "Does any bank export directly to Tally XML?",
    a: "No — banks export to CSV, Excel, OFX, QIF, or QBO, never Tally XML directly. Getting a bank statement into Tally means either manual entry or converting the PDF or CSV export into Tally's XML format first.",
  },
  {
    q: "Which banks does this work with?",
    a: "Any bank whose PDF statement is text-based — named detection covers 23+ major banks across the US, UK, Canada, and India, with a generic layout parser handling any other bank's text-based PDF.",
  },
  {
    q: "How do I import the XML file into Tally?",
    a: "Gateway of Tally > Import Data > Vouchers, then select the XML file this tool downloaded.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — BalanceExtract falls back to on-device OCR automatically when a page has no real text layer. Signing in is required for scans and photos specifically, since OCR takes real processing time.",
  },
  {
    q: "Is my statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/bank-statement-to-tally")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/bank-statement-to-tally` }],
    meta: [
      { title: "Free Bank Statement to Tally XML Converter — BalanceExtract" },
      {
        name: "description",
        content: "Convert any bank's PDF statement to Tally-ready XML. Free to try, on-device — nothing uploaded.",
      },
      { property: "og:title", content: "Free Bank Statement to Tally XML Converter — BalanceExtract" },
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

      <Breadcrumbs trail={[{ label: "Bank statement converters", href: "/blog" }, { label: "Free Bank Statement to Tally XML Converter" }]} />
      <ArticleBackLink />
      <ArticleHero eyebrow="Bank guide" title="Free Bank Statement to Tally XML Converter" publishedDate="July 2026" />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          No bank exports directly to Tally XML — it's simply not one of the formats banks offer (CSV, Excel,
          OFX, QIF, and QBO cover almost everyone's native export list, but never Tally). For accountants
          working with Tally, that means either re-keying every transaction by hand or converting a bank
          statement into Tally's XML format first. This guide covers the second option.
        </p>
      </ArticleProse>

      <QuickSummary>
        Getting a bank statement into Tally without keying in every voucher by hand means converting it
        first, since no bank offers native Tally XML export. This converts any bank's PDF statement directly
        — named detection for 23+ major banks, plus a generic parser for any other text-based PDF. Import
        the resulting XML file straight into Tally via Gateway of Tally, Import Data, Vouchers.
      </QuickSummary>

      <ArticleH2>How It Works</ArticleH2>
      <NumberedSteps
        steps={[
          { title: "Download the PDF statement from your bank", body: "No account needed for up to 6 pages." },
          { title: "Upload to BalanceExtract", body: "Named detection recognizes 23+ major banks automatically; any other bank falls back to the generic layout parser." },
          { title: "Review the extracted transactions", body: "Every row gets a confidence score, so anything worth double-checking is flagged before you export." },
          { title: "Export as Tally XML", body: "Import the resulting file into Tally via Gateway of Tally, Import Data, Vouchers." },
        ]}
      />

      <ArticleH2>What's Inside the Tally XML Export</ArticleH2>
      <ArticleTable
        headers={["Element", "What It Contains"]}
        rows={[
          ["VOUCHER", "One per transaction — date, amount, and voucher type (Payment or Receipt)"],
          ["LEDGERENTRIES", "The debit/credit split against Bank and a matching ledger"],
          ["NARRATION", "The transaction description, with real XML special characters properly escaped"],
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          { href: "/icici-bank-statement-to-excel", title: "ICICI Bank Statement to Excel", blurb: "A major Indian bank many Tally users work with." },
          { href: "/bank-statement-to-ofx", title: "Bank Statement to OFX", blurb: "For QuickBooks, Xero, and other accounting software." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
