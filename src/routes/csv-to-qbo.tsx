import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToQbo } from "@/lib/export/to-qbo";
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
  return fileName.replace(/\.[^.]+$/, "") + ".qbo";
}

const FAQ = [
  {
    q: "Why would I need to convert a CSV to QBO?",
    a: "QuickBooks Online treats a QBO import as a real transaction feed — matched and categorized automatically, the way a live bank connection would be — rather than an inert list of rows the way a raw CSV import often lands.",
  },
  {
    q: "What kind of CSV works?",
    a: "Any CSV with a date, a description, and an amount column — a bank export, an accounting tool's export, or your own spreadsheet. Headers are detected automatically; there's no fixed template to match.",
  },
  {
    q: "How do I import the QBO file into QuickBooks?",
    a: "Banking, then Upload from file (or Bank Feeds' Import option in QuickBooks Desktop), then select the QBO file this tool downloaded.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/csv-to-qbo")({
  head: () => ({
    meta: [
      { title: "Free CSV to QBO Converter — LedgerLocal" },
      {
        name: "description",
        content: "Convert any CSV to a QuickBooks-ready QBO file. Free, runs entirely in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Free CSV to QBO Converter — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("CSV", "QBO");
  const jsonLd = converterPageJsonLd({
    name: "Free CSV to QBO Converter",
    description: "Convert any CSV to a QuickBooks-ready QBO file. Free, runs entirely in your browser — nothing uploaded.",
    url: "/csv-to-qbo",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free CSV to QBO Converter"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a CSV to QBO" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".csv"
          sourceLabel="CSV"
          targetLabel="QBO"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseCsvText(content);
            const transactions = csvResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToQbo(transactions, outputName(file.name));
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <StatementFunnel sourceFormat="CSV" targetFormat="QBO" />

      <ArticleH2>How to convert CSV to QBO in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          Getting a CSV to actually reconcile itself against a bank feed in QuickBooks, instead of landing as
          rows you have to categorize by hand, means turning it into QBO first. This guide covers what's inside
          the file this tool produces.
        </p>
      </ArticleProse>

      <QuickSummary>
        QBO is QuickBooks' own Web Connect format, built on the same underlying structure as OFX. This
        converter reads any CSV with a date, description, and amount column, and builds a standard QBO
        transaction file QuickBooks Online and Desktop both accept as a real bank feed.
      </QuickSummary>

      <ArticleH2>What's Inside the QBO Export</ArticleH2>
      <ArticleTable
        headers={["Field", "What It Contains"]}
        rows={[
          ["DTPOSTED", "Transaction date"],
          ["TRNAMT", "Signed amount"],
          ["NAME", "Payee or description"],
          ["FITID", "A unique transaction ID, used by QuickBooks to avoid duplicate imports"],
        ]}
      />

      <ArticleH2>QBO vs. IIF for QuickBooks</ArticleH2>
      <LimitsList
        limits={[
          { lead: "QBO works for both Desktop and Online", body: "IIF is QuickBooks Desktop-only; QBO imports as a bank feed on either." },
          { lead: "QBO matches and categorizes automatically", body: "the way a live bank connection would, unlike IIF's simpler transaction-only entries." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <RelatedArticles
        articles={[
          { href: "/qbo-to-csv", title: "QBO to CSV Converter", blurb: "Convert a QuickBooks QBO export back to plain CSV." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop's other native import format." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/ofx-to-csv", label: "OFX to CSV" }, { href: "/qfx-to-csv", label: "QFX to CSV" }, { href: "/qfx-to-qbo", label: "QFX to QBO" }, { href: "/ofx-to-qbo", label: "OFX to QBO" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
