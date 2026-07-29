import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { InlineConverter } from "@/components/inline-converter";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToQbo } from "@/lib/export/to-qbo";
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
      <ArticleHero eyebrow="Format converter" title="Free CSV to QBO Converter" publishedDate="July 2026" />

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
          { href: "/qbo-to-csv", title: "QBO to CSV Converter", blurb: "Convert a QuickBooks QBO export back to plain CSV." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop's other native import format." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
