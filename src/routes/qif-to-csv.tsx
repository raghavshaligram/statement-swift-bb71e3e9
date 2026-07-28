import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { parseQifText, qifResultToTransactions } from "@/lib/qif/parse-qif";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
}

const FAQ = [
  {
    q: "Where do I get a QIF file to convert?",
    a: "QIF is a Quicken export format — you'd have one from Quicken itself, or from another finance tool that supports exporting to QIF.",
  },
  {
    q: "What information does it extract?",
    a: "Date, payee, amount, and memo from each transaction record.",
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

export const Route = createFileRoute("/qif-to-csv")({
  head: () => ({
    meta: [
      { title: "QIF to CSV Converter — Free — LedgerLocal" },
      {
        name: "description",
        content: "Free QIF to CSV converter for Quicken exports. Extracts date, payee, and amount from every record. Nothing uploaded, runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="QIF to CSV Converter"
      intro="Convert a Quicken QIF export to a clean CSV file — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      steps={[
        "Drop your .qif file.",
        "LedgerLocal reads each transaction record (date, payee, amount, memo) directly from the file.",
        "Export a clean CSV file, ready for a spreadsheet or any other tool.",
      ]}
      ctaLabel="Convert a QIF file to CSV"
      faq={FAQ}
      accept=".qif"
      onConvert={async (file) => {
        const content = await file.text();
        const result = parseQifText(content);
        const transactions = qifResultToTransactions(result, file.name);
        if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), null);
        return { count: transactions.length, warnings: result.warnings };
      }}
    />
  ),
});
