import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseIifText, iifResultToTransactions } from "@/lib/iif/parse-iif";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";
import {
  QuickSummary,
  ArticleProse,
  ArticleH2,
  NumberedSteps,
  ArticleTable,
  LimitsList,
  ConverterEmbed,
  RelatedArticles,
} from "@/components/article-sections";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
}

const FAQ = [
  { q: "Why would I need to go from IIF back to CSV?", a: "Common when you're migrating off QuickBooks Desktop, sharing data with someone who doesn't have QuickBooks, or auditing historical exports in a spreadsheet." },
  { q: "Where do I get an IIF file to convert?", a: "IIF is QuickBooks Desktop's own export/import format — you'd have one if you or your accountant exported transactions from QuickBooks Desktop." },
  { q: "What if my IIF file has multiple accounts or a different column order?", a: "Handled. Real QuickBooks exports can redefine the field order partway through the file (e.g. once per account section) — LedgerLocal reads each section's own header line rather than assuming one fixed layout for the whole file." },
  { q: "What if a row is missing a date or amount?", a: "It's skipped, and you're told exactly how many rows were skipped and why — never silently dropped or guessed at." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/iif-to-csv")({
  head: () => ({
    meta: [
      { title: "Free IIF to CSV Converter — LedgerLocal" },
      { name: "description", content: "Convert a QuickBooks Desktop IIF file to CSV. Free, unlimited, runs entirely in your browser." },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("IIF", "CSV");
  const jsonLd = converterPageJsonLd({
    name: "Free IIF to CSV Converter",
    description: "Convert IIF files to CSV in your browser.",
    url: "/iif-to-csv",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free IIF to CSV Converter: Reading QuickBooks Desktop's Export Format"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert an IIF file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".iif"
          sourceLabel="IIF"
          targetLabel="CSV"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseIifText(content);
            const transactions = iifResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), null);
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <StatementFunnel sourceFormat="IIF" targetFormat="CSV" />

      <ArticleH2>How to convert IIF to CSV in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          IIF (Intuit Interchange Format) is QuickBooks Desktop's own tab-delimited transaction format —
          straightforward for QuickBooks to read, considerably less so to open directly in a spreadsheet. This
          guide covers what's actually in an IIF file and how to get a clean CSV out of one.
        </p>
      </ArticleProse>

      <QuickSummary>
        Migrating off QuickBooks Desktop or auditing old records without retyping years of transactions
        starts with getting a clean CSV out of the IIF export. IIF files are tab-delimited, but QuickBooks
        exports can redefine the column order partway through the file — once per account section — which
        breaks naive parsers that assume one fixed layout. This converter reads each section's own header
        line, extracts transaction type, reference number, and memo alongside date, description, and amount,
        and reports exactly how many rows were skipped and why if anything doesn't parse cleanly.
      </QuickSummary>

      <ArticleH2>What's Inside an IIF File</ArticleH2>
      <ArticleTable
        headers={["Line", "What It Contains"]}
        rows={[
          ["TRNS", "The transaction itself — date, amount, account, and description"],
          ["SPL", "The offsetting split line completing the double-entry structure"],
          ["ENDTRNS", "A marker closing the record"],
        ]}
      />

      <ArticleH2>Real Parsing Issues This Handles</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Field order can change mid-file", body: "a real QuickBooks export can redefine column order once per account section — treating the whole file as one fixed layout silently misreads later sections." },
          { lead: "Missing dates or amounts", body: "rows that can't be parsed are skipped and reported, not guessed at or silently dropped." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <RelatedArticles
        articles={[
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "Convert a plain CSV into a QuickBooks Desktop-ready IIF file." },
          { href: "/qif-to-csv", title: "QIF to CSV Converter", blurb: "Same idea for a Quicken export." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/csv-to-iif", label: "CSV to IIF" }, { href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
