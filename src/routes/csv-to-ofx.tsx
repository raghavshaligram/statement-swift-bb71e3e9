import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { InlineConverter } from "@/components/inline-converter";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToOfx } from "@/lib/export/to-ofx";
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
  return fileName.replace(/\.[^.]+$/, "") + ".ofx";
}

const FAQ = [
  { q: "Why OFX instead of just importing the CSV directly?", a: "Most accounting software (QuickBooks, Xero, banking-side reconciliation tools) treats OFX as a real transaction feed, not just a spreadsheet — imported transactions get matched and categorized the way a live bank connection would." },
  { q: "What software imports OFX files?", a: "Most accounting and personal-finance software — QuickBooks, Quicken, and many banks' own import tools — accepts OFX as a standard transaction-import format." },
  { q: "What kind of CSV works?", a: "Any CSV with a date, a description, and an amount column. Headers are detected automatically." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/csv-to-ofx")({
  head: () => ({
    meta: [
      { title: "Free CSV to OFX Converter — LedgerLocal" },
      { name: "description", content: "Free CSV to OFX converter for QuickBooks or Quicken import. Runs entirely in your browser." },
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
      <ArticleHero eyebrow="Format converter" title="Free CSV to OFX Converter" publishedDate="July 2026" />

      <ConverterEmbed heading="Convert a CSV to OFX" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".csv"
          sourceLabel="CSV"
          targetLabel="OFX"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseCsvText(content);
            const transactions = csvResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToOfx(transactions, outputName(file.name));
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <ArticleProse>
        <p>
          OFX (Open Financial Exchange) is a bank-neutral, standardized transaction-import format that most
          accounting software treats as a live feed rather than a static file. This guide covers what's inside
          an OFX file and when it's genuinely the better choice over a plain CSV.
        </p>
      </ArticleProse>

      <QuickSummary>
        Getting a CSV to actually reconcile itself against a bank feed in QuickBooks or Xero, instead of
        landing as an inert list you have to categorize by hand, is what OFX is for. OFX is built for
        automated reconciliation, not eyeballing — accounting software matches and categorizes OFX imports
        the way it would a live bank connection. This converter reads any CSV with a date, description, and
        amount column, and builds a standard STMTTRN transaction list.
      </QuickSummary>

      <ArticleH2>What's Inside an OFX File</ArticleH2>
      <ArticleTable
        headers={["Field", "What It Contains"]}
        rows={[
          ["DTPOSTED", "Transaction date"],
          ["TRNAMT", "Signed amount"],
          ["NAME", "Payee or description"],
          ["FITID", "A unique transaction ID, used by accounting software to avoid duplicate imports"],
          ["TRNTYPE", "CREDIT or DEBIT"],
        ]}
      />

      <ArticleH2>When CSV Is the Better Choice Instead</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Manual review", body: "if you're eyeballing the data yourself rather than importing it into software, a spreadsheet is simpler than an OFX file's tagged structure." },
          { lead: "Sharing with someone without accounting software", body: "OFX means little to a person; CSV opens in anything." },
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
          { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "Convert an OFX or QFX file back to plain CSV." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop specifically." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
