import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList, faqJsonLd } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { StickyStatementBar } from "@/components/statement-funnel";
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
import { Callout, TroubleshootGrid, NextSteps } from "@/components/guide-sections";

/**
 * The highest-CPC keyword cluster on the site, and it had no page at all.
 *
 *   convert pdf bank statement to qbo             110/mo  KD 20  $41.02
 *   convert bank statement to qbo file             90/mo  KD 17  $33.88
 *   import bank statements into quickbooks online  90/mo  KD 24  $29.47
 *   import bank statements into quickbooks        170/mo  KD 25  $21.38
 *   bank statement to qbo converter               390/mo  KD 15  $19.21
 *   how to upload bank statements to quickbooks    90/mo  KD 24  $14.38
 *
 * ~940 searches/month at $14-41 CPC. The $41.02 is the highest single CPC
 * across the Instafill, CapyParse and bankstatementconverter datasets
 * combined -- these are bookkeepers and accountants with billable time on the
 * line, which is why the ad market prices them this way.
 *
 * BalanceExtract had /bank-statement-to-csv, -ofx, -qif, -tally and -excel but
 * nothing for QBO, despite exportToQbo existing in the codebase the whole
 * time. A dead link to this exact path was caught by check:links days ago and
 * the link was fixed rather than the gap.
 *
 * Deliberately covers the IMPORT side too ("import bank statements into
 * QuickBooks"), because half this cluster is people who already have a file
 * and are stuck at the QuickBooks end. Answering that is what makes the page
 * relevant to the query rather than just to the conversion.
 */

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How do I convert a bank statement PDF to QBO?",
    a: "Drop the statement PDF into the converter on this page and choose QBO at the export step. You get a QuickBooks Web Connect file ready to import — no column mapping, because QBO already carries dates, amounts, payees and transaction IDs in the structure QuickBooks expects.",
  },
  {
    q: "Why import QBO instead of CSV?",
    a: "A CSV import makes you map columns every time, and QuickBooks treats the result as plain data. A QBO file is a bank feed as far as QuickBooks is concerned — transactions arrive with FITIDs, so QuickBooks can match them against existing entries and won't duplicate anything you've already imported.",
  },
  {
    q: "How do I import a QBO file into QuickBooks Online?",
    a: "In QuickBooks Online: Transactions → Bank transactions → Link account → Upload from file, then select the .qbo. You'll be asked which account it belongs to. QuickBooks Desktop uses File → Utilities → Import → Web Connect Files instead.",
  },
  {
    q: "Will importing create duplicate transactions?",
    a: "Not if the FITIDs are intact, and they are here — every transaction carries a unique identifier that QuickBooks uses to recognise entries it has already seen. Re-importing an overlapping date range is safe. Converters that drop FITID are the reason duplicate imports are a common complaint.",
  },
  {
    q: "QuickBooks says my QBO file is invalid or the wrong bank. What now?",
    a: "QuickBooks Desktop checks a bank identifier (INTU.BID) inside the file and can reject one that doesn't match a bank it recognises. QuickBooks Online is far more permissive. If Desktop rejects the file, importing to QuickBooks Online, or using CSV, is the reliable route.",
  },
  {
    q: "Can I convert several months at once?",
    a: "Yes. Drop multiple statement PDFs into the same batch and they're converted together. Because FITIDs are preserved, overlapping periods across files won't produce duplicates on import.",
  },
  {
    q: "What if my statement is a scan rather than a text PDF?",
    a: "It still converts — on-device OCR runs automatically when a page has no text layer. Rows the parser isn't confident about are flagged for review before you export, which matters more than usual here since an imported error has to be un-picked inside QuickBooks.",
  },
  {
    q: "Is my statement uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser and the file never reaches a server. You can confirm it in DevTools' Network tab while converting, or by disconnecting from the internet after the page loads.",
  },
];

export const Route = createFileRoute("/bank-statement-to-qbo")({
  head: () => ({
    meta: [
      { title: "Convert Bank Statement to QBO — Import into QuickBooks | BalanceExtract" },
      {
        name: "description",
        content:
          "Convert a bank statement PDF to a QBO file and import it into QuickBooks Online or Desktop. FITIDs preserved so nothing duplicates. Runs in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Bank Statement to QBO Converter — BalanceExtract" },
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
      <ArticleHero
        eyebrow="Converter"
        title="Convert Bank Statement to QBO"
        publishedDate="August 2026"
      />

      <QuickSummary>
        Turn a statement PDF into a QuickBooks Web Connect (.qbo) file and import it as a bank feed
        rather than a spreadsheet. No column mapping, and every transaction keeps its FITID so
        QuickBooks won&apos;t duplicate anything you&apos;ve already brought in. Runs entirely in
        your browser — the statement never leaves your device.
      </QuickSummary>

      {/* EmbeddedConverter carries no width constraint of its own -- without
          this wrapper it renders edge-to-edge while the prose above sits in a
          max-w-3xl column. Matches how /bank-statement-to-csv wraps it. */}
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleH2>Convert PDF bank statement to QBO: why a bank statement to QBO converter beats a CSV import</ArticleH2>
      <ArticleProse>
        <p>
          Both get your transactions in. The difference is what QuickBooks does with them
          afterwards.
        </p>
        <p>
          A CSV is just columns. You map them by hand on every import, QuickBooks has no idea which
          transactions it has seen before, and the result sits in your books as data you entered. A
          QBO file is the format QuickBooks uses for live bank feeds — it carries dates, amounts,
          payees and a unique identifier per transaction, so QuickBooks can match against existing
          entries and refuse to import the same one twice.
        </p>
      </ArticleProse>

      <ArticleTable
        headers={["", "CSV import", "QBO import"]}
        rows={[
          ["Column mapping", "Every time", "None"],
          ["Duplicate detection", "No", "Yes, via FITID"],
          ["Treated as", "Imported data", "Bank feed"],
          ["Re-importing overlapping dates", "Creates duplicates", "Safe"],
          ["QuickBooks Desktop", "Works", "Works, may check the bank ID"],
          ["QuickBooks Online", "Works", "Works"],
        ]}
      />

      <ArticleH2>How to upload bank statements to QuickBooks, and import bank statements into QuickBooks Online</ArticleH2>
      <NumberedSteps
        steps={[
          {
            title: "Convert the statement PDF",
            body: "Drop it into the converter above and choose QBO at the export step. Up to 6 pages needs no account.",
          },
          {
            title: "Review anything flagged",
            body: "Rows the parser wasn't confident about are highlighted first. Worth a look here specifically — an error that reaches QuickBooks has to be un-picked inside QuickBooks, which is slower than fixing it now.",
          },
          {
            title: "Import to QuickBooks Online",
            body: "Transactions → Bank transactions → Link account → Upload from file, then pick the .qbo and tell QuickBooks which account it belongs to.",
          },
          {
            title: "Or import to QuickBooks Desktop",
            body: "File → Utilities → Import → Web Connect Files, then select the .qbo.",
          },
        ]}
      />

      <Callout tone="warning" title="If QuickBooks Desktop rejects the file">
        Desktop checks a bank identifier called INTU.BID inside the QBO and can refuse a file whose
        identifier it doesn&apos;t recognise — this is a QuickBooks restriction, not a fault in the
        file. QuickBooks Online is far more permissive and accepts the same file without complaint.
        If Desktop is the only option, CSV import is the reliable fallback.
      </Callout>

      <ArticleH2>Convert bank statement to QBO file: common problems</ArticleH2>
      <TroubleshootGrid
        items={[
          {
            symptom: "Every transaction imported twice",
            body: "The FITIDs were missing or regenerated, so QuickBooks had no way to recognise entries it already held. They're preserved here, which is what makes re-importing an overlapping date range safe.",
          },
          {
            symptom: "QuickBooks says the file is from the wrong financial institution",
            body: "Desktop is matching the INTU.BID field against banks it knows. Import to QuickBooks Online instead, which doesn't enforce it.",
          },
          {
            symptom: "Dates are a month out",
            body: "Day-month versus month-day ambiguity — 03/04 is two different dates depending on where the statement came from. Date order is inferred per statement from evidence in the document rather than assumed, but it's worth spot-checking a UK or Indian statement after import.",
          },
          {
            symptom: "Amounts have the wrong sign",
            body: "QBO signs from the account's point of view: money out is negative, money in is positive. Credit-card statements follow the same convention, so a purchase is negative and a card payment positive.",
          },
          {
            symptom: "The statement covers two accounts",
            body: "One PDF can hold a current account and a savings account. They're kept separate rather than interleaved, so you can import each to the right QuickBooks account.",
          },
          {
            symptom: "Totals don't match the statement",
            body: "Take this one seriously — it usually means a row was misread. Every row's running balance is checked against the previous one, so a break is flagged with the exact row before export rather than surfacing later in your books.",
          },
        ]}
      />

      <ArticleH2>After the import</ArticleH2>
      <NextSteps
        items={[
          {
            title: "Review in the banking feed",
            body: "Imported QBO transactions land in QuickBooks' For Review queue exactly like a live feed, so the categorisation and matching workflow is the one you already use.",
          },
          {
            title: "Let QuickBooks match existing entries",
            body: "If you've already entered invoices or bills manually, QuickBooks will offer matches rather than creating duplicates — which is the main practical reason to import QBO rather than CSV.",
          },
          {
            title: "Backfill historical periods",
            body: "Bank feeds usually only reach back 90 days. Converting older PDF statements is how you fill the gap before that window, and FITIDs keep the overlap clean.",
          },
          {
            title: "Keep the Excel copy for review",
            body: "The same conversion exports to Excel or CSV. Handy for checking a period against the statement without digging through QuickBooks.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <RelatedArticles
        articles={[
          {
            href: "/bank-statement-to-excel",
            title: "Bank Statement to Excel",
            blurb: "The same conversion as a workbook, for reviewing rather than importing.",
          },
          {
            href: "/bank-statement-to-csv",
            title: "Bank Statement to CSV",
            blurb: "When your software expects columns rather than a bank feed.",
          },
          {
            href: "/qbo-to-csv",
            title: "QBO to CSV",
            blurb: "The other direction — open a QBO file as a spreadsheet.",
          },
          {
            href: "/csv-to-qbo",
            title: "CSV to QBO",
            blurb: "Already have a CSV? Turn it into a QuickBooks-ready QBO file.",
          },
        ]}
      />

      <StickyStatementBar />
      <SiteFooter />
    </div>
  );
}
