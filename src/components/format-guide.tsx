import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolHero, ToolChips, ToolCrossLinks } from "@/components/tool-hero";
import { Breadcrumbs, PageTOC } from "@/components/breadcrumbs";
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
 * Shared guide template for the OFX-family -> Excel pages.
 *
 * QBO, OFX and QFX are the same format with different extensions and headers,
 * so the technical content of these guides is genuinely the same content --
 * the STMTTRN structure, unclosed SGML leaf tags, DTPOSTED timezone suffixes,
 * FITID de-duplication, multi-account sections. Writing three near-identical
 * pages by hand guarantees they drift, and the last time bulk edits were
 * scripted across many similar route files, seven of them shipped broken.
 *
 * One component with three thin call sites means a fix to the explanation
 * lands everywhere at once, and there is one place to review rather than
 * three to diff.
 *
 * What is NOT shared, and is passed per page: the extension, which software
 * produces it, and the format-specific FAQ entries. Pages that say the same
 * thing in the same words compete with each other, so the per-page copy has
 * to be real rather than a find-and-replace of the format name.
 */

export type FormatGuideConfig = {
  /** Extension label shown to the reader, e.g. "QFX". */
  source: "QBO" | "OFX" | "QFX";
  /** Route path, e.g. "/qfx-to-excel". */
  path: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  /** Which software emits this flavour — the one-line "what is this file". */
  origin: string;
  /** Format-specific opening paragraph. */
  intro: string;
  faq: FaqItem[];
  /** Sibling converter links for the footer strip. */
  crossLinks: Array<{ href: string; label: string }>;
};

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".xlsx";
}

export function FormatGuide({ config }: { config: FormatGuideConfig }) {
  const { source, path, title, subtitle, metaTitle, metaDescription, origin, intro, faq, crossLinks } =
    config;

  const steps = converterSteps(source, "Excel");
  const jsonLd = converterPageJsonLd({
    name: `Free ${source} to Excel Converter`,
    description: metaDescription,
    url: path,
    steps,
    faq,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs
        trail={[{ label: "Format converters", href: "/blog" }, { label: `${source} to Excel` }]}
      />

      <ToolHero formatLabel="Format guide" title={title} subtitle={subtitle} />

      {/* Headings are interpolated with the format name, so the TOC is built
          from the same strings the H2s render -- headingId() slugifies both
          identically, so they cannot drift. */}
      <PageTOC
        headings={[
          `Why Excel can't open a ${source} file`,
          "What's inside the file",
          "Method 1: use the converter on this page",
          "Method 2: rename to .xml and import manually",
          "Method 3: when your file is actually a PDF",
          "Troubleshooting your converted file",
          "Once the data is in Excel",
        ]}
      />

      <ConverterEmbed
        heading={`Convert a ${source} file to Excel`}
        body="Drop your file below — runs entirely in your browser, nothing is uploaded."
      >
        <InlineConverter
          accept=".qbo,.ofx,.qfx"
          sourceLabel={source}
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

      <ArticleH2>Why Excel can&apos;t open a {source} file</ArticleH2>
      <ArticleProse>
        <p>{intro}</p>
        <p>
          {origin} Whatever produced it, the contents are Open Financial Exchange data — markup
          designed for software to read rather than people. Excel has no importer for it, so you get
          one of three unhelpful outcomes.
        </p>
      </ArticleProse>

      <StepList>
        <StepCard n={1} title="Double-clicking does nothing useful">
          Windows and macOS hand the file to whichever accounting app claimed the extension, or offer
          an &quot;open with&quot; prompt. Neither gets you a spreadsheet.
        </StepCard>
        <StepCard n={2} title="Renaming it to .xml sort of works">
          Excel will open it as XML and show a tree of tags. Every transaction is there, spread
          across rows in a shape nobody would call usable.
        </StepCard>
        <StepCard n={3} title="Older files fail hardest">
          Many banks still emit OFX 1.x, which is SGML rather than XML — leaf tags often have no
          closing tag at all. Excel&apos;s XML importer rejects those outright.
        </StepCard>
      </StepList>

      <Callout tone="tip" title="The short version">
        Use the converter above — it reads .{source.toLowerCase()}, .ofx and .qbo alike, handles
        unclosed SGML tags, and produces a real .xlsx workbook. The rest of this page explains
        what&apos;s inside the file and what to do when the output looks wrong.
      </Callout>

      <ArticleH2>What&apos;s inside the file</ArticleH2>
      <ArticleProse>
        <p>
          Open one in a plain text editor and you&apos;ll find something like this. Each transaction
          is a <code>STMTTRN</code> block, inside a statement section identifying the account:
        </p>
      </ArticleProse>

      <CodeBlock
        label={`Inside a .${source.toLowerCase()} file`}
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
          Note the missing closing tags on leaf elements — valid OFX 1.x, and exactly what breaks
          generic XML tools. Note <code>DTPOSTED</code> too: a date, a time and a timezone marker in
          one field. Only the first eight digits matter for bookkeeping, which is why a good
          converter strips the rest and a lazy one hands you the raw string in a date column.
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
          .{source.toLowerCase()}, .ofx and .qbo all work — same structure underneath. It&apos;s read
          in your browser; nothing is sent to a server, which you can confirm in the Network tab.
        </StepCard>
        <StepCard n={2} title="Check what was found">
          You&apos;ll see the transaction count and any warnings. A file containing more than one
          account says so, and records with missing dates or amounts are reported rather than
          dropped silently.
        </StepCard>
        <StepCard n={3} title="Download the workbook">
          An .xlsx with Date, Payee, Description, Category, Transaction ID, Amount, Dr/Cr and
          Balance. Multi-account files get one sheet per account.
        </StepCard>
      </StepList>

      <ArticleH2>Method 2: rename to .xml and import manually</ArticleH2>
      <ArticleProse>
        <p>
          Worth knowing if you&apos;d rather not use a tool at all. Copy the file, change the
          extension to .xml, open it in Excel and choose &quot;As an XML table&quot;. Excel builds a
          table from the tags.
        </p>
        <p>
          Two caveats. It only works on OFX 2.x files with proper closing tags — a parse error means
          your file is SGML-style and this route is closed. And you get raw fields: dates as{" "}
          <code>20250601120000</code>, one column per tag, account details interleaved with
          transactions. Cleaning that up by hand takes longer than the conversion did.
        </p>
      </ArticleProse>

      <Callout tone="warning" title="Where the manual route breaks down">
        Unclosed SGML tags stop Excel&apos;s importer dead. Multi-account files interleave two
        statements into one table with no way to tell them apart. Dates and amounts arrive as text,
        so sorting and totalling misbehave until you convert them. And it all has to be redone next
        month, on the next file.
      </Callout>

      <ArticleH2>Method 3: when your file is actually a PDF</ArticleH2>
      <ArticleProse>
        <p>
          A common surprise: people looking for a {source}-to-Excel converter often don&apos;t have a{" "}
          {source} file. Most banks only offer structured downloads for recent months — beyond that
          window you get a PDF, which no format converter can help with.
        </p>
        <p>
          That needs a statement parser: something that infers the column layout from the document
          itself, handles scanned pages with OCR, and checks the running balance reconciles so a
          misread row surfaces instead of quietly landing in your books.
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

      <StatementFunnel sourceFormat={source} targetFormat="Excel" />

      <ArticleH2>Troubleshooting your converted file</ArticleH2>
      <TroubleshootGrid
        items={[
          {
            symptom: "Dates look like 20250601120000",
            body: "That's the raw DTPOSTED field: date, then time, sometimes a timezone marker like [0:GMT]. Only the leading eight digits are meaningful. The converter here keeps just the date; if another tool gave you the full string, you're seeing the field untouched.",
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
            symptom: `The file is .ofx or .qbo, not .${source.toLowerCase()}`,
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
            body: "Select the table, Insert → PivotTable, then Payee as rows and Amount as values. Two clicks to see where the money actually went, which is usually the reason for the conversion.",
          },
          {
            title: "Use the Category column",
            body: "Transactions are categorised on your device as part of the conversion. Sort or filter by it to split business from personal, or sanity-check a month before it reaches your books.",
          },
          {
            title: "Reconcile against your records",
            body: "The Balance column carries the bank's own running balance. If it doesn't move by the Amount on every row, something upstream is wrong — a genuinely useful check that almost nobody uses.",
          },
          {
            title: "Import into accounting software",
            body: "QuickBooks, Xero, Wave and FreshBooks all take CSV. To skip column mapping, convert to native QBO or OFX instead and import that.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={faq} />

      <ComparisonLinks />

      <ToolCrossLinks links={crossLinks} />

      <StickyStatementBar />
      <SiteFooter />
    </div>
  );
}

export { type FaqItem };
