import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { TaggedReceiptArt } from "@/components/format-art";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToQif } from "@/lib/export/to-qif";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".qif";
}

const FAQ = [
  {
    q: "Why QIF instead of QFX or OFX for Quicken?",
    a: "QIF is the only one of the three that carries categories, subcategories, and split transactions — QFX and OFX don't include category data at all, so Quicken has to re-categorize everything after import. That said, a plain bank statement or CSV usually doesn't have category data to begin with, so this converter outputs QIF without categories (D/T/P/M fields) unless your source CSV already has one — there's simply nothing to carry over from a bank export that never had it.",
  },
  {
    q: "What software reads QIF files?",
    a: "Quicken (Windows and Mac), Banktivity, MYOB, YNAB, GnuCash, and many older or lightweight accounting tools that still support the format. It's a simple, plain-text, line-based structure — one of the older personal finance file formats still in wide use.",
  },
  {
    q: "What kind of CSV works?",
    a: "Any CSV with a date, a description, and an amount column. Headers are detected automatically — no fixed template to match.",
  },
  {
    q: "How do I import the QIF file into Quicken?",
    a: "File > File Import > QIF File in Quicken, then select the file this tool downloaded and choose the account to import into. On Quicken Mac specifically, QIF import creates a new account rather than adding to an existing one — a real platform limitation, not something a converter can work around.",
  },
  {
    q: "Does this cost anything?",
    a: "No. Structured file conversions like this are free and unlimited — there's no OCR involved, so there's no reason to gate it the way PDF/photo conversion is.",
  },
  {
    q: "Is my data uploaded anywhere?",
    a: "No. The conversion runs entirely in your browser — nothing is sent to a server.",
  },
];

export const Route = createFileRoute("/csv-to-qif")({
  head: () => ({
    meta: [
      { title: "CSV to QIF Converter Free — On-Device — LedgerLocal" },
      {
        name: "description",
        content: "Free CSV to QIF converter for Quicken import. Auto-detects your CSV's columns — no template required. Nothing uploaded, runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="CSV to QIF Converter"
      intro="Convert any CSV file to QIF for Quicken import — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      illustration={<TaggedReceiptArt titleText="A CSV converting into a tagged Quicken QIF record" className="w-full h-full" />}
      whatIs={{
        heading: "What is a QIF file?",
        body: "QIF (Quicken Interchange Format) is one of the oldest personal-finance file formats still in active use — a plain-text, line-based structure where each transaction is a short run of prefixed lines (date, amount, payee, memo) ending in a bare \"^\". Quicken still imports it directly, and it remains a common lowest-common-denominator format that many older or lightweight finance tools can read even without native CSV support.",
      }}
      steps={[
        "Drop your CSV file — headers are detected automatically, whatever the source.",
        "LedgerLocal reads the date, description, and amount columns and builds a standard QIF bank-transaction structure.",
        "Export the .qif file and import it into Quicken or your accounting tool.",
      ]}
      ctaLabel="Convert a CSV to QIF"
      faq={FAQ}
      accept=".csv"
      onConvert={async (file) => {
        const content = await file.text();
        const result = parseCsvText(content);
        const transactions = csvResultToTransactions(result, file.name);
        if (transactions.length > 0) exportToQif(transactions, outputName(file.name));
        return { count: transactions.length, warnings: result.warnings };
      }}
    />
  ),
});
