import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { InlineConverter } from "@/components/inline-converter";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
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
    q: "Isn't OFX already something QuickBooks can read?",
    a: "Not directly in most cases — QuickBooks expects its own QBO-flavored header values. Converting to QBO first is the more reliable path for a clean import.",
  },
  {
    q: "Where do I get an OFX file to convert?",
    a: "OFX (Open Financial Exchange) is a standard export format many banks and finance tools support directly from online banking.",
  },
  {
    q: "Does this also work with QFX files?",
    a: "Yes — QFX is the same underlying format with Quicken-specific headers, and this reader handles both the same way.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/ofx-to-qbo")({
  head: () => ({
    meta: [
      { title: "Free OFX to QBO Converter — LedgerLocal" },
      {
        name: "description",
        content: "Convert a bank-neutral OFX file into a QuickBooks-ready QBO file. Free, runs entirely in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Free OFX to QBO Converter — LedgerLocal" },
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
      <ArticleHero eyebrow="Format converter" title="Free OFX to QBO Converter" publishedDate="July 2026" />

      <ConverterEmbed heading="Convert an OFX file to QBO" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".ofx,.qfx"
          sourceLabel="OFX"
          targetLabel="QBO"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseOfxText(content);
            const transactions = ofxResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToQbo(transactions, outputName(file.name));
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <ArticleProse>
        <p>
          OFX is a bank-neutral standard, but QuickBooks generally imports more reliably when the file carries
          its own QuickBooks-specific headers. This guide covers converting a plain OFX file into QBO.
        </p>
      </ArticleProse>

      <QuickSummary>
        OFX and QBO share the same underlying transaction structure — this converter reads either real-world
        OFX style (older SGML or newer XML) and writes a clean QBO file, ready to import as a real bank feed
        in QuickBooks Online or Desktop.
      </QuickSummary>

      <ArticleH2>What Carries Over From OFX to QBO</ArticleH2>
      <ArticleTable
        headers={["Field", "What Happens"]}
        rows={[
          ["Date, amount, payee", "Carried over directly — both formats use the same STMTTRN structure"],
          ["Transaction ID (FITID)", "Preserved, so QuickBooks can still detect duplicate imports"],
        ]}
      />

      <ArticleH2>A Real Reason to Make This Conversion</ArticleH2>
      <LimitsList
        limits={[
          { lead: "QuickBooks-specific headers matter", body: "a generic OFX file sometimes imports inconsistently; the QBO-flavored version is what QuickBooks itself expects." },
          { lead: "Also handles QFX", body: "the same underlying format with Quicken headers, read by the same parser." },
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
          { href: "/qbo-to-csv", title: "QBO to CSV Converter", blurb: "Convert a QuickBooks QBO file back to plain CSV." },
          { href: "/qfx-to-qbo", title: "QFX to QBO Converter", blurb: "Same idea, specifically from Quicken's export format." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
