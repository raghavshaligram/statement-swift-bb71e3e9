import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { LedgerBookArt } from "@/components/format-art";
import { parseCsvText, csvResultToTransactions } from "@/lib/csv/parse-csv";
import { exportToIif } from "@/lib/export/to-iif";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".iif";
}

const FAQ = [
  {
    q: "Why can't I just import a CSV directly into QuickBooks Desktop?",
    a: "Because it can't — QuickBooks Desktop has no built-in CSV or Excel import for transactions at all (confirmed directly on Intuit's own support community). IIF has been the standard workaround for this for years, which is exactly what this converts to.",
  },
  {
    q: "What kind of CSV works?",
    a: "Any CSV with a date, a description, and an amount column — a bank export, an accounting tool's export, or your own spreadsheet. Headers are detected automatically (Date, Particulars, Debit/Credit, Withdrawals/Deposits, and similar variants all work); there's no fixed template to match.",
  },
  {
    q: "What does the IIF file look like when I import it into QuickBooks Desktop?",
    a: "A standard TRNS/SPL/ENDTRNS transaction block per row, offset against an Uncategorized Income or Expense account depending on whether it's a credit or debit — the same shape a real bank-to-IIF export produces. You'll assign real accounts inside QuickBooks after import, same as any bank feed.",
  },
  {
    q: "Does it assign categories or vendor names to each transaction?",
    a: "No — a bank statement or plain CSV doesn't carry that information to begin with, so there's nothing to map it from. You'll categorize inside QuickBooks after import, the same as reviewing a bank feed. If your CSV already has a category column, that's a manual mapping step some paid tools offer; this one focuses on the common case of a plain bank export.",
  },
  {
    q: "How do I import the IIF file into QuickBooks Desktop?",
    a: "File > Utilities > Import > IIF Files, then select the file this tool downloaded. QuickBooks Desktop reads it directly — no other steps needed.",
  },
  {
    q: "Will this work with QuickBooks Online?",
    a: "No — IIF is specifically a QuickBooks Desktop format. QuickBooks Online doesn't import IIF at all; use our CSV to OFX or QBO converter instead for QuickBooks Online.",
  },
  {
    q: "Does IIF stop working after a few years, like QBO does?",
    a: "No, and that's a real reason to prefer it — QuickBooks' own QBO (Web Connect) format stops importing once it's about three years old, requiring an upgrade. IIF has no such expiry.",
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
      { title: "CSV to IIF Converter for QuickBooks Desktop — Free — LedgerLocal" },
      {
        name: "description",
        content: "Free CSV to IIF converter for QuickBooks Desktop import. Auto-detects your CSV's columns — no template required. Nothing uploaded, runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="CSV to IIF Converter for QuickBooks Desktop"
      intro="Convert any CSV file to IIF for QuickBooks Desktop import — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      illustration={<LedgerBookArt titleText="A CSV converting into a QuickBooks IIF ledger" className="w-full h-full" />}
      whatIs={{
        heading: "What is an IIF file?",
        body: "IIF (Intuit Interchange Format) is QuickBooks Desktop's native tab-delimited format for importing and exporting transactions, accounts, and other lists. QuickBooks Desktop has no built-in way to import a CSV or Excel file of transactions directly — Intuit's own support community confirms this isn't a missing setting, it just doesn't exist. IIF has been the standard workaround for years: each transaction becomes a TRNS/SPL/ENDTRNS block — one line for the transaction itself, one offsetting line against an account, and a marker for where the record ends.",
      }}
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
