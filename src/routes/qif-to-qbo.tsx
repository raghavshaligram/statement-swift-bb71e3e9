import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolHero } from "@/components/tool-hero";
import { InlineConverter } from "@/components/inline-converter";
import { parseQifText, qifResultToTransactions } from "@/lib/qif/parse-qif";
import { exportToQbo } from "@/lib/export/to-qbo";
import {
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
    q: "Why convert QIF to QBO instead of just importing the QIF file into QuickBooks?",
    a: "QuickBooks doesn't read QIF at all — it's a Quicken format. Converting to QBO gets you a file QuickBooks treats as a real bank feed.",
  },
  {
    q: "Where do I get a QIF file to convert?",
    a: "QIF is a Quicken export format — you'd have one from Quicken itself, or from another finance tool that supports exporting to QIF.",
  },
  {
    q: "Does the category data in my QIF file carry over?",
    a: "No — QBO's transaction-feed structure doesn't carry QIF's category and split fields. You'll categorize inside QuickBooks after import, the same as reviewing any bank feed.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/qif-to-qbo")({
  head: () => ({
    meta: [
      { title: "Free QIF to QBO Converter — LedgerLocal" },
      {
        name: "description",
        content: "Convert a Quicken QIF file into a QuickBooks-ready QBO file. Free, runs entirely in your browser — nothing uploaded.",
      },
      { property: "og:title", content: "Free QIF to QBO Converter — LedgerLocal" },
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

      <ToolHero
        formatLabel="Format converter"
        title="Free QIF to QBO Converter"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a QIF file to QBO" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qif"
          sourceLabel="QIF"
          targetLabel="QBO"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseQifText(content);
            const transactions = qifResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToQbo(transactions, outputName(file.name));
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <ArticleProse>
        <p>
          An old Quicken export doesn't do anything for you if your books have moved to QuickBooks. This guide
          covers converting a QIF file directly into the QBO format QuickBooks actually accepts.
        </p>
      </ArticleProse>

      <QuickSummary>
        QuickBooks doesn't read QIF at all — it's a Quicken-specific format. This converter reads QIF's
        date/payee/amount/memo fields and builds a standard QBO transaction file, ready to import as a real
        bank feed in QuickBooks Online or Desktop.
      </QuickSummary>

      <ArticleH2>What Carries Over From QIF to QBO</ArticleH2>
      <ArticleTable
        headers={["QIF field", "What Happens in QBO"]}
        rows={[
          ["D (date), T (amount), P (payee)", "Mapped directly to QBO's DTPOSTED, TRNAMT, and NAME fields"],
          ["M (memo)", "Carried over as part of the transaction description"],
          ["Category and split data", "Not carried over — QBO's structure doesn't support it, so you'll categorize inside QuickBooks after import"],
        ]}
      />

      <ArticleH2>A Real Limitation Worth Knowing</ArticleH2>
      <LimitsList
        limits={[
          { lead: "No categories in the output", body: "if your QIF file has categorized transactions, that data doesn't have anywhere to go in QBO's format — it's a real structural difference, not a bug." },
          { lead: "QuickBooks genuinely can't read QIF", body: "so this conversion is the only real path if your bookkeeping has moved from Quicken to QuickBooks." },
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
          { href: "/qfx-to-qbo", title: "QFX to QBO Converter", blurb: "Same idea, from a newer Quicken export format." },
          { href: "/qbo-to-csv", title: "QBO to CSV Converter", blurb: "Convert a QuickBooks QBO file back to plain CSV." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
