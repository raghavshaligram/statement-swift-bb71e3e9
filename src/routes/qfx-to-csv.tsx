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
    q: "Why would I need to convert QFX to CSV instead of just importing it into Quicken?",
    a: "The most common reason: Quicken stops accepting QFX files once your Quicken version is about three years old, requiring an upgrade to keep importing them. Converting to CSV sidesteps that entirely — plain CSV never expires, and works with any spreadsheet or accounting tool, not just Quicken.",
  },
  {
    q: "Where do I get a QFX file to convert?",
    a: "QFX is Quicken's own export format — you'd have one from Quicken, or from a bank's \"Download for Quicken\" export option.",
  },
  {
    q: "Is QFX different from OFX?",
    a: "QFX is the same underlying Open Financial Exchange format with Quicken-specific headers — LedgerLocal reads both with the same parser.",
  },
  {
    q: "What information does it extract?",
    a: "Date, description, amount, transaction ID, and transaction type from each record.",
  },
  {
    q: "Does this cost anything?",
    a: "No. Structured file conversions like this are free and unlimited — there's no OCR involved, so there's no reason to gate it the way PDF/photo conversion is.",
  },
];

export const Route = createFileRoute("/qfx-to-csv")({
  head: () => ({
    meta: [
      { title: "QFX to CSV Converter Free — LedgerLocal" },
      {
        name: "description",
        content: "Free QFX to CSV converter, works on Mac or Windows. Drop your Quicken export and download a clean CSV. Nothing uploaded, runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="QFX to CSV Converter"
      intro="Convert a QFX (Quicken) file to a clean CSV — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      whatIs={{
        heading: "What is a QFX file?",
        body: "QFX is Quicken's own export format — the same underlying Open Financial Exchange (OFX) structure with Quicken-specific headers added, usually downloaded via a bank's \"Download for Quicken\" option. Works the same whether you're on Mac or Windows, since this converter runs in your browser rather than depending on Quicken itself being installed.",
      }}
      steps={[
        "Drop your .qfx file.",
        "LedgerLocal reads each transaction record directly from the file's own structure.",
        "Export a clean CSV file, ready for a spreadsheet or any other tool.",
      ]}
      ctaLabel="Convert a QFX file to CSV"
      faq={FAQ}
      accept=".qfx"
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
