import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolChips } from "@/components/tool-hero";
import { Breadcrumbs, PageTOC } from "@/components/breadcrumbs";
import { FaqList, faqJsonLd } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { StickyStatementBar } from "@/components/statement-funnel";
import {
  ArticleHero,
  QuickSummary,
  ArticleProse,
  ArticleH2,
  NumberedSteps,
  ArticleTable,
  RelatedArticles,
} from "@/components/article-sections";
import { Callout, TroubleshootGrid, NextSteps } from "@/components/guide-sections";

/**
 * The single highest-value keyword gap on the site, found by cross-referencing
 * three competitors' keyword exports against our own routes.
 *
 * The "bank statement to Excel" cluster is worth roughly 2,000 searches/month
 * at $7-10 CPC, and the difficulty is low because the incumbent covers it from
 * a single homepage rather than a dedicated page:
 *
 *   convert bank statement to excel      480/mo   KD 2   $10.22
 *   bank statement to excel              590/mo   KD 13  $8.39
 *   bank statement pdf to excel          590/mo   KD 16  $7.20
 *   convert bank statements to excel     210/mo   KD 13  $9.43
 *   bank statement excel                  90/mo   KD 12  $8.04
 *   convert pdf bank statement to excel   90/mo   KD 12  $8.12
 *
 * BalanceExtract had /bank-statement-to-csv, -ofx, -qif, -tally and two
 * BANK-SPECIFIC Excel pages (Chase, ICICI), but nothing generic for Excel.
 * The homepage title mentions Excel, which is not the same as a page that
 * answers the query.
 *
 * KD 2 at $10.22 CPC is the cheapest high-intent term found across the
 * Instafill, CapyParse and bankstatementconverter datasets combined.
 */

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How do I convert a bank statement PDF to Excel?",
    a: "Drop the PDF into the converter on this page and download an .xlsx workbook. It runs in your browser — the statement is never uploaded — and works on statements from 23+ named banks across the US, UK, Canada and India, with a generic layout parser for anything else.",
  },
  {
    q: "Can I just copy and paste from the PDF into Excel?",
    a: "You can try, and it usually fails. Copying a PDF table gives you one long column with dates, descriptions and amounts run together, because a PDF has no concept of columns — only text positioned on a page. Reconstructing the columns by hand takes longer than the conversion, and it's where transcription errors come from.",
  },
  {
    q: "Should I choose Excel or CSV?",
    a: "Excel if you're going to read, sort and pivot the data yourself — you get real date and number types, one sheet per account, and currency formatting. CSV if you're importing into accounting software, which nearly always expects it. Both come from the same conversion here, so it's just a choice at the download step.",
  },
  {
    q: "Will the numbers come through as numbers, not text?",
    a: "Yes. Amounts and balances are written as numeric cells with currency formatting, and dates as real dates, so sorting and SUM work immediately. Statements pasted or scraped by hand usually arrive as text, which is why totals silently come out as zero.",
  },
  {
    q: "Is there a way to OCR bank statements to Excel?",
    a: "Yes — scanned statements and phone photos are handled by on-device OCR, which runs automatically when a page has no selectable text. Accuracy depends on the scan quality, so rows the parser is less sure about are flagged for review before you export rather than landing silently in your workbook.",
  },
  {
    q: "Can I get the output as an Excel sheet rather than a download?",
    a: "The conversion produces an .xlsx file you download, which opens directly in Excel, Google Sheets or Numbers. Nothing is stored online, so there's no cloud sheet to share — that's the trade-off that comes with the statement never leaving your device.",
  },
  {
    q: "What if my statement is a scan or a phone photo?",
    a: "It still converts — on-device OCR runs automatically when a page has no text layer. Signing in is required for scans specifically, since OCR takes real processing time.",
  },
  {
    q: "How do I know the conversion is correct?",
    a: "Every row's running balance is checked against the row before it. If the statement doesn't tie out, you're shown the exact row where it breaks before you export. Each transaction also carries a confidence score, so a misread digit is flagged rather than quietly landing in your workbook.",
  },
  {
    q: "Can I convert several months or several banks at once?",
    a: "Yes. Drop multiple PDFs into the same batch — different banks included — and they're detected and converted together. In Excel you can keep them on one sheet or split them per statement.",
  },
  {
    q: "Is my statement uploaded anywhere?",
    a: "No. Conversion happens entirely in your browser, so the file never reaches a server. You can confirm it by opening DevTools and watching the Network tab while it converts, or by disconnecting from the internet after the page loads.",
  },
];

export const Route = createFileRoute("/bank-statement-to-excel")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/bank-statement-to-excel` }],
    meta: [
      { title: "Convert Bank Statement PDF to Excel — Free, No Page Cap" },
      {
        name: "description",
        content:
          "Convert a bank statement PDF to Excel free. Real dates and numbers, one sheet per account, every row balance-checked. Runs in your browser — nothing is uploaded.",
      },
      { property: "og:title", content: "Convert Bank Statement to Excel — BalanceExtract" },
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

      <Breadcrumbs trail={[{ label: "Bank statement converters", href: "/blog" }, { label: "Convert Bank Statement PDF to Excel" }]} />
      <ArticleHero
        eyebrow="Converter"
        title="Convert Bank Statement to Excel"
        publishedDate="July 2026"
      publishedDate="July 2026" />


      {/* EmbeddedConverter carries no width constraint of its own -- without
          this wrapper it renders edge-to-edge while the prose above sits in a
          max-w-3xl column. Matches how /bank-statement-to-csv wraps it. */}
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ToolChips />

      <QuickSummary>
        Drop a statement PDF below and download an .xlsx workbook with real dates, real numbers and
        one sheet per account. It runs entirely in your browser, so the statement never leaves your
        device. Every row&apos;s running balance is checked against the one before it — if the
        statement doesn&apos;t tie out, you&apos;re told which row before you export.
      </QuickSummary>

      <PageTOC
        headings={[
          "Why copying and pasting doesn&apos;t work",
          "How to convert a bank statement to Excel",
          "Bank statement to Excel software: what to look for",
          "Convert bank statements to Excel in bulk (several at once)",
          "Excel or CSV?",
          "Common problems and what causes them",
          "Once it&apos;s in Excel",
        ]}
      />

      <ArticleH2>Why copying and pasting doesn&apos;t work</ArticleH2>
      <ArticleProse>
        <p>
          To convert PDF bank statement to Excel, something has to reconstruct the table — and a
          PDF has no columns. It has characters positioned on a page, and the columns you see are
          an illusion created by where those characters sit. When you select a statement table and
          paste it into Excel, that spatial information is thrown away — you get one long column
          with dates, descriptions and amounts run together, and multi-line descriptions split
          across rows they don&apos;t belong to.
        </p>
        <p>
          Rebuilding the columns by hand is slow, and worse, it&apos;s where errors enter. A
          transposed digit in a transaction amount survives every downstream check because nothing
          upstream ever verified it.
        </p>
      </ArticleProse>

      <ArticleH2>How to convert a bank statement to Excel</ArticleH2>
      <NumberedSteps
        steps={[
          {
            title: "Download the PDF from your bank",
            body: "Any statement PDF works. Up to 6 pages needs no account at all.",
          },
          {
            title: "Drop it into the converter above",
            body: "23+ major banks across the US, UK, Canada and India are detected by name; anything else falls back to a generic layout parser that reads dates, descriptions, amounts and balances from the page structure itself.",
          },
          {
            title: "Check the flagged rows",
            body: "Rows the parser wasn't confident about are highlighted, and can be reviewed side by side against the original page or corrected in place.",
          },
          {
            title: "Download as Excel",
            body: "An .xlsx workbook with typed dates and numbers, currency formatting, and a separate sheet per account when the statement covers more than one.",
          },
        ]}
      />

      <Callout tone="tip" title="Why the balance check matters more than an accuracy percentage">
        Most converters publish a single accuracy figure. That average tells you nothing useful about
        your statement — if a tool is 97% accurate across 4,000 pages, it doesn&apos;t tell you which
        120 rows are wrong. Bank statements are self-checking: each running balance should equal the
        previous one plus the transaction. Every row here is verified against that, so a break points
        at the exact row rather than at a probability.
      </Callout>


      <ArticleH2>Bank statement to Excel software: what to look for</ArticleH2>
      <ArticleProse>
        <p>
          Most tools in this category do the same first 80% — read a PDF, produce rows. The
          differences that matter show up on the statements that don&apos;t behave:
        </p>
        <p>
          <strong>Does it check its own work?</strong> A converter that reports an accuracy
          percentage is describing an average across everyone&apos;s statements, not yours. One that
          reconciles each running balance against the previous row can tell you the exact line that
          broke on <em>your</em> file. Bank statements are self-checking documents and surprisingly
          little software exploits that.
        </p>
        <p>
          <strong>Where does the file go?</strong> Most converters upload your statement to a server
          to process it. If the statements belong to clients rather than to you, that&apos;s a
          data-processing relationship you&apos;ve just entered into. On-device conversion avoids it
          entirely, and you can verify the claim in your browser&apos;s Network tab rather than
          trusting a privacy page.
        </p>
        <p>
          <strong>How is it priced?</strong> Per-page and per-row plans mean your bill scales with
          your workload, and month-end is exactly when you hit the ceiling. Flat pricing doesn&apos;t
          have that failure mode.
        </p>
      </ArticleProse>

      <ArticleH2>Convert bank statements to Excel in bulk (several at once)</ArticleH2>
      <ArticleProse>
        <p>
          Most real work is plural — twelve months for a tax return, six months for a mortgage
          application, or several accounts for one client. You can drop multiple statement PDFs into
          the same batch, including statements from different banks, and convert bank statements to
          Excel together rather than one at a time.
        </p>
        <p>
          In the workbook you can keep everything on one sheet for a single continuous ledger, or
          split per statement. Where one PDF covers more than one account, each account gets its own
          sheet automatically — so a combined current-and-savings statement doesn&apos;t arrive as
          two interleaved date sequences.
        </p>
        <p>
          Scanned statements work in the same batch as text PDFs. OCR runs on your device only for
          the pages that need it, so a mixed batch of downloaded and photographed statements
          converts in one pass.
        </p>
      </ArticleProse>

      <ArticleH2>Excel or CSV?</ArticleH2>
      <ArticleTable
        headers={["", "Excel (.xlsx)", "CSV"]}
        rows={[
          ["Best for", "Reading, sorting, pivoting yourself", "Importing into accounting software"],
          ["Dates and numbers", "Real typed cells", "Plain text, re-parsed on import"],
          ["Multiple accounts", "One sheet each", "One file, Account column"],
          ["Currency formatting", "Applied", "Not applicable"],
          ["Opens in", "Excel, Sheets, Numbers", "Almost anything"],
        ]}
      />
      <ArticleProse>
        <p>
          Both come from the same conversion, so this is only a choice at the download step. If
          you&apos;re handing the file to an accountant, Excel is usually kinder. If it&apos;s going
          into QuickBooks or Xero, use CSV — or skip the column mapping entirely and export native
          QBO or OFX instead.
        </p>
      </ArticleProse>

      <ArticleH2>Common problems and what causes them</ArticleH2>
      <TroubleshootGrid
        items={[
          {
            symptom: "Amounts won't SUM in Excel",
            body: "They've arrived as text rather than numbers, usually from a copy-paste or a converter that writes everything as strings. Amounts here are written as numeric cells, so SUM and sorting work as soon as the file opens.",
          },
          {
            symptom: "Dates sort in the wrong order",
            body: "Same cause — dates stored as text sort alphabetically, so 01/12 lands before 02/03 regardless of year. Real date cells fix it. Day-month order is also inferred per statement rather than assumed, which matters for UK and Indian formats.",
          },
          {
            symptom: "Descriptions are split across rows",
            body: "Bank statements wrap long descriptions onto a second line with no date or amount. A converter that treats each visual line as a transaction produces orphan rows; the continuation has to be reattached to the transaction it belongs to.",
          },
          {
            symptom: "Two accounts are mixed together",
            body: "One statement PDF can cover a current account and a savings account. In Excel each gets its own sheet, so you aren't reading two interleaved date sequences as one list.",
          },
          {
            symptom: "The totals don't match the statement",
            body: "This is the one worth taking seriously — it usually means a row was misread or dropped. The balance check catches it before export and points at the row, rather than leaving you to find it in your books later.",
          },
          {
            symptom: "The PDF is a scan and nothing is selectable",
            body: "There's no text layer, so OCR is needed. That runs on your device automatically when a page has no selectable text; accuracy depends on the scan, and low-confidence rows are flagged accordingly.",
          },
        ]}
      />

      <ArticleH2>Once it&apos;s in Excel</ArticleH2>
      <NextSteps
        items={[
          {
            title: "Pivot by payee",
            body: "Insert → PivotTable, Payee as rows, Amount as values. The fastest way to see where the money actually went, and usually the reason for converting in the first place.",
          },
          {
            title: "Use the Category column",
            body: "Transactions are categorised on your device during conversion. Filter by it to separate business from personal, or to sanity-check a month before it reaches your books.",
          },
          {
            title: "Check the Balance column",
            body: "It carries the bank's own running balance. If it doesn't move by the Amount on every row, something is wrong upstream — a genuinely useful audit step that almost nobody uses.",
          },
          {
            title: "Hand it to your accountant",
            body: "An .xlsx with typed dates, numbers and per-account sheets is what they'd have built by hand from the PDF. Sending it converted saves them the transcription and you the fee for it.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          {
            href: "/bank-statement-to-qbo",
            title: "Bank Statement to QBO",
            blurb: "Import into QuickBooks as a bank feed rather than a spreadsheet.",
          },
          {
            href: "/bank-statement-to-csv",
            title: "Bank Statement to CSV",
            blurb: "The same conversion, in the format most accounting software expects.",
          },
          {
            href: "/image-to-excel",
            title: "Photo or Scan to Excel",
            blurb: "For paper statements captured with a phone camera.",
          },
          {
            href: "/chase-bank-statement-to-excel",
            title: "Chase Statement to Excel",
            blurb: "Bank-specific notes for Chase layouts.",
          },
          {
            href: "/icici-bank-statement-to-excel",
            title: "ICICI Statement to Excel",
            blurb: "Bank-specific notes for ICICI layouts.",
          },
        ]}
      />

      <StickyStatementBar />
      <SiteFooter />
    </div>
  );
}
