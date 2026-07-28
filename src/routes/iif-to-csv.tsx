import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { parseIifText, iifResultToTransactions } from "@/lib/iif/parse-iif";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
}

const FAQ = [
  {
    q: "Where do I get an IIF file to convert?",
    a: "IIF is QuickBooks Desktop's own export/import format — you'd have one if you or your accountant exported transactions from QuickBooks Desktop, or received one from a bank-to-QuickBooks integration.",
  },
  {
    q: "What if my IIF file has multiple accounts or a different column order?",
    a: "Handled. Real QuickBooks exports can redefine the field order partway through the file (e.g. once per account section) — LedgerLocal reads each section's own header line rather than assuming one fixed layout for the whole file.",
  },
  {
    q: "What if a row is missing a date or amount?",
    a: "It's skipped, and you're told exactly how many rows were skipped and why — never silently dropped or guessed at.",
  },
  {
    q: "Does this cost anything?",
    a: "No. Structured file conversions like this are free and unlimited — there's no OCR involved, so there's no reason to gate it the way PDF/photo conversion is.",
  },
];

export const Route = createFileRoute("/iif-to-csv")({
  head: () => ({
    meta: [
      { title: "IIF to CSV Converter — Free, On-Device — LedgerLocal" },
      {
        name: "description",
        content: "Convert a QuickBooks Desktop IIF file to CSV. Free, unlimited, nothing uploaded — runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="IIF to CSV Converter"
      intro="Convert a QuickBooks Desktop IIF export to a clean CSV file — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      whatIs={{
        heading: "What is an IIF file?",
        body: "IIF (Intuit Interchange Format) is QuickBooks Desktop's own tab-delimited format for importing and exporting transactions, accounts, and other lists. You'd have one from a QuickBooks Desktop export, or from an accountant or bank-integration tool that produced one for you.",
      }}
      steps={[
        "Drop your .iif file — LedgerLocal reads each transaction (TRNS) record, following the file's own column order even if it changes partway through.",
        "Transaction type, reference number, and memo are extracted alongside date, description, and amount.",
        "Export a clean CSV file, ready for a spreadsheet or any other tool.",
      ]}
      ctaLabel="Convert an IIF file to CSV"
      faq={FAQ}
      accept=".iif"
      onConvert={async (file) => {
        const content = await file.text();
        const result = parseIifText(content);
        const transactions = iifResultToTransactions(result, file.name);
        if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), null);
        return { count: transactions.length, warnings: result.warnings };
      }}
    />
  ),
});
