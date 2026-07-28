import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { parseOfxText, ofxResultToTransactions } from "@/lib/ofx/parse-ofx";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
}

const FAQ = [
  {
    q: "Where do I get an OFX file to convert?",
    a: "OFX (Open Financial Exchange) is a standard export format many banks and finance tools support directly from online banking, or from software like Quicken or QuickBooks.",
  },
  {
    q: "Does this also work with QFX files?",
    a: "Yes — QFX is the same underlying format with Quicken-specific headers, and the same reader handles both.",
  },
  {
    q: "What information does it extract?",
    a: "Date, description, amount, transaction ID, and transaction type from each record. Handles both real-world OFX styles (older SGML-style files and newer XML-style files with closing tags).",
  },
  {
    q: "Does this cost anything?",
    a: "No. Structured file conversions like this are free and unlimited — there's no OCR involved, so there's no reason to gate it the way PDF/photo conversion is.",
  },
];

export const Route = createFileRoute("/ofx-to-csv")({
  head: () => ({
    meta: [
      { title: "OFX to CSV Converter — Free — LedgerLocal" },
      {
        name: "description",
        content: "Free OFX (or QFX) to CSV converter. No install, no script — drop your file and download a clean CSV. Nothing uploaded, runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="OFX to CSV Converter"
      intro="Convert an OFX (or QFX) file to a clean CSV — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      whatIs={{
        heading: "What is an OFX file?",
        body: "OFX (Open Financial Exchange) is a standard transaction-export format many banks and finance tools support directly from online banking, or from software like Quicken or QuickBooks. It's a tagged, structured format — real transaction data, not a formatted report — which is exactly why it converts cleanly to CSV rather than needing OCR or layout guessing the way a PDF statement would.",
      }}
      steps={[
        "Drop your .ofx or .qfx file.",
        "LedgerLocal reads each transaction record directly from the file's own structure.",
        "Export a clean CSV file, ready for a spreadsheet or any other tool.",
      ]}
      ctaLabel="Convert an OFX file to CSV"
      faq={FAQ}
      accept=".ofx,.qfx"
      onConvert={async (file) => {
        const content = await file.text();
        const result = parseOfxText(content);
        const transactions = ofxResultToTransactions(result, file.name);
        if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), result.currency);
        return { count: transactions.length, warnings: result.warnings };
      }}
    />
  ),
});
