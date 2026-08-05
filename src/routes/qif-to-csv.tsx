import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqList } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolChips, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseQifText, qifResultToTransactions } from "@/lib/qif/parse-qif";
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
  { q: "Where do I get a QIF file to convert?", a: "QIF is a Quicken export format — you'd have one from Quicken itself, or from another finance tool that supports exporting to QIF (Banktivity, MYOB, GnuCash, and others)." },
  { q: "What information does it extract?", a: "Date, payee, amount, and memo from each transaction record." },
  { q: "My QIF file has dates like 1/15'26 — will that parse correctly?", a: "Yes. That apostrophe-year notation (Quicken's own shorthand for 2000s dates) is handled directly, alongside the more common slash-separated formats — tested against real QIF exports, not assumed." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/qif-to-csv")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/qif-to-csv` }],
    meta: [
      { title: "Free QIF to CSV Converter — BalanceExtract" },
      { name: "description", content: "Convert a Quicken QIF file to CSV or Excel. Free, no page limit, and the conversion runs entirely in your browser — nothing is uploaded." },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("QIF", "CSV");
  const jsonLd = converterPageJsonLd({
    name: "Free QIF to CSV Converter",
    description: "Convert QIF files to CSV in your browser.",
    url: "/qif-to-csv",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs trail={[{ label: "Format converters", href: "/blog" }, { label: "Free QIF to CSV Converter" }]} />
      <ToolHero
        formatLabel="Format converter"
        title="Free QIF to CSV Converter: Reading Quicken's Export Format"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a QIF file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qif"
          sourceLabel="QIF"
          targetLabel="CSV"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseQifText(content);
            const transactions = qifResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), null);
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <ToolChips />

      <StatementFunnel sourceFormat="QIF" targetFormat="CSV" />

      <ArticleH2>How to convert QIF to CSV in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          QIF is a plain-text, line-based format where each transaction is a short run of prefixed lines. This
          guide covers what's actually in the file and a real date-format quirk worth knowing about before it
          silently breaks a naive parser.
        </p>
      </ArticleProse>

      <QuickSummary>
        Auditing old Quicken records or moving them into a spreadsheet without retyping every line means
        reading the QIF file's own real quirks correctly first. QIF files use single-letter field codes (D
        for date, T for amount, P for payee, M for memo) with each record ending in a bare "^". A real
        quirk: Quicken's own apostrophe-year date shorthand (1/15'26) trips up parsers that only expect
        slash-separated dates — this converter handles both.
      </QuickSummary>

      <ArticleH2>What's Inside a QIF File</ArticleH2>
      <ArticleTable
        headers={["Field code", "What It Contains"]}
        rows={[
          ["D", "Transaction date — including the apostrophe-year shorthand (1/15'26)"],
          ["T", "Amount"],
          ["P", "Payee"],
          ["M", "Memo"],
        ]}
      />

      <ArticleH2>A Real Parsing Quirk This Handles</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Apostrophe-year dates", body: "Quicken's own shorthand for 2000s dates (1/15'26 meaning January 15, 2026) isn't a standard slash-separated format, and a parser that only expects the common style will misread or reject these rows." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <RelatedArticles
        articles={[
          { href: "/csv-to-qif", title: "CSV to QIF Converter", blurb: "Convert a plain CSV into a Quicken-ready QIF file." },
          { href: "/qfx-to-csv", title: "QFX to CSV Converter", blurb: "For when your Quicken version is too old to accept QFX anymore." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/qif-to-qbo", label: "QIF to QBO" }, { href: "/csv-to-qif", label: "CSV to QIF" }, { href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
