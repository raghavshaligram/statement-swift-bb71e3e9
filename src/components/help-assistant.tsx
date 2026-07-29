/**
 * A "search our help articles" widget -- deliberately NOT an AI chat
 * interface. This does plain client-side keyword scoring against a
 * curated set of real answers already established across the site (pulled
 * from the actual FAQs on the bank guide and format-converter pages, not
 * invented for this widget), and shows the best matches. No API call, no
 * LLM, nothing sent anywhere -- the framing in the UI ("Search our help
 * articles") is chosen specifically not to imply this is conversational
 * AI, since it isn't one.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

type Entry = { q: string; a: string; href?: string; hrefLabel?: string };

const ENTRIES: Entry[] = [
  { q: "Is my data uploaded anywhere?", a: "No. Every conversion — PDF, photo, or scan — runs entirely in your browser, on your device. Nothing is sent to a server. You can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any." },
  { q: "Do I need to sign up to use LedgerLocal?", a: "Not for PDF statements — up to 6 pages per conversion, unlimited conversions, no account needed. Signing up gets you a 10-page lifetime allowance (PDFs and photos/scans combined). Converting a photo or scanned image specifically does require a free account, since OCR takes real processing time." },
  { q: "How much does LedgerLocal cost?", a: "Free to try — 6 pages per conversion with no signup, or a 10-page lifetime allowance once you sign up. Pro is $19/month flat: unlimited conversions, no page cap, all seven export formats, no per-page fees." },
  { q: "What file formats can I export to?", a: "Excel (.xlsx), CSV, OFX, QFX, QBO, QIF, IIF, and Tally XML — covering QuickBooks Desktop, QuickBooks Online, Quicken, Xero, and Tally." },
  { q: "What banks does LedgerLocal support?", a: "23+ banks with named layout detection across the US, UK, Canada, and India — including Chase, Bank of America, Wells Fargo, Lloyds, NatWest, ICICI, HDFC, SBI, Axis, and Kotak. Any other bank's text-based PDF falls back to a generic layout parser." },
  { q: "Why is a row marked low confidence?", a: "Every extracted transaction gets a confidence score. Low-confidence rows usually come from a blurry photo, an unusual layout, or a merged/split line the parser had to make a judgment call on — worth checking that specific row against the original statement before exporting." },
  { q: "Can I convert a scanned or photographed statement?", a: "Yes — LedgerLocal falls back to on-device OCR automatically for scans and photos (JPG, PNG, WEBP), and for any PDF page with no real text layer. This does require a free account, unlike text-based PDF conversion." },
  { q: "Will the dates come out right?", a: "LedgerLocal infers the real date order (DD/MM/YYYY vs MM/DD/YYYY) from the statement itself rather than assuming one, and normalises output dates to ISO (YYYY-MM-DD) by default — a format Excel reads unambiguously regardless of your regional settings." },
  { q: "Can I combine statements from different banks in one export?", a: "Yes. Drop PDFs from multiple banks into the same batch — LedgerLocal detects each one and processes them together into a single export." },
  { q: "How do I cancel or change my Pro subscription?", a: "From your account's Billing page. If you can't find that option or something looks wrong, send us a message below and we'll sort it out directly." },
  { q: "Why does QuickBooks Desktop need an IIF or QBO file instead of a CSV?", a: "QuickBooks Desktop has no built-in way to import a CSV or Excel file of transactions at all — confirmed directly via Intuit's own support community. IIF and QBO are the real paths in.", href: "/csv-to-iif", hrefLabel: "CSV to IIF guide" },
  { q: "Why does my QFX file stop importing into Quicken?", a: "Quicken ties QFX import to your software version's age — once it's roughly three years old, QFX downloads stop being accepted, forcing an upgrade. Converting to CSV sidesteps that limit entirely.", href: "/qfx-to-csv", hrefLabel: "QFX to CSV guide" },
  { q: "What's the difference between QIF, QFX, and OFX for Quicken?", a: "QIF is the only one of the three that carries categories and split transactions into Quicken — QFX and OFX both drop category data entirely.", href: "/csv-to-qif", hrefLabel: "CSV to QIF guide" },
  { q: "Does any bank export directly to Tally XML?", a: "No — it isn't one of the formats banks offer at all (CSV, Excel, OFX, QIF, and QBO cover almost everyone's native export list, but never Tally). Converting a PDF statement is the real path in.", href: "/bank-statement-to-tally", hrefLabel: "Bank statement to Tally guide" },
  { q: "What is a QBO file, and how is it different from IIF?", a: "QBO is QuickBooks' Web Connect format, built on the same underlying structure as OFX — it imports as a live bank-feed match on both QuickBooks Desktop and Online. IIF is a QuickBooks Desktop-only format with simpler, unmatched transaction entries.", href: "/qbo-to-csv", hrefLabel: "QBO to CSV guide" },
  { q: "How accurate is converting a photo of a statement?", a: "It depends on the photo — a clean, well-lit, straight-on scan reads nearly as well as a real PDF. Blur, poor lighting, or an angled shot increases how many rows get flagged as low-confidence, which is why every row is scored rather than silently accepted.", href: "/image-to-excel", hrefLabel: "Image to Excel guide" },
];

function score(entry: Entry, queryWords: string[]): number {
  const haystack = (entry.q + " " + entry.a).toLowerCase();
  let s = 0;
  for (const w of queryWords) {
    if (entry.q.toLowerCase().includes(w)) s += 3;
    else if (haystack.includes(w)) s += 1;
  }
  return s;
}

export function HelpAssistant() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    const words = trimmed.split(/\s+/).filter((w) => w.length > 1);
    return ENTRIES.map((e) => ({ entry: e, s: score(e, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((r) => r.entry);
  }, [query]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search our help articles</div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. is my data uploaded, why is a row low confidence, what banks are supported…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="mt-4 space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matching help article — send us a message below and we'll get back to you directly.
            </p>
          ) : (
            results.map((r) => (
              <div key={r.q} className="rounded-lg border border-border bg-surface p-4">
                <div className="font-semibold text-ink">{r.q}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.a}</p>
                {r.href && (
                  <Link to={r.href} className="mt-2 inline-block text-xs font-semibold text-emerald hover:underline">
                    {r.hrefLabel} →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
