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
  LimitsList,
  ConverterEmbed,
  RelatedArticles,
} from "@/components/article-sections";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
}

const FAQ = [
  { q: "Why would I need to convert QFX to CSV instead of just importing it into Quicken?", a: "The most common reason: Quicken stops accepting QFX files once your Quicken version is about three years old, requiring an upgrade to keep importing them. Converting to CSV sidesteps that entirely — plain CSV never expires." },
  { q: "Where do I get a QFX file to convert?", a: "QFX is Quicken's own export format — you'd have one from Quicken, or from a bank's \"Download for Quicken\" export option." },
  { q: "Is QFX different from OFX?", a: "QFX is the same underlying Open Financial Exchange format with Quicken-specific headers — this reads both with the same parser." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/qfx-to-csv")({
  head: () => ({
    meta: [
      { title: "Free QFX to CSV Converter — LedgerLocal" },
      { name: "description", content: "Convert a QFX (Quicken) file to CSV before your Quicken version stops accepting it. Free, runs entirely in your browser." },
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
      <ArticleHero eyebrow="Format converter" title="Free QFX to CSV Converter: Why and How" publishedDate="July 2026" />

      <ConverterEmbed heading="Convert a QFX file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qfx"
          sourceLabel="QFX"
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
          QFX files have a real expiry problem most people only discover the hard way: Quicken stops accepting
          them once your Quicken version is about three years old. This guide covers why that happens and how
          converting to CSV sidesteps it entirely.
        </p>
      </ArticleProse>

      <QuickSummary>
        Quicken's own real behavior: QFX import stops working once your Quicken version is roughly three years
        old, forcing an upgrade. CSV has no such expiry and works with any spreadsheet or accounting tool, not
        just Quicken. This reads QFX (and plain OFX, the same underlying format) and converts to a clean CSV.
      </QuickSummary>

      <ArticleH2>Why QFX Files Stop Working</ArticleH2>
      <LimitsList
        limits={[
          { lead: "The real 3-year cutoff", body: "Quicken ties QFX import to your software version's age, not a setting you can change — once it's roughly three years old, QFX downloads simply stop being accepted." },
          { lead: "No such limit on CSV", body: "converting once and keeping a CSV copy means you're never stuck re-fighting this limit for historical data." },
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
          { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "The bank-neutral version of this same format." },
          { href: "/csv-to-qif", title: "CSV to QIF Converter", blurb: "QIF is the one Quicken format that also preserves categories." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
