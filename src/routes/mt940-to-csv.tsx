import { createFileRoute } from "@tanstack/react-router";
import { FormatConverterPage } from "@/components/format-converter-page";
import { SwiftGlobeArt } from "@/components/format-art";
import { parseMt940Text, mt940ResultToTransactions } from "@/lib/mt940/parse-mt940";
import { exportToCsv } from "@/lib/export/to-csv";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/export/types";

function outputName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".csv";
}

const FAQ = [
  {
    q: "What is an MT940 file?",
    a: "MT940 is SWIFT's international bank statement format — common outside the US/UK/India, used by many European and international banks for statement exports.",
  },
  {
    q: "What information does it extract?",
    a: "Date, description (from the narrative line following each transaction), and amount, correctly signed for debits and credits.",
  },
  {
    q: "My bank's narrative spans multiple lines per transaction — is that handled?",
    a: "Yes. A real MT940 narrative can wrap across several physical lines before the next transaction starts, and all of it gets combined into one clean description rather than only capturing the first line.",
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

export const Route = createFileRoute("/mt940-to-csv")({
  head: () => ({
    meta: [
      { title: "MT940 to CSV Converter — Free — LedgerLocal" },
      {
        name: "description",
        content: "Free MT940 (SWIFT) bank statement to CSV converter. Reads every transaction line and its narrative. Nothing uploaded, runs entirely in your browser.",
      },
    ],
  }),
  component: () => (
    <FormatConverterPage
      title="MT940 to CSV Converter"
      intro="Convert an MT940 (SWIFT) bank statement file to a clean CSV — free, unlimited, and entirely on your device."
      freeNote="Free and unlimited — no OCR involved, no page limits"
      illustration={<SwiftGlobeArt titleText="An MT940 file from SWIFT's international banking network" className="w-full h-full" />}
      whatIs={{
        heading: "What is an MT940 file?",
        body: "MT940 is SWIFT's international bank statement format — the standard many European and international banks use for statement exports, more common outside the US, UK, and India. Each transaction is a fixed-format \"statement line\" paired with a narrative describing it, which is exactly what this converter reads directly into a clean spreadsheet row.",
      }}
      steps={[
        "Drop your MT940 (.sta) file.",
        "LedgerLocal reads each statement line and its accompanying narrative directly from the file's own structure.",
        "Export a clean CSV file, ready for a spreadsheet or any other tool.",
      ]}
      ctaLabel="Convert an MT940 file to CSV"
      faq={FAQ}
      accept=".sta,.mt940,.940"
      onConvert={async (file) => {
        const content = await file.text();
        const result = parseMt940Text(content);
        const transactions = mt940ResultToTransactions(result, file.name);
        if (transactions.length > 0) exportToCsv(transactions, DEFAULT_EXPORT_OPTIONS, outputName(file.name), result.currency);
        return { count: transactions.length, warnings: result.warnings };
      }}
    />
  ),
});
