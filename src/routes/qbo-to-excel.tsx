import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Breadcrumbs, PageTOC } from "@/components/breadcrumbs";
import { ToolHero, ToolChips, ToolCrossLinks } from "@/components/tool-hero";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { FaqList, type FaqItem } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { InlineConverter } from "@/components/inline-converter";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
import { exportToXlsx } from "@/lib/export/to-xlsx";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";
import {
  StepList,
  StepCard,
  Callout,
  CodeBlock,
  TroubleshootGrid,
  MethodTable,
  NextSteps,
} from "@/components/guide-sections";
import { ArticleH2, ArticleProse, ConverterEmbed } from "@/components/article-sections";

/**
 * The guide tier, and the first page built to it.
 *
 * Two reasons this page exists at all:
 *
 * 1. "qbo to excel converter" is ~1,000 searches/month at keyword difficulty
 *    0, and BalanceExtract had no page for it. A competitor currently ranks #1
 *    from a page that isn't even primarily about Excel.
 *
 * 2. Tool pages cannot rank for question-shaped queries. There is nowhere on a
 *    dropzone to answer "why won't Excel open my QBO file", and that is a real
 *    search with real volume. A long guide that links DOWN to the tool
 *    captures both intents without making the tool page worse.
 *
 * The structure deliberately teaches two methods that don't need this product
 * (rename-to-XML, and the file-is-actually-a-PDF case). That is not
 * generosity for its own sake: it captures intent a tool page can't, it's the
 * part readers link to, and a guide that only ever concludes "use our thing"
 * is one a reader stops believing halfway down.
 */

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".xlsx";
}

const FAQ: FaqItem[] = [
  {
    q: "Why won't Excel open my QBO file?",
    a: "Because a QBO file isn't a spreadsheet. It's a financial-data format built on OFX, which is SGML-style markup rather than rows and columns. Excel has no importer for it, so double-clicking either does nothing or drops you into an import wizard that can't make sense of the tags.",
  },
  {
    q: "Can I convert QBO to Excel for free?",
    a: "Yes. Drop the file into the converter on this page and download an .xlsx workbook. No signup, no upload — the conversion runs in your browser, so the file never leaves your device.",
  },
  {
    q: "What is the FITID column in my converted file?",
    a: "FITID is the bank's unique identifier for that transaction. QuickBooks uses it to recognise transactions it has already imported, so keeping it means re-importing an overlapping date range won't create duplicates. It's exported as Transaction ID.",
  },
  {
    q: "Why are my dates showing as 20250601120000?",
    a: "That's the raw OFX date field — YYYYMMDD followed by a time and sometimes a timezone marker like [0:GMT]. Only the date portion matters for bookkeeping, so this converter strips the rest and gives you a clean date. Converters that don't strip it are handing you the raw field.",
  },
  {
    q: "My file has two accounts in it. What happens?",
    a: "They're kept separate. A bank download often bundles a current account and a credit card into one file, each as its own statement section. Every transaction is tagged with its account, and the Excel export puts each account on its own sheet rather than interleaving two date sequences into one confusing list.",
  },
  {
    q: "Is QBO the same as OFX and QFX?",
    a: "Effectively yes — same underlying structure, different extensions and headers. QBO is QuickBooks' flavour, QFX is Quicken's, OFX is the open standard. The converter here accepts all three.",
  },
  {
    q: "What if my bank only gave me a PDF?",
    a: "Then you don't have a QBO file at all, and no format converter will help. You need a statement parser that reads the PDF's layout — see the PDF section further down this page.",
  },
];

export const Route = createFileRoute("/qbo-to-excel")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/qbo-to-excel` }],
    meta: [
      { title: "QBO to Excel Converter — Open a QBO File in Excel (Free)" },
      {
        name: "description",
        content:
          "Excel can't open .qbo files. Three ways to get QuickBooks Web Connect data into a spreadsheet, including a free browser-based converter that never uploads your file.",
      },
      { property: "og:title", content: "QBO to Excel — Free Converter & Guide | BalanceExtract" },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("QBO", "Excel");
  const jsonLd = converterPageJsonLd({
    name: "Free QBO to Excel Converter",
    description:
      "Convert a QuickBooks Web Connect (.qbo) file to an Excel workbook in your browser. Free, no signup, nothing uploaded.",
    url: "/qbo-to-excel",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs trail={[{ label: "Format converters", href: "/blog" }, { label: "QBO to Excel Converter" }]} />
      <ToolHero
        formatLabel="Format guide"
        title="QBO to Excel: How to Open a QBO File in Excel"
        subtitle="Excel can't read .qbo files natively. Here are three ways to get the data into a spreadsheet — including one that takes about ten seconds."
      />

      <ConverterEmbed
        heading="Convert a QBO file to Excel"
        body="Drop your file below — runs entirely in your browser, nothing is uploaded."
      >
        <InlineConverter
          accept=".qbo,.ofx,.qfx"
          sourceLabel="QBO"
          targetLabel="Excel"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseOfxText(content);
            const transactions = ofxResultToTransactions(result, file.name);
            if (transactions.length > 0) {
              exportToXlsx(
                transactions,
                DEFAULT_EXPORT_OPTIONS,
                outputName(file.name),
                false,
                result.currency,
              );
            }
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <ToolChips />

      <PageTOC
        headings={[
          "Why Excel can't open a QBO file",
          "What&apos;s actually inside a QBO file",
          "Method 1: use the converter on this page",
          "Method 2: rename to .xml and import manually",
          "Method 3: when your file is actually a PDF",
          "Troubleshooting your converted file",
          "Once the data is in Excel",
        ]}
      />

      <ArticleH2>Why Excel can't open a QBO file</ArticleH2>
      <ArticleProse>
        <p>
          A .qbo file is a QuickBooks Web Connect download. Despite looking like a data file, it
          isn&apos;t a spreadsheet — it&apos;s Open Financial Exchange data, a markup format designed
          for software to read rather than people. Excel has no importer for it, so you get one of
          three unhelpful outcomes:
        </p>
      </ArticleProse>

      <StepList>
        <StepCard n={1} title="Double-clicking does nothing useful">
          Windows and macOS usually hand the file to QuickBooks, or offer an &quot;open with&quot;
          prompt. Neither gets you a spreadsheet.
        </StepCard>
        <StepCard n={2} title="Renaming it to .xml sort of works">
          Excel will open it as XML and show you a tree of tags. Every transaction is in there, but
          spread across rows in a shape no one would call usable.
        </StepCard>
        <StepCard n={3} title="Older files fail hardest">
          Many banks still emit OFX 1.x, which is SGML rather than XML — leaf tags often have no
          closing tag at all. Excel&apos;s XML importer rejects those outright.
        </StepCard>
      </StepList>

      <Callout tone="tip" title="The short version">
        If you just want the data, use the converter above — it reads all three flavours (.qbo,
        .ofx, .qfx), handles unclosed SGML tags, and produces a real .xlsx workbook. The rest of
        this page explains what&apos;s inside the file and what to do when the output looks wrong.
      </Callout>

      <ArticleH2>What&apos;s actually inside a QBO file</ArticleH2>
      <ArticleProse>
        <p>
          Open one in a plain text editor and you&apos;ll find something like this. Each transaction
          is a <code>STMTTRN</code> block, wrapped in a statement section that identifies the
          account:
        </p>
      </ArticleProse>

      <CodeBlock
        label="Inside a .qbo file"
        code={`<BANKACCTFROM>
  <BANKID>021000021
  <ACCTID>1234567890
  <ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
  <STMTTRN>
    <TRNTYPE>DEBIT
    <DTPOSTED>20250601120000[0:GMT]
    <TRNAMT>-45.20
    <FITID>202506010001
    <NAME>STARBUCKS STORE 04821
    <MEMO>CARD PURCHASE
  </STMTTRN>
</BANKTRANLIST>`}
      />

      <ArticleProse>
        <p>
          Note the missing closing tags on the leaf elements — that&apos;s valid OFX 1.x and it is
          exactly what breaks generic XML tools. Note also <code>DTPOSTED</code>: a date, a time,
          and a timezone marker crammed into one field. Only the first eight digits mean anything
          for bookkeeping, which is why a good converter strips the rest and a lazy one hands you
          <code> 20250601120000[0:GMT]</code> in a date column.
        </p>
        <p>
          <code>FITID</code> is worth keeping. It&apos;s the bank&apos;s unique ID for that
          transaction, and it&apos;s what accounting software uses to avoid importing the same
          transaction twice.
        </p>
      </ArticleProse>

      <ArticleH2>Method 1: use the converter on this page</ArticleH2>
      <StepList>
        <StepCard n={1} title="Drop in the file">
          .qbo, .ofx and .qfx all work — they share the same underlying structure. It&apos;s read in
          your browser; nothing is sent to a server, which you can confirm in your browser&apos;s
          Network tab.
        </StepCard>
        <StepCard n={2} title="Check what was found">
          You&apos;ll see the transaction count and any warnings — a file containing more than one
          account says so, and rows with missing dates or amounts are reported rather than dropped
          silently.
        </StepCard>
        <StepCard n={3} title="Download the workbook">
          An .xlsx file with Date, Payee, Description, Category, Transaction ID, Amount, Dr/Cr and
          Balance. Multi-account files get one sheet per account.
        </StepCard>
      </StepList>

      <ArticleH2>Method 2: rename to .xml and import manually</ArticleH2>
      <ArticleProse>
        <p>
          This works, costs nothing, and is worth knowing if you&apos;d rather not use a tool at
          all. Copy the file, change the extension to .xml, then open it in Excel and choose
          &quot;As an XML table&quot; when prompted. Excel builds a table from the tags.
        </p>
        <p>
          Two things to expect. First, it only works on OFX 2.x files with proper closing tags — if
          Excel reports a parse error, your file is SGML-style and this route is closed. Second,
          you&apos;ll get raw fields: dates as <code>20250601120000</code>, one column per tag, and
          the account details interleaved with transactions. Cleaning that up by hand takes longer
          than the conversion did.
        </p>
      </ArticleProse>

      <Callout tone="warning" title="Where the manual route breaks down">
        Unclosed SGML tags stop Excel&apos;s importer dead. Multi-account files interleave two
        statements into one table with no way to tell them apart. Date and amount columns arrive as
        text, so sorting and totalling misbehave until you convert them. And every one of these has
        to be redone next month, on the next file.
      </Callout>

      <ArticleH2>Method 3: when your file is actually a PDF</ArticleH2>
      <ArticleProse>
        <p>
          A common surprise: people looking for a QBO-to-Excel converter often don&apos;t have a QBO
          file. Most banks only offer structured downloads for recent months — beyond that window
          you get a PDF, which no format converter can help with.
        </p>
        <p>
          That needs a statement parser: something that works out the column layout from the
          document itself, handles scanned pages with OCR, and checks that the running balance
          reconciles so a misread row surfaces instead of quietly landing in your books.
        </p>
      </ArticleProse>

      <MethodTable
        methods={[
          {
            name: "Converter on this page",
            handlesScans: "n/a",
            needsUpload: false,
            effort: "Seconds",
            output: "Clean .xlsx, one sheet per account",
          },
          {
            name: "Rename to .xml",
            handlesScans: "n/a",
            needsUpload: false,
            effort: "10–20 min per file",
            output: "Raw tags, manual cleanup",
          },
          {
            name: "PDF statement converter",
            handlesScans: true,
            needsUpload: false,
            effort: "Seconds",
            output: "Excel, CSV, QBO, OFX, QIF",
          },
        ]}
      />

      <StatementFunnel sourceFormat="QBO" targetFormat="Excel" />

      <ArticleH2>Troubleshooting your converted file</ArticleH2>
      <TroubleshootGrid
        items={[
          {
            symptom: "Dates look like 20250601120000",
            body: "That's the raw DTPOSTED field: date, then time, sometimes a timezone marker. Only the leading eight digits are meaningful. The converter here keeps just the date; if another tool gave you the full string, you're seeing the field untouched.",
          },
          {
            symptom: "Amounts are negative when I expected positive",
            body: "OFX signs from the account's point of view — money leaving is negative, money arriving is positive. Credit-card files follow the same rule, so a purchase is negative and a payment towards the card is positive. It reads backwards at first but it's consistent.",
          },
          {
            symptom: "There's a Transaction ID column I didn't ask for",
            body: "That's FITID, and you want it. Accounting software uses it to spot transactions it has already imported. Deleting the column before importing is how you end up with every transaction twice.",
          },
          {
            symptom: "Two accounts are mixed together",
            body: "Your download bundled several statements. Each account gets its own sheet in the Excel export here — if a tool gave you one interleaved list, it read the transactions without reading the account sections around them.",
          },
          {
            symptom: "The file is .qfx or .ofx, not .qbo",
            body: "Same format underneath, different extension and header. The converter above accepts all three, so there's nothing to change.",
          },
          {
            symptom: "Some rows are missing",
            body: "Check the warnings shown after conversion. Records with an unparseable date or amount are reported and counted rather than dropped silently — a converter that shows no warnings and fewer rows than you expected is the one to distrust.",
          },
        ]}
      />

      <ArticleH2>Once the data is in Excel</ArticleH2>
      <NextSteps
        items={[
          {
            title: "Build a pivot table",
            body: "Select the table, Insert → PivotTable, then Payee as rows and Amount as values. Two clicks to see where the money actually went, which is usually the reason for the conversion in the first place.",
          },
          {
            title: "Use the Category column",
            body: "Transactions are categorised on your device as part of the conversion. Sort or filter by it to split business from personal, or to sanity-check a month before it reaches your books.",
          },
          {
            title: "Reconcile against your records",
            body: "The Balance column carries the bank's own running balance. If it doesn't move by the Amount on every row, something upstream is wrong — that's a genuinely useful check and almost nobody uses it.",
          },
          {
            title: "Import into accounting software",
            body: "QuickBooks, Xero, Wave and FreshBooks all take CSV. If you'd rather skip column mapping, convert to native QBO or OFX instead and import that.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ComparisonLinks />

      <ToolCrossLinks
        links={[
          { href: "/qbo-to-csv", label: "QBO to CSV" },
          { href: "/ofx-to-csv", label: "OFX to CSV" },
          { href: "/qfx-to-excel", label: "QFX to Excel" },
          { href: "/ofx-to-excel", label: "OFX to Excel" },
          { href: "/csv-to-qbo", label: "CSV to QBO" },
          { href: "/bank-statement-to-csv", label: "Bank statement to CSV" },
        ]}
      />

      <StickyStatementBar />
      <SiteFooter />
    </div>
  );
}
