import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList } from "@/components/faq-list";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
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

export const Route = createFileRoute("/qfx-to-csv")({
  head: () => ({
    meta: [
      { title: "Free QFX to CSV Converter — BalanceExtract" },
      { name: "description", content: "Convert a QFX (Quicken) file to CSV before your Quicken version stops accepting it. Free, runs entirely in your browser." },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("QFX", "CSV");
  const jsonLd = converterPageJsonLd({
    name: "Free QFX to CSV Converter",
    description: "Convert QFX files to CSV in your browser.",
    url: "/qfx-to-csv",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free QFX to CSV Converter: Why and How"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert a QFX file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".qfx,.ofx"
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

      <StatementFunnel sourceFormat="QFX" targetFormat="CSV" />

      <ArticleH2>How to convert QFX to CSV in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          QFX files have a real expiry problem most people only discover the hard way: Quicken stops accepting
          them once your Quicken version is about three years old. This guide covers why that happens and how
          converting to CSV sidesteps it entirely.
        </p>
      </ArticleProse>

      <QuickSummary>
        Not being locked out of your own transaction history by software you no longer run is the real
        reason to convert QFX now rather than later. Quicken's own real behavior: QFX import stops working
        once your Quicken version is roughly three years old, forcing an upgrade. CSV has no such expiry and
        works with any spreadsheet or accounting tool, not just Quicken. This reads QFX (and plain OFX, the
        same underlying format) and converts to a clean CSV.
      </QuickSummary>

      <ArticleH2>Why QFX Files Stop Working</ArticleH2>
      <LimitsList
        limits={[
          { lead: "The real 3-year cutoff", body: "Quicken ties QFX import to your software version's age, not a setting you can change — once it's roughly three years old, QFX downloads simply stop being accepted." },
          { lead: "No such limit on CSV", body: "converting once and keeping a CSV copy means you're never stuck re-fighting this limit for historical data." },
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <FaqList items={FAQ} />

      <RelatedArticles
        articles={[
          { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "The bank-neutral version of this same format." },
          { href: "/csv-to-qif", title: "CSV to QIF Converter", blurb: "QIF is the one Quicken format that also preserves categories." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter BalanceExtract offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/qfx-to-excel", label: "QFX to Excel (full guide)" }, { href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/ofx-to-csv", label: "OFX to CSV" }, { href: "/qfx-to-qbo", label: "QFX to QBO" }, { href: "/ofx-to-qbo", label: "OFX to QBO" }, { href: "/csv-to-qbo", label: "CSV to QBO" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
