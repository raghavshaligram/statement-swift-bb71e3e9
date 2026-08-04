import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
import { exportToQbo } from "@/lib/export/to-qbo";
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
  return fileName.replace(/\.[^.]+$/, "") + ".qbo";
}

const FAQ = [
  {
    q: "Will importing this into QuickBooks create duplicate transactions?",
    a: "No. Every row keeps its FITID — the unique transaction ID banks put in the file — in the Transaction ID column. QuickBooks uses it to recognise transactions it has already seen, so re-importing an overlapping date range won't double up your books.",
  },
  {
    q: "My file has more than one account in it. What happens?",
    a: "Each account is kept separate. Bank downloads often bundle a current account and a credit card into one file, each as its own statement section. Every transaction is tagged with its account number and type, and an Excel export puts each account on its own sheet instead of interleaving them.",
  },
  {
    q: "Why do the dates in other converters come out with [0:GMT] on the end?",
    a: "Because that's how the raw field is written — banks append a timezone offset to the timestamp. Only the date portion is meaningful for bookkeeping, so it's stripped here and you get a clean date.",
  },
  {
    q: "What's the difference between QBO, OFX and QFX files?",
    a: "They are the same underlying format with different extensions and headers. QBO is QuickBooks' Web Connect flavour, QFX is Quicken's, and OFX is the open standard both are built on. One reader handles all three, so this converter accepts any of them regardless of which one the page is named after.",
  },
  {
    q: "Do negative amounts mean what I expect?",
    a: "Yes. Money leaving the account is negative, money arriving is positive, and each row also carries an explicit Dr/Cr marker derived from that sign. Credit-card files follow the same convention from the bank's point of view, so a purchase is negative and a payment towards the card is positive.",
  },
  {
    q: "Is my financial data uploaded anywhere?",
    a: "No. The conversion runs in your browser using JavaScript — the file is never sent to a server. You can confirm it by opening your browser's Network tab while converting, or by disconnecting from the internet after the page loads and converting anyway.",
  },
  {
    q: "What columns do I get?",
    a: "Date, Payee, Description, Category, Transaction ID, Amount and Dr/Cr, plus Account when the file contains more than one. Payee and Category are derived on your device from the description — nothing is sent anywhere to work them out.",
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
  const steps = converterSteps("QFX", "QBO");
  const jsonLd = converterPageJsonLd({
    name: "Free QFX to QBO Converter",
    description: "Convert a Quicken QFX file into a QuickBooks-ready QBO file. Free, runs entirely in your browser — nothing uploaded.",
    url: "/qfx-to-qbo",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free QFX to QBO Converter"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a QFX file to QBO" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qfx,.ofx"
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

      <StatementFunnel sourceFormat="QFX" targetFormat="QBO" />

      <ArticleH2>How to convert QFX to QBO in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

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

      <StickyStatementBar />
      <ToolCrossLinks links={[{ href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/ofx-to-csv", label: "OFX to CSV" }, { href: "/qfx-to-csv", label: "QFX to CSV" }, { href: "/ofx-to-qbo", label: "OFX to QBO" }, { href: "/csv-to-qbo", label: "CSV to QBO" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
