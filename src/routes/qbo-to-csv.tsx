import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
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
  {
    q: "Will importing this into QuickBooks create duplicate transactions?",
    a: "No. Every row keeps its FITID — the unique transaction ID banks put in the file — in the Transaction ID column. QuickBooks uses it to recognise transactions it has already seen, so re-importing an overlapping date range won't double up your books.",
  },
  {
    q: "My file has more than one account in it. What happens?",
    a: "Each account is kept separate. Bank downloads often bundle a current account and a credit card into one file, each as its own statement section. Every transaction is tagged with its account number and type, and an Excel export puts each account on its own sheet instead of interleaving them.",
  },
  {
    q: "Why do the dates in other converters come out with [0:GMT] on the end?",
    a: "Because that's how the raw field is written — banks append a timezone offset to the timestamp. Only the date portion is meaningful for bookkeeping, so it's stripped here and you get a clean date.",
  },
  {
    q: "What's the difference between QBO, OFX and QFX files?",
    a: "They are the same underlying format with different extensions and headers. QBO is QuickBooks' Web Connect flavour, QFX is Quicken's, and OFX is the open standard both are built on. One reader handles all three, so this converter accepts any of them regardless of which one the page is named after.",
  },
  {
    q: "Do negative amounts mean what I expect?",
    a: "Yes. Money leaving the account is negative, money arriving is positive, and each row also carries an explicit Dr/Cr marker derived from that sign. Credit-card files follow the same convention from the bank's point of view, so a purchase is negative and a payment towards the card is positive.",
  },
  {
    q: "Is my financial data uploaded anywhere?",
    a: "No. The conversion runs in your browser using JavaScript — the file is never sent to a server. You can confirm it by opening your browser's Network tab while converting, or by disconnecting from the internet after the page loads and converting anyway.",
  },
  {
    q: "What columns do I get?",
    a: "Date, Payee, Description, Category, Transaction ID, Amount and Dr/Cr, plus Account when the file contains more than one. Payee and Category are derived on your device from the description — nothing is sent anywhere to work them out.",
  },
];

export const Route = createFileRoute("/qbo-to-csv")({
  head: () => ({
    meta: [
      { title: "Free QBO to CSV Converter — BalanceExtract" },
      {
        name: "description",
        content: "Convert a QuickBooks QBO (Web Connect) file to CSV or Excel. Free, runs entirely in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Free QBO to CSV Converter — BalanceExtract" },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("QBO", "CSV");
  const jsonLd = converterPageJsonLd({
    name: "Free QBO to CSV Converter",
    description: "Convert a QuickBooks QBO (Web Connect) file to CSV or Excel. Free, runs entirely in your browser — nothing uploaded.",
    url: "/qbo-to-csv",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free QBO to CSV Converter"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a QBO file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qbo,.ofx,.qfx"
          sourceLabel="QBO"
          targetLabel="CSV"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseOfxText(content);
            const transactions = ofxResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), result.currency);
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <StatementFunnel sourceFormat="QBO" targetFormat="CSV" />

      <ArticleH2>Export QBO to CSV free: how to convert QBO to CSV in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          Reviewing a QuickBooks Web Connect download yourself, auditing an old import, or sharing the numbers
          with someone who doesn't have QuickBooks access all mean turning the QBO file into a real spreadsheet
          first. This guide covers what's actually inside a QBO file and how the conversion works.
        </p>
      </ArticleProse>

      <QuickSummary>
        QBO is QuickBooks' own Web Connect download format, built on the same Open Financial Exchange (OFX)
        structure as OFX and QFX files — just with QuickBooks-specific headers. This converter reads QBO files
        directly and exports a clean CSV with date, description, amount, and transaction ID for every record.
      </QuickSummary>

      <ArticleH2>What's Inside a QBO File</ArticleH2>
      <ArticleTable
        headers={["Field", "What It Contains"]}
        rows={[
          ["DTPOSTED", "Transaction date"],
          ["TRNAMT", "Signed amount"],
          ["NAME", "Payee or description"],
          ["FITID", "A unique transaction ID, used by QuickBooks to avoid duplicate imports"],
          ["TRNTYPE", "CREDIT or DEBIT"],
        ]}
      />

      <ArticleH2>Why QBO Uses the Same Reader as OFX and QFX</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Same underlying format", body: "QBO, OFX, and QFX all share the same STMTTRN transaction structure — QuickBooks' Web Connect format just adds its own header values on top." },
          { lead: "One reader, three extensions", body: "rather than needing separate parsers for each, this handles all three file types directly." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <RelatedArticles
        articles={[
          { href: "/csv-to-qbo", title: "CSV to QBO Converter", blurb: "Convert a plain CSV into a QuickBooks-ready QBO file." },
          { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "The bank-neutral version of this same underlying format." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop's other native import format." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/ofx-to-csv", label: "OFX to CSV" }, { href: "/qfx-to-csv", label: "QFX to CSV" }, { href: "/qfx-to-qbo", label: "QFX to QBO" }, { href: "/ofx-to-qbo", label: "OFX to QBO" }, { href: "/qbo-to-excel", label: "QBO to Excel (full guide)" }, { href: "/csv-to-qbo", label: "CSV to QBO" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
