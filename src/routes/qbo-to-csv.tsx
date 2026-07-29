import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { InlineConverter } from "@/components/inline-converter";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";
import {
  ArticleBackLink,
  ArticleHero,
  QuickSummary,
  ArticleProse,
  ArticleH2,
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
    q: "What is a QBO file?",
    a: "QBO is QuickBooks' Web Connect download format — the file your bank gives you when you choose \"Download for QuickBooks\" from online banking. It's built on the same underlying Open Financial Exchange (OFX) structure as OFX and QFX files, just with QuickBooks-specific headers.",
  },
  {
    q: "Why would I need to convert QBO to CSV instead of just importing it into QuickBooks?",
    a: "Reviewing the data yourself before it hits your books, auditing an old export, or handing the numbers to someone without QuickBooks access are the common reasons. QBO is built for automated import, not eyeballing.",
  },
  {
    q: "Where do I get a QBO file to convert?",
    a: "Most banks offer a \"Download for QuickBooks\" or \"Web Connect\" export option from online banking. That download is the QBO file.",
  },
  {
    q: "What information does it extract?",
    a: "Date, description, amount, transaction ID, and transaction type from each record — the same real fields OFX and QFX files carry, since QBO shares their structure.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/qbo-to-csv")({
  head: () => ({
    meta: [
      { title: "Free QBO to CSV Converter — LedgerLocal" },
      {
        name: "description",
        content: "Convert a QuickBooks QBO (Web Connect) file to CSV or Excel. Free, runs entirely in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Free QBO to CSV Converter — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero eyebrow="Format converter" title="Free QBO to CSV Converter" publishedDate="July 2026" />

      <ConverterEmbed heading="Convert a QBO file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qbo"
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
          { href: "/csv-to-qbo", title: "CSV to QBO Converter", blurb: "Convert a plain CSV into a QuickBooks-ready QBO file." },
          { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "The bank-neutral version of this same underlying format." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop's other native import format." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
