import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FeaturedArt } from "@/components/featured-art";
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
    q: "Where do I get an OFX file to convert?",
    a: "OFX (Open Financial Exchange) is a standard export format many banks and finance tools support directly from online banking, or from software like Quicken or QuickBooks.",
  },
  {
    q: "Does this also work with QFX files?",
    a: "Yes — QFX is the same underlying format with Quicken-specific headers, and the same reader handles both.",
  },
  {
    q: "What information does it extract?",
    a: "Date, description, amount, transaction ID, and transaction type from each record. Handles both real-world OFX styles (older SGML-style files and newer XML-style files with closing tags).",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/ofx-to-csv")({
  head: () => ({
    meta: [
      { title: "OFX to CSV Converter: Formats and Limits — LedgerLocal" },
      { name: "description", content: "Convert an OFX or QFX file to CSV. Free, runs entirely in your browser." },
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
      <ArticleHero
        eyebrow="Format converter"
        title="OFX to CSV Converter: Formats and Limits"
        publishedDate="July 2026"
        illustration={
          <FeaturedArt
            titleText="An OFX exchange file converting into a CSV"
            eyebrow="Format converter"
            sourceLabel="OFX"
            destinations={[{ label: "CSV", color: "#0e5a40" }]}
            className="w-full"
          />
        }
      />

      <ArticleProse>
        <p>
          OFX is built for automated reconciliation, not manual review — which is exactly why converting it to
          CSV is useful when you actually want to look at the data yourself, or hand it to someone who doesn't
          use accounting software.
        </p>
      </ArticleProse>

      <QuickSummary>
        This reader handles both real-world OFX styles — older SGML-style files and newer XML-style files with
        proper closing tags — and QFX files too, since QFX is the same underlying format with Quicken-specific
        headers.
      </QuickSummary>

      <ConverterEmbed heading="Convert an OFX file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".ofx,.qfx"
          sourceLabel="OFX"
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

      <ArticleH2>What's Inside an OFX File</ArticleH2>
      <ArticleTable
        headers={["Field", "What It Contains"]}
        rows={[
          ["DTPOSTED", "Transaction date"],
          ["TRNAMT", "Signed amount"],
          ["NAME", "Payee or description"],
          ["FITID", "A unique transaction ID"],
          ["TRNTYPE", "CREDIT or DEBIT"],
        ]}
      />

      <ArticleH2>Real Format Variations This Handles</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Two real OFX styles exist", body: "older SGML-style files never close their tags; newer XML-style files do. A parser built for only one style silently breaks on the other." },
          { lead: "QFX is the same format underneath", body: "Quicken-specific headers on top of standard OFX — this reader doesn't need a separate parser for it." },
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
          { href: "/csv-to-ofx", title: "CSV to OFX Converter", blurb: "Convert a plain CSV into the OFX format." },
          { href: "/qfx-to-csv", title: "QFX to CSV Converter", blurb: "For when your Quicken version is too old to accept QFX." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
