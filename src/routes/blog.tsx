import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { StatementGridArt } from "@/components/statement-grid-art";

type Post = { href: string; title: string; blurb: string; label: string };

const BANK_GUIDES: Post[] = [
  {
    href: "/natwest-bank-statement-to-csv",
    title: "NatWest bank statement to CSV",
    blurb: "NatWest's own export, plus a converter for when you only have a PDF.",
    label: "NatWest",
  },
  {
    href: "/lloyds-bank-statement-to-csv",
    title: "Lloyds bank statement to CSV & Excel",
    blurb: "Lloyds' CSV export is capped at 12 months and 150 transactions — here's the rest.",
    label: "Lloyds",
  },
];

const FORMAT_CONVERTERS: Post[] = [
  { href: "/csv-to-iif", title: "CSV to IIF Converter for QuickBooks Desktop", blurb: "Any CSV, auto-detected columns, straight to IIF.", label: "CSV → IIF" },
  { href: "/iif-to-csv", title: "IIF to CSV Converter", blurb: "A QuickBooks Desktop export, back to plain CSV.", label: "IIF → CSV" },
  { href: "/csv-to-qif", title: "CSV to QIF Converter", blurb: "Any CSV to QIF for Quicken import.", label: "CSV → QIF" },
  { href: "/qif-to-csv", title: "QIF to CSV Converter", blurb: "A Quicken export, back to plain CSV.", label: "QIF → CSV" },
  { href: "/csv-to-ofx", title: "CSV to OFX Converter", blurb: "Any CSV to the bank-neutral OFX format.", label: "CSV → OFX" },
  { href: "/ofx-to-csv", title: "OFX to CSV Converter", blurb: "An OFX or QFX file, back to plain CSV.", label: "OFX → CSV" },
  { href: "/qfx-to-csv", title: "QFX to CSV Converter", blurb: "A Quicken QFX export, back to plain CSV.", label: "QFX → CSV" },
  { href: "/mt940-to-csv", title: "MT940 to CSV Converter", blurb: "SWIFT's international statement format, to CSV.", label: "MT940 → CSV" },
];

function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to={post.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-emerald/50 hover:shadow-md"
    >
      <StatementGridArt className="aspect-[16/9] w-full" label={post.label} />
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
