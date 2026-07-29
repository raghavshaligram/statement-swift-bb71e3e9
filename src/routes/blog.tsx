import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FeaturedArt } from "@/components/featured-art";

type Destination = { label: string; color: string };
type Post = { href: string; title: string; blurb: string; eyebrow: string; sourceLabel: string; destinations: Destination[] };

const EMERALD = "#0e5a40";
const BLUE = "#2563eb";

const BANK_GUIDES: Post[] = [
  {
    href: "/natwest-bank-statement-to-csv",
    title: "NatWest bank statement to CSV",
    blurb: "NatWest's own export, plus a converter for when you only have a PDF.",
    eyebrow: "Bank guide",
    sourceLabel: "PDF",
    destinations: [{ label: "CSV", color: EMERALD }, { label: "OFX", color: BLUE }],
  },
  {
    href: "/lloyds-bank-statement-to-csv",
    title: "Lloyds bank statement to CSV & Excel",
    blurb: "Lloyds' CSV export is capped at 12 months and 150 transactions — here's the rest.",
    eyebrow: "Bank guide",
    sourceLabel: "PDF",
    destinations: [{ label: "CSV", color: EMERALD }, { label: "XLSX", color: BLUE }],
  },
  {
    href: "/chase-bank-statement-to-excel",
    title: "Chase bank statement to Excel",
    blurb: "Chase's own export covers ~90 days — here's the rest, back to 7 years.",
    eyebrow: "Bank guide",
    sourceLabel: "PDF",
    destinations: [{ label: "XLSX", color: EMERALD }, { label: "CSV", color: BLUE }],
  },
  {
    href: "/icici-bank-statement-to-excel",
    title: "ICICI bank statement to Excel",
    blurb: "ICICI's own export works well — but older statements can incur a charge.",
    eyebrow: "Bank guide",
    sourceLabel: "PDF",
    destinations: [{ label: "XLSX", color: EMERALD }, { label: "CSV", color: BLUE }],
  },
];

const FORMAT_CONVERTERS: Post[] = [
  { href: "/csv-to-iif", title: "CSV to IIF Converter for QuickBooks Desktop", blurb: "Any CSV, auto-detected columns, straight to IIF.", eyebrow: "Format converter", sourceLabel: "CSV", destinations: [{ label: "IIF", color: EMERALD }] },
  { href: "/iif-to-csv", title: "IIF to CSV Converter", blurb: "A QuickBooks Desktop export, back to plain CSV.", eyebrow: "Format converter", sourceLabel: "IIF", destinations: [{ label: "CSV", color: EMERALD }] },
  { href: "/csv-to-qif", title: "CSV to QIF Converter", blurb: "Any CSV to QIF for Quicken import.", eyebrow: "Format converter", sourceLabel: "CSV", destinations: [{ label: "QIF", color: EMERALD }] },
  { href: "/qif-to-csv", title: "QIF to CSV Converter", blurb: "A Quicken export, back to plain CSV.", eyebrow: "Format converter", sourceLabel: "QIF", destinations: [{ label: "CSV", color: EMERALD }] },
  { href: "/csv-to-ofx", title: "CSV to OFX Converter", blurb: "Any CSV to the bank-neutral OFX format.", eyebrow: "Format converter", sourceLabel: "CSV", destinations: [{ label: "OFX", color: EMERALD }] },
  { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "An OFX or QFX file, back to plain CSV.", eyebrow: "Format converter", sourceLabel: "OFX", destinations: [{ label: "CSV", color: EMERALD }] },
  { href: "/qfx-to-csv", title: "QFX to CSV Converter", blurb: "A Quicken QFX export, back to plain CSV.", eyebrow: "Format converter", sourceLabel: "QFX", destinations: [{ label: "CSV", color: EMERALD }] },
  { href: "/mt940-to-csv", title: "MT940 to CSV Converter", blurb: "SWIFT's international statement format, to CSV.", eyebrow: "Format converter", sourceLabel: "MT940", destinations: [{ label: "CSV", color: EMERALD }] },
  { href: "/qbo-to-csv", title: "QBO to CSV Converter", blurb: "A QuickBooks Web Connect export, to a real spreadsheet.", eyebrow: "Format converter", sourceLabel: "QBO", destinations: [{ label: "CSV", color: EMERALD }] },
  { href: "/csv-to-qbo", title: "CSV to QBO Converter", blurb: "Any CSV, ready to import as a real QuickBooks bank feed.", eyebrow: "Format converter", sourceLabel: "CSV", destinations: [{ label: "QBO", color: EMERALD }] },
  { href: "/qfx-to-qbo", title: "QFX to QBO Converter", blurb: "Move a Quicken export into QuickBooks.", eyebrow: "Format converter", sourceLabel: "QFX", destinations: [{ label: "QBO", color: EMERALD }] },
  { href: "/qif-to-qbo", title: "QIF to QBO Converter", blurb: "An older Quicken export, ready for QuickBooks.", eyebrow: "Format converter", sourceLabel: "QIF", destinations: [{ label: "QBO", color: EMERALD }] },
  { href: "/ofx-to-qbo", title: "OFX to QBO Converter", blurb: "The bank-neutral format, converted for a clean QuickBooks import.", eyebrow: "Format converter", sourceLabel: "OFX", destinations: [{ label: "QBO", color: EMERALD }] },
  { href: "/image-to-excel", title: "Image to Excel Converter", blurb: "A photo or scan of a statement, converted with on-device OCR.", eyebrow: "Converter guide", sourceLabel: "Photo", destinations: [{ label: "XLSX", color: EMERALD }] },
  { href: "/bank-statement-to-tally", title: "Bank Statement to Tally XML", blurb: "No bank exports Tally XML natively — convert any PDF statement directly.", eyebrow: "Bank guide", sourceLabel: "PDF", destinations: [{ label: "XML", color: EMERALD }] },
  { href: "/bank-statement-to-ofx", title: "Bank Statement to OFX", blurb: "For QuickBooks, Xero, and other accounting software, from any bank's PDF.", eyebrow: "Bank guide", sourceLabel: "PDF", destinations: [{ label: "OFX", color: EMERALD }] },
  { href: "/bank-statement-to-qif", title: "Bank Statement to QIF", blurb: "For Quicken import, from any bank's PDF statement.", eyebrow: "Bank guide", sourceLabel: "PDF", destinations: [{ label: "QIF", color: EMERALD }] },
];

function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to={post.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-emerald/50 hover:shadow-md"
    >
      <FeaturedArt
        className="aspect-[16/9] w-full"
        titleText={post.title}
        eyebrow={post.eyebrow}
        sourceLabel={post.sourceLabel}
        destinations={post.destinations}
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-ink group-hover:text-emerald">{post.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{post.blurb}</p>
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-emerald">
          Read guide <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Guides & Converters — LedgerLocal" },
      {
        name: "description",
        content: "Bank-specific statement guides and free format converters (IIF, QIF, OFX, QFX, MT940, CSV) — all on-device, nothing uploaded.",
      },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border py-16 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Guides &amp; converters</h1>
          <p className="mt-4 text-muted-foreground">
            Bank-specific statement guides and free format converters — all on-device, nothing ever uploaded.
          </p>
        </div>
      </section>

      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank guides</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {BANK_GUIDES.map((post) => (
              <PostCard key={post.href} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format converters</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FORMAT_CONVERTERS.map((post) => (
              <PostCard key={post.href} post={post} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  ),
});
