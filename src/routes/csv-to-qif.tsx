import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToQif } from "@/lib/export/to-qif";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".qif";
}

const FAQ = [
  {
    q: "What software reads QIF files?",
    a: "Quicken, and many older or lightweight accounting tools that still support the format. It's a simple, plain-text, line-based structure — one of the older personal finance file formats still in wide use.",
  },
  {
    q: "What kind of CSV works?",
    a: "Any CSV with a date, a description, and an amount column. Headers are detected automatically — no fixed template to match.",
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
