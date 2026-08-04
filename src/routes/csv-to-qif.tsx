import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToQif } from "@/lib/export/to-qif";
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
  return fileName.replace(/\.[^.]+$/, "") + ".qif";
}

const FAQ = [
  { q: "Why QIF instead of QFX or OFX for Quicken?", a: "QIF is the only one of the three that carries categories, subcategories, and split transactions — QFX and OFX don't include category data at all. That said, a plain bank statement or CSV usually doesn't have category data to begin with, so this converter outputs QIF without categories unless your source CSV already has one." },
  { q: "What software reads QIF files?", a: "Quicken (Windows and Mac), Banktivity, MYOB, YNAB, GnuCash, and many older or lightweight accounting tools." },
  { q: "How do I import the QIF file into Quicken?", a: "File > File Import > QIF File in Quicken, then select the file and choose the account to import into. On Quicken Mac specifically, QIF import creates a new account rather than adding to an existing one." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/csv-to-qif")({
  head: () => ({
    meta: [
      { title: "Free CSV to QIF Converter for Quicken — LedgerLocal" },
      { name: "description", content: "Free CSV to QIF converter for Quicken import. Auto-detects your CSV's columns, runs entirely in your browser." },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("CSV", "QIF");
  const jsonLd = converterPageJsonLd({
    name: "Free CSV to QIF Converter for Quicken",
    description: "Convert CSV files to QIF in your browser.",
    url: "/csv-to-qif",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free CSV to QIF Converter for Quicken"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a CSV to QIF" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".csv"
          sourceLabel="CSV"
          targetLabel="QIF"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseCsvText(content);
            const transactions = csvResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToQif(transactions, outputName(file.name));
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <StatementFunnel sourceFormat="CSV" targetFormat="QIF" />

      <ArticleH2>How to convert CSV to QIF in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          QIF is one of the oldest personal-finance file formats still in active use — a plain-text, line-based
          structure where each transaction is a short run of prefixed lines ending in a bare "^". Quicken still
          imports it directly, and it's the only one of Quicken's three import formats (QIF, QFX, OFX) that
          actually preserves categories and split transactions.
        </p>
      </ArticleProse>

      <QuickSummary>
        Getting a bank statement into Quicken without losing your categories, or retyping them back in
        afterward, is the real reason to pick QIF over the alternatives. QIF beats QFX and OFX for one real
        reason: it's the only format that carries category and split data into Quicken. This converter reads
        any CSV with a date, description, and amount column, handles Quicken's real apostrophe-year date
        shorthand (1/15'26), and outputs a clean QIF file — without inventing categories a plain bank CSV
        never had to begin with.
      </QuickSummary>

      <ArticleH2>What's Inside a QIF File</ArticleH2>
      <ArticleTable
        headers={["Field code", "What It Contains"]}
        rows={[
          ["D", "Transaction date"],
          ["T", "Amount"],
          ["P", "Payee"],
          ["M", "Memo"],
          ["^", "End-of-record marker"],
        ]}
      />

      <ArticleH2>What This Converter Doesn't Do</ArticleH2>
      <LimitsList
        limits={[
          { lead: "No invented categories", body: "a plain bank CSV never had category data, so none gets added — if your source CSV already has a category column, that's a different case, but this tool focuses on the common plain-export scenario." },
          { lead: "Quicken Mac import quirk", body: "QIF import on Quicken Mac creates a new account rather than adding to an existing one — a real platform limitation, not something a converter can work around." },
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
          { href: "/qif-to-csv", title: "QIF to CSV Converter", blurb: "Convert a Quicken export back to plain CSV." },
          { href: "/qfx-to-csv", title: "QFX to CSV Converter", blurb: "For when your Quicken version is too old to accept QFX anymore." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <StickyStatementBar />
      <ToolCrossLinks links={[{ href: "/qif-to-csv", label: "QIF to CSV" }, { href: "/qif-to-qbo", label: "QIF to QBO" }, { href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
