import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { StatementGridArt } from "@/components/statement-grid-art";
import {
  ArticleBackLink,
  ArticleHero,
  QuickSummary,
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
    q: "Does Lloyds let me export a CSV statement directly?",
    a: "Yes, but with real limits: Lloyds' own CSV export only covers the last 12 months of transactions, is capped at 150 transactions per download, and is only available on the desktop site (not the app). For a single recent month on a low-volume account, that's usually enough. For older statements, or if you need more than 150 transactions in one file, that's the real gap this page covers.",
  },
  {
    q: "Can I get an Excel file directly from Lloyds?",
    a: "No — Lloyds doesn't offer a native Excel export. Your options from Lloyds itself are PDF (always available) or the limited CSV above. To get an Excel file, you'd convert the PDF with a tool like this one.",
  },
  {
    q: "How far back can I get Lloyds statements?",
    a: "Up to 7 years through online banking, and at least 10 years through the mobile app. If you need a specific older statement the app doesn't show, Lloyds can also send one on request.",
  },
  {
    q: "Can I still get statements after closing my Lloyds account?",
    a: "Yes. Lloyds can provide copy statements (your transaction history) for up to 5 years after an account closes — you'll need to contact them directly to request it, rather than downloading it yourself online.",
  },
  {
    q: "I need this for proof of address — will a converted CSV or Excel file work?",
    a: "No — keep the original PDF for that. Most organisations accept a bank statement PDF downloaded directly from online banking as proof of address, but a converted file (CSV, Excel, or anything without the bank's own formatting) generally isn't accepted for this purpose. Use LedgerLocal when you need the transaction data itself — budgeting, accounting, reconciliation — not when the PDF itself is what's being requested.",
  },
  {
    q: "Will the dates come out right, or will Excel flip day and month?",
    a: "Lloyds statements use DD/MM/YYYY. LedgerLocal infers the date order from the statement itself rather than assuming a fixed format, and normalises output dates to ISO (YYYY-MM-DD) by default, which Excel reads unambiguously regardless of your system's regional settings.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — LedgerLocal falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting.",
  },
  {
    q: "Can I combine Lloyds statements with other banks?",
    a: "Yes. Drop PDFs from Lloyds and any other bank into the same batch — LedgerLocal detects each one and processes them together into one export.",
  },
  {
    q: "Is my Lloyds statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/lloyds-bank-statement-to-csv")({
  head: () => ({
    meta: [
      { title: "Lloyds Bank Statement to CSV: Formats and Limits — LedgerLocal" },
      {
        name: "description",
        content:
          "Lloyds' own CSV export is capped at 12 months and 150 transactions, with no native Excel option at all. Convert any Lloyds PDF statement to CSV or Excel on-device — free to try, nothing uploaded.",
      },
      { property: "og:title", content: "Lloyds Bank Statement to CSV: Formats and Limits — LedgerLocal" },
      {
        property: "og:description",
        content: "How the Lloyds CSV export actually works, where it falls short, and how to get data out of the PDF statements it can't reach.",
      },
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
        eyebrow="Bank guide"
        title="Lloyds Bank Statement to CSV: Formats and Limits"
        publishedDate="July 2026"
        illustration={<StatementGridArt titleText="A Lloyds statement transforming into a structured spreadsheet" className="w-full" />}
      />

      <ArticleProse>
        <p>
          Lloyds is one of the largest retail banks in the UK, and Lloyds Banking Group's infrastructure also
          underpins Halifax and Bank of Scotland — over 23 million customers between the three brands eventually
          need the same thing: their transactions in a spreadsheet, not locked inside a PDF. This guide covers
          exactly how the Lloyds CSV export works, what the file looks like column by column, where it falls
          short, and how to get data out of the PDF statements that hold everything the download can't reach.
        </p>
        <p>
          This article covers Lloyds personal and business current accounts. If you bank with Halifax or Bank of
          Scotland, the same export mechanics apply — both share the same underlying online banking platform and
          the same real limits described below.
        </p>
      </ArticleProse>

      <QuickSummary>
        Lloyds lets you download transactions as a CSV from online banking, but only the last 12 months, capped
        at 150 transactions per download, and only on the desktop site. Lloyds keeps PDF statements for 7 years
        (10+ years in the app), but offers no native Excel export at all. For anything the CSV export can't
        reach — older statements, more than 150 transactions, or an Excel file — upload the PDFs to LedgerLocal
        and export CSV, Excel, Tally XML, or IIF.
      </QuickSummary>

      <ArticleH2>How to Download a Lloyds Bank Statement as CSV</ArticleH2>
      <ArticleProse>
        <p>
          The built-in export works, it's free, and for recent transactions it's the fastest option available.
          Here's the process on Lloyds Internet Banking.
        </p>
      </ArticleProse>
      <NumberedSteps
        steps={[
          {
            title: "Log in on desktop",
            body: "Sign in to Lloyds Internet Banking at lloydsbank.com. The CSV export specifically is not available in the mobile app — you'll need the desktop site for this step.",
          },
          {
            title: "Open the account and find Statement options",
            body: "Select the account you want, then look for Statement options in the account view.",
          },
          {
            title: "Choose the CSV export",
            body: "Pick CSV if you want to work in Excel or Google Sheets. Lloyds also offers PDF statements from the same menu, and Online for Business accounts can export QIF as well as CSV.",
          },
          {
            title: "Set your date range",
            body: "You can pick a custom range, but only within the last 12 months — anything older simply isn't offered as an export option, regardless of the range you try to set.",
          },
          {
            title: "Download and open",
            body: "The file saves to your computer. Double-click to open it in Excel, or import it into Google Sheets via File, then Import.",
          },
        ]}
      />

      <ArticleH2>What the Lloyds CSV Export Looks Like</ArticleH2>
      <ArticleProse>
        <p>
          The Lloyds CSV export contains six columns. Unlike some banks that use a single signed Amount column,
          Lloyds splits money in and money out into two separate columns.
        </p>
      </ArticleProse>
      <ArticleTable
        headers={["Column", "What It Contains"]}
        rows={[
          ["Date", "The transaction date, in DD/MM/YYYY format"],
          ["Description", "The payee or merchant name as it appears on the transaction"],
          ["Type", "A short code for the transaction type (e.g. DEB for debit card, DD for direct debit, BGC for bank giro credit)"],
          ["Money In (£)", "Populated only for credits — empty for any row that's a debit"],
          ["Money Out (£)", "Populated only for debits — empty for any row that's a credit"],
          ["Balance (£)", "The running balance after that transaction"],
        ]}
      />
      <ArticleProse>
        <p>
          The Type column is worth paying attention to if you're categorizing transactions — codes like DEB, DD,
          SO, and BGC map to real transaction mechanisms (debit card, direct debit, standing order, bank giro
          credit) rather than spending categories, so treat it as a mechanism hint, not a bookkeeping category.
        </p>
      </ArticleProse>

      <ArticleH2>The Limits of Lloyds' Native CSV Export</ArticleH2>
      <ArticleProse>
        <p>
          The CSV download is genuinely useful for recent activity. It also has hard edges that show up exactly
          when the stakes are highest: tax season, a mortgage application, or catching up on a year of
          bookkeeping.
        </p>
      </ArticleProse>
      <LimitsList
        limits={[
          { lead: "Limited lookback", body: "the export covers roughly the last 12 months. PDF statements, by contrast, are available for up to 7 years online and 10+ years in the app." },
          { lead: "Hard transaction cap", body: "capped at 150 transactions per download. A busy account over a full year can easily exceed that, requiring multiple downloads stitched back together by hand." },
          { lead: "Desktop only", body: "the CSV export isn't available in the Lloyds mobile app at all — only the desktop site." },
          { lead: "No Excel format", body: "Lloyds offers PDF and CSV. There's no native .xlsx export, so getting a real Excel workbook means converting the PDF or reformatting the CSV yourself." },
          { lead: "One account, logged in", body: "the export works per account, per session — no bulk export across every account you hold, and no way to pull data for an account you can no longer log into." },
        ]}
      />

      <ArticleCta
        heading="Convert Your Lloyds Bank Statements"
        body="Upload a Lloyds PDF statement and get a clean CSV, Excel, Tally XML, or IIF file in seconds. Free to try, up to 6 pages with no signup."
        buttonLabel="Convert a Lloyds Statement"
      />

      <ArticleH2>Converting Lloyds PDF Statements</ArticleH2>
      <ArticleProse>
        <p>
          Lloyds keeps up to 7 years of PDF statements available under Statement options, and even longer in the
          app. Converting them to a spreadsheet takes three steps.
        </p>
      </ArticleProse>
      <NumberedSteps
        steps={[
          {
            title: "Download the PDF statements from Lloyds",
            body: "Log in, open the account, and download each monthly statement as a PDF. For a full year, that's up to 12 files.",
          },
          {
            title: "Upload to LedgerLocal",
            body: "Drop your Lloyds PDFs into the converter — batch upload works, and each statement is processed on its own.",
          },
          {
            title: "Review, then export",
            body: "LedgerLocal detects Lloyds' layout automatically and shows every extracted transaction with a confidence score before you export, so anything worth double-checking is flagged rather than silently guessed at. Export to CSV, Excel, Tally XML, or IIF.",
          },
        ]}
      />
      <ArticleProse>
        <p>
          One accuracy point worth calling out directly: Lloyds statements print dates as DD/MM/YYYY, the
          reverse of the US convention. A converter that assumes MM/DD would silently swap day and month for
          any date under the 13th. LedgerLocal infers the real date order from the statement itself rather than
          assuming one, and normalises output dates to ISO (YYYY-MM-DD) by default — a format Excel reads
          unambiguously no matter what regional settings your spreadsheet software is using.
        </p>
      </ArticleProse>

      <ArticleH2>Import Into QuickBooks, Excel, or Google Sheets</ArticleH2>
      <ArticleProse>
        <p>
          <strong className="text-ink">QuickBooks Desktop:</strong> QuickBooks Desktop has no native CSV import
          for transactions. Export IIF from LedgerLocal instead — File &gt; Utilities &gt; Import &gt; IIF Files
          reads it directly.
        </p>
        <p>
          <strong className="text-ink">Excel:</strong> Both the Lloyds CSV and the LedgerLocal CSV or Excel
          export open directly in Excel. If you're combining files from multiple Lloyds CSV downloads, watch for
          the Money In/Money Out split — summing both columns correctly (rather than just one) is what keeps
          your total reconciling against the statement.
        </p>
        <p>
          <strong className="text-ink">Google Sheets:</strong> Use File, then Import, and let Sheets detect the
          separator automatically. Dates come through cleanly once normalised to ISO, ready for filtering or a
          shared budget tracker.
        </p>
      </ArticleProse>

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

      <ArticleCta
        heading="Ready to Get Your Lloyds Data Into a Spreadsheet?"
        body="Use the Lloyds CSV export for the last 12 months, and LedgerLocal for everything else. Free to try."
        buttonLabel="Try LedgerLocal Free"
      />

      <RelatedArticles
        articles={[
          { href: "/natwest-bank-statement-to-csv", title: "NatWest Bank Statement to CSV", blurb: "How NatWest's native export compares, and converting older PDFs." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter for QuickBooks Desktop", blurb: "Turn any CSV export into a QuickBooks Desktop-ready IIF file." },
          { href: "/csv-to-ofx", title: "CSV to OFX Converter", blurb: "For accounting software that prefers a real transaction feed over a spreadsheet." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
