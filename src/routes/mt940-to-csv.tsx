import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ComparisonLinks } from "@/components/comparison-links";
import { ToolHero, ToolCrossLinks } from "@/components/tool-hero";
import { converterPageJsonLd, converterSteps } from "@/components/converter-schema";
import { StatementFunnel, StickyStatementBar } from "@/components/statement-funnel";
import { InlineConverter } from "@/components/inline-converter";
import { parseMt940Text, mt940ResultToTransactions } from "@/lib/mt940/parse-mt940";
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
  { q: "What is an MT940 file?", a: "MT940 is SWIFT's international bank statement format — common outside the US/UK/India, used by many European and international banks for statement exports." },
  { q: "What information does it extract?", a: "Date, description (from the narrative line following each transaction), and amount, correctly signed for debits and credits." },
  { q: "My bank's narrative spans multiple lines per transaction — is that handled?", a: "Yes. A real MT940 narrative can wrap across several physical lines before the next transaction starts, and all of it gets combined into one clean description." },
  { q: "Is my data uploaded anywhere?", a: "No. The conversion runs entirely in your browser — nothing is sent to a server." },
];

export const Route = createFileRoute("/mt940-to-csv")({
  head: () => ({
    meta: [
      { title: "Free MT940 to CSV Converter — LedgerLocal" },
      { name: "description", content: "Convert an MT940 SWIFT bank statement file to CSV. Free, runs entirely in your browser." },
    ],
  }),
  component: Page,
});

function Page() {
  const steps = converterSteps("MT940", "CSV");
  const jsonLd = converterPageJsonLd({
    name: "Free MT940 to CSV Converter",
    description: "Convert MT940 files to CSV in your browser.",
    url: "/mt940-to-csv",
    steps,
    faq: FAQ,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ToolHero
        formatLabel="Format converter"
        title="Free MT940 to CSV Converter"
        subtitle="Runs entirely in your browser — your file is never uploaded to a server."
      />

      <ConverterEmbed heading="Convert an MT940 file to CSV" body="Drop your file below — runs entirely in your browser, nothing is uploaded.">
        <InlineConverter
          accept=".sta,.mt940,.940"
          sourceLabel="MT940"
          targetLabel="CSV"
          onConvert={async (file) => {
            const content = await file.text();
            const result = parseMt940Text(content);
            const transactions = mt940ResultToTransactions(result, file.name);
            if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), result.currency);
            return { count: transactions.length, warnings: result.warnings };
          }}
        />
      </ConverterEmbed>

      <StatementFunnel sourceFormat="MT940" targetFormat="CSV" />

      <ArticleH2>How to convert MT940 to CSV in 3 steps</ArticleH2>
      <NumberedSteps steps={steps} />

      <ArticleProse>
        <p>
          MT940 is SWIFT's international bank statement format, common outside the US, UK, and India. This guide
          covers what's inside the file and a real structural quirk — multi-line narratives — that trips up
          naive parsers.
        </p>
      </ArticleProse>

      <QuickSummary>
        Reconciling an international account without retyping every SWIFT statement line by hand means
        reading MT940's real structure correctly. Each MT940 transaction is a fixed-format statement line
        (tag :61:) paired with a narrative (tag :86:) that can span multiple physical lines before the next
        transaction starts. This converter combines the full narrative into one clean description rather
        than only capturing the first line — this direction only; converting CSV to MT940 isn't currently
        supported.
      </QuickSummary>

      <ArticleH2>What's Inside an MT940 File</ArticleH2>
      <ArticleTable
        headers={["Tag", "What It Contains"]}
        rows={[
          [":61:", "The statement line itself — date and signed amount"],
          [":86:", "The narrative describing the transaction, which can span multiple lines"],
          [":60F:", "Opening balance for the statement"],
          [":62F:", "Closing balance for the statement"],
        ]}
      />

      <ArticleH2>A Real Parsing Issue This Handles</ArticleH2>
      <LimitsList
        limits={[
          { lead: "Multi-line narratives", body: "a real narrative can wrap across several physical lines before the next :61: tag starts — only capturing the first line loses part of the real description." },
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
          { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "A more common bank-neutral exchange format." },
          { href: "/lloyds-bank-statement-to-csv", title: "Lloyds Bank Statement to CSV", blurb: "A UK-specific bank guide." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <StickyStatementBar />
      <ComparisonLinks />

      <ToolCrossLinks links={[{ href: "/qbo-to-csv", label: "QBO to CSV" }, { href: "/bank-statement-to-csv", label: "Bank Statement to CSV" }]} />

      <SiteFooter />
    </div>
  );
}
