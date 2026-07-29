import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { InlineConverter } from "@/components/inline-converter";
import { parseIifText, iifResultToTransactions } from "@/lib/iif/parse-iif";
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
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero eyebrow="Format converter" title="Free IIF to CSV Converter: Reading QuickBooks Desktop's Export Format" publishedDate="July 2026" />

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

      <ArticleProse>
        <p>
          IIF (Intuit Interchange Format) is QuickBooks Desktop's own tab-delimited transaction format —
          straightforward for QuickBooks to read, considerably less so to open directly in a spreadsheet. This
          guide covers what's actually in an IIF file and how to get a clean CSV out of one.
        </p>
      </ArticleProse>

      <QuickSummary>
        IIF files are tab-delimited, but QuickBooks exports can redefine the column order partway through the
        file — once per account section — which breaks naive parsers that assume one fixed layout. This
        converter reads each section's own header line, extracts transaction type, reference number, and memo
        alongside date, description, and amount, and reports exactly how many rows were skipped and why if
        anything doesn't parse cleanly.
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
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "Convert a plain CSV into a QuickBooks Desktop-ready IIF file." },
          { href: "/qif-to-csv", title: "QIF to CSV Converter", blurb: "Same idea for a Quicken export." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
