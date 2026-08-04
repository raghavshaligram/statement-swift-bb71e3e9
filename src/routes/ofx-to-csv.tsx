import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ToolHero } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";
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
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
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

export const Route = createFileRoute("/ofx-to-csv")({
  head: () => ({
    meta: [
      { title: "Free OFX to CSV Converter — LedgerLocal" },
      { name: "description", content: "Convert an OFX or QFX file to CSV. Free, runs entirely in your browser." },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("OFX", "CSV");
  const jsonLd = converterPageJsonLd({
    name: "Free OFX to CSV Converter",
    description: "Convert OFX files to CSV in your browser.",
    url: "/ofx-to-csv",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free OFX to CSV Converter"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert an OFX file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".ofx,.qfx,.qbo"
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

      <StatementFunnel sourceFormat="OFX" targetFormat="CSV" />

      <ArticleH2>How to convert OFX to CSV in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          OFX is built for automated reconciliation, not manual review — which is exactly why converting it to
          CSV is useful when you actually want to look at the data yourself, or hand it to someone who doesn't
          use accounting software.
        </p>
      </ArticleProse>

      <QuickSummary>
        Reviewing an OFX export yourself, or handing it to someone without accounting software, means
        turning it into a real spreadsheet first — this reader handles both real-world OFX styles — older
        SGML-style files and newer XML-style files with proper closing tags — and QFX files too, since QFX
        is the same underlying format with Quicken-specific headers.
      </QuickSummary>

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

      <StickyStatementBar />
      <SiteFooter />
    </div>
  );
}
