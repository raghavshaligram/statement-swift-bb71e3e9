import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { InlineConverter } from "@/components/inline-converter";
import { parseQifText, qifResultToTransactions } from "@/lib/qif/parse-qif";
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
  { q: "Where do I get a QIF file to convert?", a: "QIF is a Quicken export format — you'd have one from Quicken itself, or from another finance tool that supports exporting to QIF (Banktivity, MYOB, GnuCash, and others)." },
  { q: "What information does it extract?", a: "Date, payee, amount, and memo from each transaction record." },
  { q: "My QIF file has dates like 1/15'26 — will that parse correctly?", a: "Yes. That apostrophe-year notation (Quicken's own shorthand for 2000s dates) is handled directly, alongside the more common slash-separated formats — tested against real QIF exports, not assumed." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/qif-to-csv")({
  head: () => ({
    meta: [
      { title: "Free QIF to CSV Converter — LedgerLocal" },
      { name: "description", content: "Convert a Quicken QIF file to CSV. Free, unlimited, runs entirely in your browser." },
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
      <ArticleHero eyebrow="Format converter" title="Free QIF to CSV Converter: Reading Quicken's Export Format" publishedDate="July 2026" />

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
          { href: "/csv-to-qif", title: "CSV to QIF Converter", blurb: "Convert a plain CSV into a Quicken-ready QIF file." },
          { href: "/qfx-to-csv", title: "QFX to CSV Converter", blurb: "For when your Quicken version is too old to accept QFX anymore." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
