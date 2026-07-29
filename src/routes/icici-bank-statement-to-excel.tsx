import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Check, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { EmbeddedConverter } from "@/components/embedded-converter";
import {
  ArticleBackLink,
  ArticleHero,
  QuickSummary,
  ArticleProse,
  ArticleH2,
  NumberedSteps,
  ArticleTable,
  LimitsList,
  RelatedArticles,
} from "@/components/article-sections";

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does ICICI Bank let me download a statement as Excel directly?",
    a: "Yes — ICICI's internet banking Detailed Statement option offers PDF, Excel, and CSV directly, for up to 5-7 years of history. That's the fastest route if you can log in. The iMobile app, by contrast, only offers PDF.",
  },
  {
    q: "Is there a charge for older ICICI statements?",
    a: "ICICI may charge for statements older than 3 years, and for physical copies collected at a branch. Statements within the standard window are free to download online.",
  },
  {
    q: "My emailed ICICI statement PDF is password protected — why?",
    a: "ICICI statements sent by email are commonly password protected using a combination of your name and date of birth. LedgerLocal can't remove that password — you'll need to unlock the PDF with the correct password before uploading it.",
  },
  {
    q: "Will the dates come out right?",
    a: "ICICI statements often use both a transaction date and a separate value date, and can show dates in more than one format within the same document. LedgerLocal infers the real date order from the statement itself rather than assuming one, and normalises output dates to ISO (YYYY-MM-DD) by default.",
  },
  {
    q: "What if my statement is a scan or a photo, not a proper PDF?",
    a: "It still works — LedgerLocal falls back to on-device OCR automatically when a page has no real text layer, and flags it clearly in the results so you know to double-check those specific rows before exporting.",
  },
  {
    q: "Is my ICICI statement data safe?",
    a: "Nothing is uploaded, ever. The PDF is read and converted entirely on your device — you can confirm this yourself by opening your browser's DevTools Network tab during a conversion and watching for outbound requests. There won't be any.",
  },
];

export const Route = createFileRoute("/icici-bank-statement-to-excel")({
  head: () => ({
    meta: [
      { title: "Free ICICI Bank Statement to Excel Converter — LedgerLocal" },
      {
        name: "description",
        content:
          "ICICI's own Excel export works well within a few years of history. Convert older or password-locked ICICI PDF statements to Excel or CSV on-device — free to try, nothing uploaded.",
      },
      { property: "og:title", content: "Free ICICI Bank Statement to Excel Converter — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ArticleBackLink />
      <ArticleHero
        eyebrow="Bank guide"
        title="ICICI Bank Statement to Excel: Formats and Limits"
        publishedDate="July 2026"
      />

      <div className="mx-auto max-w-3xl px-6 pb-4">
        <EmbeddedConverter />
      </div>

      <ArticleProse>
        <p>
          ICICI is one of India's largest private banks, and unlike some competitors, its internet banking
          already offers a genuinely capable native export — PDF, Excel, and CSV, straight from the Detailed
          Statement option. This guide covers what that export gives you, a real charge that can apply to older
          statements, and how to convert the PDFs it can't reach for free.
        </p>
      </ArticleProse>

      <QuickSummary>
        Most ICICI account holders can get transactions into Excel without retyping a thing, straight from
        internet banking — ICICI's own export is genuinely one of the better native options covered on this
        site. It exports Excel and CSV directly for the last several years of history — free for statements
        within the standard window. Older statements (beyond roughly 3 years) can incur a charge to
        retrieve. The iMobile app only offers PDF, not Excel or CSV. For anything outside ICICI's native
        export, or a password-protected emailed PDF you've already unlocked, convert it here.
      </QuickSummary>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-border bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Option 1</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">ICICI's own export</h2>
              <p className="mt-2 text-sm text-muted-foreground">Fastest, and genuinely capable.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Log in to ICICI Bank Internet Banking and go to Bank Accounts, then Statements.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  Select Detailed Statement, choose your account and date range.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Choose PDF, Excel, or CSV as the download format.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink"><Check className="h-4 w-4 shrink-0 text-emerald" /> Free, native Excel and CSV</div>
                <div className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4 shrink-0 text-rose-400" /> May charge for statements older than ~3 years</div>
                <div className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4 shrink-0 text-rose-400" /> iMobile app only offers PDF, not Excel/CSV</div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border-2 border-emerald bg-card p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Option 2</div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Convert a PDF statement</h2>
              <p className="mt-2 text-sm text-muted-foreground">For anything free access doesn't cover.</p>
              <ol className="mt-5 space-y-3 text-sm text-ink">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">1</span>
                  Use a PDF you already have — from iMobile, an emailed statement (unlocked), or an older statement — no account needed for up to 6 pages.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">2</span>
                  LedgerLocal detects ICICI's layout automatically, with a confidence score for anything worth double-checking.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-soft font-mono text-xs font-semibold text-emerald">3</span>
                  Export to Excel, CSV, or a format ICICI doesn't offer at all — Tally XML is a common one for Indian accounting.
                </li>
              </ol>
              <div className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-2 text-ink"><Check className="h-4 w-4 shrink-0 text-emerald" /> No charge, regardless of statement age</div>
                <div className="flex items-center gap-2 text-ink"><Check className="h-4 w-4 shrink-0 text-emerald" /> Tally XML export — a real gap ICICI doesn't cover</div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald" /> Processed on your device — nothing uploaded, ever
              </div>
            </div>
          </div>
        </div>
      </section>

      <ArticleH2>What an ICICI Statement Contains</ArticleH2>
      <ArticleProse>
        <p>
          ICICI statements typically show both a transaction date and a separate value date (when funds actually
          moved) — an important distinction for interest calculations and GST reconciliation that a naive
          parser can miss entirely by only capturing one of the two.
        </p>
      </ArticleProse>
      <ArticleTable
        headers={["Column", "What It Contains"]}
        rows={[
          ["Date / Value Date", "Transaction date, and separately, the date funds actually moved"],
          ["Narration", "The transaction description, often including UPI/IMPS/NEFT reference details"],
          ["Cheque No.", "Present when the transaction was a cheque"],
          ["Debit / Credit", "Separate columns for money out and money in"],
          ["Balance", "Running balance after each transaction"],
        ]}
      />

      <ArticleH2>Frequently Asked Questions</ArticleH2>
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-border bg-card p-5">
              <div className="font-semibold text-ink">{q}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <RelatedArticles
        articles={[
          { href: "/chase-bank-statement-to-excel", title: "Chase Bank Statement to Excel", blurb: "A US bank with a real 90-day export limit." },
          { href: "/csv-to-iif", title: "CSV to IIF Converter", blurb: "For QuickBooks Desktop specifically." },
          { href: "/blog", title: "All Guides & Converters", blurb: "Every bank guide and format converter LedgerLocal offers." },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
