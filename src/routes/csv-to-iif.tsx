import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToIif } from "@/lib/export/to-iif";
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
  return fileName.replace(/\.[^.]+$/, "") + ".iif";
}

const FAQ = [
  {
    q: "Why can't I just import a CSV directly into QuickBooks Desktop?",
    a: "Because it can't — QuickBooks Desktop has no built-in CSV or Excel import for transactions at all (confirmed directly on Intuit's own support community). IIF has been the standard workaround for this for years, which is exactly what this converts to.",
  },
  {
    q: "What kind of CSV works?",
    a: "Any CSV with a date, a description, and an amount column — a bank export, an accounting tool's export, or your own spreadsheet. Headers are detected automatically; there's no fixed template to match.",
  },
  {
    q: "Does it assign categories or vendor names to each transaction?",
    a: "No — a bank statement or plain CSV doesn't carry that information to begin with, so there's nothing to map it from. You'll categorize inside QuickBooks after import, the same as reviewing a bank feed.",
  },
  {
    q: "How do I import the IIF file into QuickBooks Desktop?",
    a: "File > Utilities > Import > IIF Files, then select the file this tool downloaded. QuickBooks Desktop reads it directly — no other steps needed.",
  },
  {
    q: "Will this work with QuickBooks Online?",
    a: "No — IIF is specifically a QuickBooks Desktop format. QuickBooks Online doesn't import IIF at all; use our CSV to OFX converter instead for QuickBooks Online.",
  },
  {
    q: "Does IIF stop working after a few years, like QBO does?",
    a: "No, and that's a real reason to prefer it — QuickBooks' own QBO (Web Connect) format stops importing once it's about three years old, requiring an upgrade. IIF has no such expiry.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/csv-to-iif")({
  head: () => ({
    meta: [
      { title: "Free CSV to IIF Converter for QuickBooks Desktop — LedgerLocal" },
      {
        name: "description",
        content: "QuickBooks Desktop has no native CSV import. Free CSV to IIF converter — auto-detects your columns, runs entirely in your browser.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("CSV", "IIF");
  const jsonLd = converterPageJsonLd({
    name: "Free CSV to IIF Converter for QuickBooks Desktop",
    description: "QuickBooks Desktop has no native CSV import. Free CSV to IIF converter — auto-detects your columns, runs entirely in your browser.",
    url: "/csv-to-iif",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free CSV to IIF Converter for QuickBooks Desktop"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a CSV to IIF" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".csv"
          sourceLabel="CSV"
          targetLabel="IIF"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseCsvText(content);
            const transactions = csvResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToIif(transactions, outputName(file.name));
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <StatementFunnel sourceFormat="CSV" targetFormat="IIF" />

      <ArticleH2>How to convert CSV to IIF in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          QuickBooks Desktop has no built-in way to import a CSV or Excel file of transactions — Intuit's own
          support community confirms this isn't a missing setting, it simply doesn't exist. IIF (Intuit
          Interchange Format) has been the standard workaround for years. This guide covers exactly what an IIF
          file looks like, what a converter can and can't reasonably do with it, and how to get your data in.
        </p>
      </ArticleProse>

      <QuickSummary>
        Closing the books in QuickBooks Desktop without hand-entering every transaction depends on getting
        past a real limitation: QuickBooks Desktop can't import CSV or Excel directly — IIF is the real path
        in. This tool reads any CSV with a date, description, and amount column, and builds a standard
        TRNS/SPL/ENDTRNS block per transaction. It won't invent categories or vendor names that weren't in
        your source file, and unlike QuickBooks' own QBO format, IIF never expires.
      </QuickSummary>

      <ArticleH2>What an IIF File Looks Like</ArticleH2>
      <ArticleProse>
        <p>Each transaction becomes a three-line block in the output file.</p>
      </ArticleProse>
      <ArticleTable
        headers={["Line", "What It Contains"]}
        rows={[
          ["TRNS", "The transaction itself — date, amount, and account, offset against Uncategorized Income or Expense"],
          ["SPL", "The offsetting split line, opposite sign, completing the double-entry structure IIF requires"],
          ["ENDTRNS", "A marker closing the record — nothing else follows until the next transaction"],
        ]}
      />

      <ArticleH2>What This Converter Doesn't Do</ArticleH2>
      <ArticleProse>
        <p>Worth being direct about, rather than letting you find out after importing:</p>
      </ArticleProse>
      <LimitsList
        limits={[
          { lead: "No categories or vendor matching", body: "a plain bank CSV doesn't carry that data, so there's nothing to map it from. You'll categorize inside QuickBooks after import, same as any bank feed." },
          { lead: "No account splits", body: "each transaction is a simple two-line entry (one account, one offset) — not a multi-line split transaction across several accounts." },
          { lead: "QuickBooks Online isn't supported by IIF at all", body: "this is a QuickBooks Desktop-only format; QuickBooks Online needs a different import path entirely." },
        ]}
      />

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

      <RelatedArticles
        articles={[
          { href: "/iif-to-csv", title: "IIF to CSV Converter", blurb: "Convert a QuickBooks Desktop export back to plain CSV." },
          { href: "/csv-to-ofx", title: "CSV to OFX Converter", blurb: "For QuickBooks Online and other accounting software." },
          { href: "/lloyds-bank-statement-to-csv", title: "Lloyds Bank Statement to CSV", blurb: "Get your CSV in the first place from a Lloyds PDF statement." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/iif-to-csv", label: "IIF to CSV" }, { href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
