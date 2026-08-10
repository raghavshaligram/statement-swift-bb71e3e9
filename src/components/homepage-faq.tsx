/**
 * Section 9: FAQ. Categories match the design brief; answers are written to
 * be truthful about BalanceExtract's current feature set — no capability
 * claims beyond what's actually built and tested.
 */
import { Link } from "@tanstack/react-router";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/scroll-reveal";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How do I convert a statement?",
    a: "Drop a PDF into the converter on this page, or head to /upload. BalanceExtract reads the file and extracts transactions right in your browser — no signup needed to try it.",
  },
  {
    q: "Is it free?",
    a: "Yes, for occasional use. No signup: 6 pages per conversion, as many conversions as you like. Sign up free: a 10-page lifetime allowance (PDFs and photos/scans combined). Lifetime access removes the limit entirely for a one-time payment — no subscription, no credits, no renewal.",
  },
  {
    q: "Which banks and formats are supported?",
    a: "Named detection for 23+ major banks across the US, UK, Canada, and India — including Chase, Bank of America, Citibank, Barclays, HSBC, RBC, ICICI, HDFC, and more — plus a generic layout parser for any other bank's text-based PDF statement. Export to Excel, CSV, Tally XML, OFX, QIF, QBO, or IIF.",
  },
  {
    q: "Does it work with credit card statements, not just bank accounts?",
    a: "The generic parser handles credit card statements reasonably well — it's been tested against a real scanned credit card statement and correctly extracted all its transactions. Credit card statement layouts vary a lot between issuers, though, so this isn't as thoroughly verified across issuers as our named bank detection is. Always double-check extracted rows before exporting.",
  },
  {
    q: "Does it work with scanned PDFs or photos?",
    a: "Yes, both, using on-device OCR automatically — no upload, same as everything else. Scanned PDFs work the same as any PDF, no signup needed. Uploading a raw photo or screenshot (JPG/PNG/WEBP) requires a free account, since photo OCR costs the same to run as scanning a PDF. Results depend on image quality: a clear scan or screenshot works well, but a blurry or heavily compressed photo may not read correctly. Always double-check extracted rows before exporting.",
  },
  {
    q: "Can I convert my bank statement to Excel sheet format, or only CSV?",
    a: "Both — export straight to a real Excel (.xlsx) sheet with proper columns, or CSV if that's what your workflow needs. If you're going the other way and already have a bank statement CSV, converting bank statement CSV to Excel is a one-step export — or just open the CSV directly in Excel yourself if the columns are already how you want them.",
  },
  {
    q: "Can I import into QuickBooks?",
    a: "Yes — export to IIF for QuickBooks Desktop, or QBO for QuickBooks Online's Web Connect import. Bank-specific import walkthroughs are on the way.",
  },
  {
    q: "Can I convert statements from multiple accounts at once?",
    a: "Yes. Drop statements from different accounts, or even different banks, together and BalanceExtract processes them as a batch.",
  },
  {
    q: "Is my data secure?",
    a: "Your statement never leaves your device — there's no upload step at all, so there's nothing in transit to intercept. You can confirm this yourself: open your browser's DevTools Network tab during a conversion and watch for outbound requests. There won't be any.",
  },
];

export function HomepageFaq() {
  // Structured data generated from the exact same FAQ array rendered below --
  // deliberately not a separately-maintained copy, so the schema can never
  // say something different from what a visitor actually sees on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section className="border-b border-border py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6">
        <ScrollReveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Full plan details are on the{" "}
            <Link to="/pricing" className="font-medium text-emerald hover:underline">
              pricing page
            </Link>
            .
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="mt-10 space-y-4">
          {FAQ.map(({ q, a }) => (
            <ScrollRevealItem key={q}>
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="font-semibold text-ink">{q}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
