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
    q: "Why convert QFX to QBO instead of just importing the QFX file somewhere?",
    a: "QFX is built for Quicken specifically. If your bookkeeping actually happens in QuickBooks, converting to QBO gets you a file QuickBooks treats as a real bank feed, rather than a format it doesn't recognize at all.",
  },
  {
    q: "Where do I get a QFX file to convert?",
    a: "QFX is Quicken's own export format — you'd have one from Quicken, or from a bank's \"Download for Quicken\" export option.",
  },
  {
    q: "Is QFX different from OFX or QBO?",
    a: "All three share the same underlying Open Financial Exchange structure — QFX adds Quicken-specific headers, QBO adds QuickBooks-specific ones. This tool reads the Quicken-flavored version and writes the QuickBooks-flavored version.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/qfx-to-qbo")({
  head: () => ({
    meta: [
      { title: "Free QFX to QBO Converter — LedgerLocal" },
      {
        name: "description",
        content: "Convert a Quicken QFX file into a QuickBooks-ready QBO file. Free, runs entirely in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Free QFX to QBO Converter — LedgerLocal" },
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
      <ArticleHero eyebrow="Format converter" title="Free QFX to QBO Converter" publishedDate="July 2026" />

      <ConverterEmbed heading="Convert a QFX file to QBO" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qfx"
          sourceLabel="QFX"
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
          A bank export meant for Quicken doesn't do anything for you if your actual books live in QuickBooks.
          This guide covers converting a QFX file directly into the QBO format QuickBooks expects.
        </p>
      </ArticleProse>

      <QuickSummary>
        QFX and QBO share the same underlying Open Financial Exchange structure — QFX carries Quicken-specific
        headers, QBO carries QuickBooks-specific ones. This tool reads either flavor and writes a clean QBO
        file, ready to import as a real bank feed in QuickBooks Online or Desktop.
      </QuickSummary>

      <ArticleH2>What Carries Over From QFX to QBO</ArticleH2>
      <ArticleTable
        headers={["Field", "What Happens"]}
        rows={[
          ["Date, amount, payee", "Carried over directly — both formats use the same STMTTRN structure"],
          ["Transaction ID (FITID)", "Preserved, so QuickBooks can still detect duplicate imports"],
          ["Quicken-specific headers", "Replaced with QuickBooks-specific ones on export"],
        ]}
      />

      <ArticleH2>A Real Reason to Make This Switch</ArticleH2>
      <LimitsList
        limits={[
          { lead: "QFX doesn't mean anything to QuickBooks", body: "importing a Quicken-formatted file directly usually fails or gets ignored — converting to QBO first is the real path in." },
          { lead: "QBO imports as a live-feed match", body: "QuickBooks categorizes and matches a QBO import automatically, the same way a real bank connection would." },
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
          { href: "/qif-to-qbo", title: "QIF to QBO Converter", blurb: "Same idea, from an older Quicken export format." },
          { href: "/qbo-to-csv", title: "QBO to CSV Converter", blurb: "Convert a QuickBooks QBO file back to plain CSV." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
