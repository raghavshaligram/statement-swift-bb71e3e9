import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolChips } from "@/components/tool-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqList, faqJsonLd } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import {
  ArticleHero,
  QuickSummary,
  ArticleTOC,
  ArticleProse,
  ArticleH2,
  NumberedSteps,
  ArticleTable,
  LimitsList,
  ArticleCta,
  RelatedArticles,
} from "@/components/article-sections";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does NatWest let me export a CSV statement directly?",
    a: "Yes. In NatWest Online Banking, go to Statements & transactions, then View transactions, set your date range, and export to CSV, Excel, OFX, or PDF directly — no third-party tool needed. NatWest also lists Sage Line 50-compatible OFX among its native export formats.",
  },
  {
    q: "My NatWest CSV opens with everything in one column in Excel — what's wrong?",
    a: "This is a real, documented issue with the comma-delimited version of NatWest's export. NatWest's own workaround is to try the tab-delimited download option instead if the comma-delimited file opens badly — it's an Excel delimiter-detection problem, not corrupted data.",
  },
  {
    q: "So when do I actually need a converter?",
    a: "When you only have a PDF and can't (or don't want to) re-export from online banking — an old statement someone emailed you, a closed account, or a paper statement you scanned. BalanceExtract reads the PDF directly and gives you CSV, Excel, or other formats from that.",
  },
  {
    q: "Will the dates come out right, or will Excel flip day and month?",
    a: "NatWest statements use DD/MM/YYYY. BalanceExtract infers the date order from the statement itself and normalises output dates to ISO (YYYY-MM-DD) by default, which Excel reads unambiguously regardless of your system's regional settings.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — BalanceExtract falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting.",
  },
  {
    q: "Can I combine NatWest statements with other banks?",
    a: "Yes. Drop PDFs from NatWest and any other bank into the same batch — BalanceExtract detects each one and processes them together into one export.",
  },
  {
    q: "Does this work for NatWest business accounts, not just personal?",
    a: "NatWest is named-detected specifically for the standard personal statement layout. Business account statements often use a different layout, so they'll likely fall back to the generic parser — it works with any text-based PDF, but double-check the extracted rows before exporting.",
  },
  {
    q: "Is my NatWest statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/natwest-bank-statement-to-csv")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/natwest-bank-statement-to-csv` }],
    meta: [
      { title: "NatWest Bank Statement to CSV — Formats and Limits" },
      {
        name: "description",
        content:
          "NatWest lets you export CSV, Excel, and OFX directly from online banking. Here's exactly what the export contains, where it falls short, and how to convert older PDF statements.",
      },
      { property: "og:title", content: "NatWest Bank Statement to CSV: Formats and Limits — BalanceExtract" },
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

      <Breadcrumbs trail={[{ label: "Bank statement converters", href: "/blog" }, { label: "NatWest Bank Statement to CSV: Formats and Limits" }]} />
      <ArticleHero
        eyebrow="Bank guide"
        title="NatWest Bank Statement to CSV: Formats and Limits"
      />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ToolChips />

      <QuickSummary>
        Getting NatWest transactions into your books without manual entry usually starts with NatWest's own
        export — it genuinely covers CSV, Excel, and OFX directly from online banking, often the fastest
        route if you can log in. The real gaps: current-account history export goes back up to 7 years,
        but credit card transaction export is limited to about 3 months, and the CSV's comma-delimited
        version has a documented Excel-opening issue (NatWest's own fix: try the tab-delimited download
        instead). For anything older, a closed account, or a scanned statement, convert the PDF with
        BalanceExtract instead of typing it in by hand.
      </QuickSummary>

      <ArticleProse>
        <p>
          NatWest is one of the "big four" UK retail banks, and unlike some competitors, it already offers a
          genuinely capable native export — CSV, Excel, and even a Sage Line 50-compatible OFX file, straight
          from online banking. That makes NatWest one of the better cases for using a bank's own export first.
          This guide covers exactly what that export contains, a real formatting issue worth knowing about
          before it wastes your afternoon, and how to convert the PDF statements the export can't reach.
        </p>
      </ArticleProse>


      <ArticleTOC
        items={[
          { label: "How to export the CSV", href: "#download" },
          { label: "What the export looks like", href: "#export-looks-like" },
          { label: "Native export limits", href: "#limits" },
          { label: "Converting PDF statements", href: "#converting-pdf" },
          { label: "Importing into your software", href: "#importing" },
          { label: "FAQ", href: "#faq" },
        ]}
      />

      <ArticleH2 id="download">How to Export a NatWest Bank Statement as CSV</ArticleH2>
      <NumberedSteps
        steps={[
          {
            title: "Log in to NatWest Online Banking",
            body: "Sign in at onlinebanking.natwest.com, or use the NatWest mobile app.",
          },
          {
            title: "Go to Statements & transactions, then View transactions",
            body: "Select the account you want, then open its transaction view rather than the statement/PDF view.",
          },
          {
            title: "Set your date range and choose a format",
            body: "Pick CSV, Excel, OFX, or PDF. If you plan to import into accounting software, OFX is usually the cleaner fit; CSV or Excel are better for manual review.",
          },
          {
            title: "Download and open",
            body: "If the comma-delimited CSV opens with everything crammed into one column, re-download using the tab-delimited option instead — a known Excel delimiter-detection issue, not bad data.",
          },
        ]}
      />

      <ArticleH2 id="export-looks-like">What the NatWest CSV Export Looks Like</ArticleH2>
      <ArticleProse>
        <p>
          The NatWest export contains six columns, using the same paid-in/paid-out split several UK banks favor
          over a single signed amount column.
        </p>
      </ArticleProse>
      <ArticleTable
        headers={["Column", "What It Contains"]}
        rows={[
          ["Date", "The transaction date, in DD/MM/YYYY format"],
          ["Type", "A short transaction-mechanism code (debit card, direct debit, standing order, etc.)"],
          ["Description", "The payee or merchant name"],
          ["Paid In", "Populated only for credits — empty for debit rows"],
          ["Paid Out", "Populated only for debits — empty for credit rows"],
          ["Balance", "The running balance after that transaction"],
        ]}
      />

      <ArticleH2 id="limits">The Limits of NatWest's Native Export</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Credit card history is much shorter", body: "credit card transactions are viewable and exportable for roughly the last 3 months, versus up to 7 years for current-account transaction search." },
          { lead: "A real delimiter issue in Excel", body: "the comma-delimited CSV can open with every field crammed into one column depending on your Excel locale settings — NatWest's own documented workaround is the tab-delimited download option." },
          { lead: "Search windows can be capped", body: "some views limit date-range search to a few months at a time, requiring repeated exports stitched together for a full year." },
          { lead: "Business layouts aren't guaranteed", body: "business account statements can use a different structure than the personal layout described here." },
        ]}
      />

      <ArticleH2 id="converting-pdf">Converting NatWest PDF Statements</ArticleH2>
      <ArticleProse>
        <p>
          For anything the native export can't reach — an old credit card statement past the 3-month window, a
          closed account, or a paper statement someone scanned — convert the PDF directly.
        </p>
      </ArticleProse>
      <NumberedSteps
        steps={[
          { title: "Download the PDF statements from NatWest", body: "Log in, open the account, and download each statement as a PDF from the Statements section." },
          { title: "Upload to BalanceExtract", body: "Drop your NatWest PDFs into the converter — batch upload works, and each statement is processed on its own." },
          { title: "Review, then export", body: "BalanceExtract detects NatWest's layout automatically and shows every extracted transaction with a confidence score before you export. Export to CSV, Excel, Tally XML, or IIF." },
        ]}
      />

      <ArticleH2 id="importing">Import Into QuickBooks, Excel, or Google Sheets</ArticleH2>
      <ArticleProse>
        <p>
          <strong className="text-ink">QuickBooks Desktop:</strong> QuickBooks Desktop has no native CSV import
          for transactions. Export IIF from BalanceExtract instead — File &gt; Utilities &gt; Import &gt; IIF Files
          reads it directly.
        </p>
        <p>
          <strong className="text-ink">Excel:</strong> If NatWest's own CSV opens with everything in one column,
          that's the tab-delimiter issue above, not a problem with BalanceExtract's own CSV or Excel export, which
          opens correctly either way.
        </p>
        <p>
          <strong className="text-ink">Google Sheets:</strong> Use File, then Import, and let Sheets detect the
          separator automatically.
        </p>
      </ArticleProse>

      <ArticleH2 id="faq">Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <ArticleCta
        heading="Ready to Get Your NatWest Data Into a Spreadsheet?"
        body="Use NatWest's own export for recent activity, and BalanceExtract for everything else. Free to try."
        buttonLabel="Try BalanceExtract Free"
      />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          { href: "/lloyds-bank-statement-to-csv", title: "Lloyds Bank Statement to CSV", blurb: "How Lloyds' native export compares, and converting older PDFs." },
          { href: "/csv-to-ofx", title: "CSV to OFX Converter", blurb: "For accounting software that prefers a real transaction feed over a spreadsheet." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter for QuickBooks Desktop", blurb: "Turn any CSV export into a QuickBooks Desktop-ready IIF file." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
