import { createFileRoute } from "@tanstack/react-router";
import { FormatGuide, type FormatGuideConfig } from "@/components/format-guide";

/**
 * The OFX-to-Excel cluster is smaller per term than QBO or QFX but broader:
 * "ofx to excel converter free", "ofx file to excel", "ofx to excel converter"
 * and "ofx to excel" together carry a few hundred searches a month, all at
 * keyword difficulty 0-5. LedgerLocal ranked for none of them.
 *
 * OFX is the bank-neutral case -- the open standard the other two are built
 * on -- so the copy here leans on that rather than on a vendor.
 */
const config: FormatGuideConfig = {
  source: "OFX",
  path: "/ofx-to-excel",
  title: "OFX to Excel: How to Open an OFX File in Excel",
  subtitle:
    "Excel can't read .ofx files natively. Here are three ways to get the data into a spreadsheet — one takes about ten seconds.",
  metaTitle: "OFX to Excel — Free Converter & Guide | LedgerLocal",
  metaDescription:
    "Excel can't open .ofx files. Convert Open Financial Exchange data to an Excel workbook in your browser — free, no signup, nothing uploaded.",
  origin:
    "An .ofx file is Open Financial Exchange data — the bank-neutral standard that Quicken's QFX and QuickBooks' QBO are both built on, and what most banks emit when the download isn't tied to one product.",
  intro:
    "You downloaded an .ofx file from your bank, tried to open it in Excel, and got either nothing or a screen of angle brackets. Nothing is broken. An OFX file is a financial data format, not a spreadsheet, and Excel has never shipped an importer for it.",
  faq: [
    {
      q: "Why won't Excel open my OFX file?",
      a: "An OFX file isn't a spreadsheet. Open Financial Exchange is a markup format for moving transactions between financial software, and older versions are SGML rather than XML. Excel has no importer for it, so double-clicking either does nothing or opens a wizard that can't parse the tags.",
    },
    {
      q: "Can I convert OFX to Excel for free?",
      a: "Yes. Drop the file into the converter on this page and download an .xlsx workbook. No signup and no upload — the conversion runs in your browser, so the file never leaves your device.",
    },
    {
      q: "Is there an OFX add-in for Excel?",
      a: "There are third-party add-ins, but they install into Excel and usually cost money, and several send your file to a service to do the parsing. Converting in the browser avoids both the install and the transmission.",
    },
    {
      q: "What's the difference between OFX, QFX and QBO?",
      a: "OFX is the open standard. QFX adds Quicken-specific headers, QBO adds QuickBooks ones. The transaction structure is identical in all three, which is why a single reader handles them and why this converter accepts any of them.",
    },
    {
      q: "Why are my dates showing as 20250601120000?",
      a: "That's the raw DTPOSTED field — a date, then a time, sometimes a timezone marker like [0:GMT]. Only the leading eight digits matter for bookkeeping, so this converter strips the rest.",
    },
    {
      q: "My file has two accounts in it. What happens?",
      a: "They're kept separate. Bank downloads often bundle several statements, each as its own section. Every transaction is tagged with its account, and the Excel export puts each account on its own sheet rather than interleaving two date sequences.",
    },
    {
      q: "What if my bank only gave me a PDF?",
      a: "Then you don't have an OFX file, and no format converter will help. You need a statement parser that reads the PDF's layout — see the PDF section on this page.",
    },
  ],
  crossLinks: [
    { href: "/ofx-to-csv", label: "OFX to CSV" },
    { href: "/ofx-to-qbo", label: "OFX to QBO" },
    { href: "/qfx-to-excel", label: "QFX to Excel" },
    { href: "/qbo-to-excel", label: "QBO to Excel" },
    { href: "/bank-statement-to-csv", label: "Bank statement to CSV" },
  ],
};

export const Route = createFileRoute("/ofx-to-excel")({
  head: () => ({
    meta: [
      { title: config.metaTitle },
      { name: "description", content: config.metaDescription },
      { property: "og:title", content: config.metaTitle },
    ],
  }),
  component: () => <FormatGuide config={config} />,
});
