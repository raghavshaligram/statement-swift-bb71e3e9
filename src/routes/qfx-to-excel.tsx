import { createFileRoute } from "@tanstack/react-router";
import { FormatGuide, type FormatGuideConfig } from "@/components/format-guide";

/**
 * "qfx to excel converter online" is ~720 searches/month at keyword difficulty
 * 0, and the incumbent only ranks #12 for it -- the largest unclaimed term in
 * this cluster. BalanceExtract had no QFX-to-Excel page at all.
 *
 * Copy here is deliberately Quicken-specific rather than a find-and-replace of
 * the QBO page. Pages that say the same thing in the same words compete with
 * each other; the shared explanation lives in FormatGuide, the reason someone
 * has THIS file lives here.
 */
const config: FormatGuideConfig = {
  source: "QFX",
  path: "/qfx-to-excel",
  title: "QFX to Excel: How to Open a QFX File in Excel",
  subtitle:
    "Excel can't read .qfx files natively. Here are three ways to get Quicken Web Connect data into a spreadsheet — one takes about ten seconds.",
  metaTitle: "QFX to Excel — Free Converter & Guide | BalanceExtract",
  metaDescription:
    "Excel can't open .qfx files. Convert Quicken Web Connect data to an Excel workbook in your browser — free, no signup, nothing uploaded.",
  origin:
    "A .qfx file is Quicken's Web Connect download — the file your bank produces when you choose \"Download for Quicken\" from online banking.",
  intro:
    "You downloaded transactions for Quicken, double-clicked the .qfx file, and Excel either refused to open it or filled the screen with tags. Nothing is wrong with your file, and nothing is wrong with Excel: a QFX file simply isn't a spreadsheet, and Excel has never had an importer for it.",
  faq: [
    {
      q: "Why won't Excel open my QFX file?",
      a: "A QFX file isn't a spreadsheet. It's Quicken's Web Connect format, built on Open Financial Exchange — SGML-style markup rather than rows and columns. Excel has no importer for it, so double-clicking either does nothing or drops you into a wizard that can't make sense of the tags.",
    },
    {
      q: "Can I convert QFX to Excel for free?",
      a: "Yes. Drop the file into the converter on this page and download an .xlsx workbook. No signup, no upload — the conversion runs in your browser, so the file never leaves your device.",
    },
    {
      q: "Do I need Quicken installed to open a QFX file?",
      a: "No. QFX is just a text file with a Quicken-specific header. You can read it in any text editor, and the converter here reads it without Quicken being involved at all.",
    },
    {
      q: "What's the difference between QFX and OFX?",
      a: "QFX is OFX with Quicken's own header fields added — most visibly an INTU.BID identifying the bank to Quicken. The transaction structure underneath is identical, which is why one reader handles both.",
    },
    {
      q: "Why are my dates showing as 20250601120000?",
      a: "That's the raw DTPOSTED field — YYYYMMDD followed by a time and sometimes a timezone marker like [0:GMT]. Only the date portion matters for bookkeeping, so this converter strips the rest.",
    },
    {
      q: "My file has two accounts in it. What happens?",
      a: "They're kept separate. A bank download often bundles a current account and a credit card, each as its own statement section. Every transaction is tagged with its account, and the Excel export puts each account on its own sheet.",
    },
    {
      q: "What if my bank only gave me a PDF?",
      a: "Then you don't have a QFX file, and no format converter will help. You need a statement parser that reads the PDF's layout — see the PDF section on this page.",
    },
  ],
  crossLinks: [
    { href: "/qfx-to-csv", label: "QFX to CSV" },
    { href: "/qfx-to-qbo", label: "QFX to QBO" },
    { href: "/ofx-to-excel", label: "OFX to Excel" },
    { href: "/qbo-to-excel", label: "QBO to Excel" },
    { href: "/bank-statement-to-csv", label: "Bank statement to CSV" },
  ],
};

export const Route = createFileRoute("/qfx-to-excel")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
    ],
  }),
  component: () => <FormatGuide config={config} />,
});
