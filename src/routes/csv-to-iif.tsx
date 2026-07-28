import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToIif } from "@/lib/export/to-iif";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".iif";
}

const FAQ = [
  {
    q: "What kind of CSV works?",
    a: "Any CSV with a date, a description, and an amount column — a bank export, an accounting tool's export, or your own spreadsheet. Headers are detected automatically (Date, Particulars, Debit/Credit, Withdrawals/Deposits, and similar variants all work); there's no fixed template to match.",
  },
  {
    q: "What does the IIF file look like when I import it into QuickBooks Desktop?",
    a: "A standard TRNS/SPL/ENDTRNS transaction block per row, offset against an Uncategorized Income or Expense account depending on whether it's a credit or debit — the same shape a real bank-to-IIF export produces. You'll assign real accounts inside QuickBooks after import, same as any bank feed.",
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

export const Route = createFileRoute("/csv-to-iif")({
  head: () => ({
    meta: [
      { title: "CSV to IIF Converter — Free, On-Device — LedgerLocal" },
      {
        name: "description",
        content: "Convert any CSV to IIF for QuickBooks Desktop import. Free, unlimited, nothing uploaded — runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="CSV to IIF Converter"
      intro="Convert any CSV file to IIF for QuickBooks Desktop import — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      steps={[
        "Drop your CSV file — headers are detected automatically, whatever the source.",
        "LedgerLocal reads the date, description, and amount columns and builds a standard IIF transaction structure.",
        "Export the .iif file and import it into QuickBooks Desktop.",
      ]}
      ctaLabel="Convert a CSV to IIF"
      faq={FAQ}
      accept=".csv"
      onConvert={async (file) => {
        const content = await file.text();
        const result = parseCsvText(content);
        const transactions = csvResultToTransactions(result, file.name);
        if (transactions.length > 0) exportToIif(transactions, outputName(file.name));
        return { count: transactions.length, warnings: result.warnings };
      }}
    />
  ),
});
