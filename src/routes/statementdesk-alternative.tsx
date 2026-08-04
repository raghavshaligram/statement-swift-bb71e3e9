import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { FaqList, faqJsonLd, type FaqItem } from "@/components/faq-list";
import { PricingCallout } from "@/components/pricing-callout";
import {
  ArticleBackLink,
  ArticleHero,
  QuickSummary,
  ArticleProse,
  ArticleH2,
  ArticleTable,
  LimitsList,
  ArticleCta,
  RelatedArticles,
} from "@/components/article-sections";

/**
 * The closest competitor of the four, and the hardest page to write honestly.
 *
 * StatementDesk sits at the same $19 entry price, also does PDF bank
 * statements, and also categorises transactions automatically. On a feature
 * checklist the two products look nearly identical, so a page that pretends
 * otherwise would be transparently self-serving.
 *
 * Two differences are real and structural: they process in the cloud and we
 * process on-device, and their plans are measured in TRANSACTION ROWS while
 * ours has no page or row limit at all.
 *
 * Sourcing, held to the same standard as the other comparison pages:
 *  - The $19 Professional / $49 Business plan structure comes from Capterra,
 *    an independent directory, not from a competitor's blog.
 *  - Row-based metering is corroborated by two unrelated competitors who both
 *    describe it independently. We state the MODEL, not a specific row cap,
 *    because the caps themselves are only available from competitor pages and
 *    a wrong number about a named company is not worth the risk.
 *  - Their accuracy figure is their own published claim and is labelled as
 *    self-reported, because it is.
 */

const FAQ: FaqItem[] = [
  {
    q: "How is LedgerLocal's pricing different if we're both $19?",
    a: "What the $19 buys. StatementDesk's plans are measured in transaction rows, so a long statement consumes more of your monthly allowance than a short one and a heavy month can run you out. LedgerLocal's Pro plan has no page limit and no row limit — the price is the same whether you convert one statement or two hundred.",
  },
  {
    q: "Do both tools categorise transactions?",
    a: "Yes, and it's worth being straight about that — this isn't a feature we have and they don't. The difference is where it happens: their categorisation runs on their servers, ours runs on your device using a deterministic rules engine, so the same description always produces the same category and nothing is transmitted to work it out.",
  },
  {
    q: "What export formats do I get?",
    a: "Seven: CSV, Excel, QBO, OFX, QIF, IIF and Tally XML. Native QBO and OFX matter if you import into QuickBooks or Xero directly, because a CSV usually needs column mapping on the way in while a QBO file doesn't.",
  },
  {
    q: "Is my statement uploaded to a server?",
    a: "Not with LedgerLocal — parsing runs in your browser and the file never leaves your device. StatementDesk is a cloud service, so statements are transmitted for processing. That distinction matters most if the statements belong to clients rather than to you.",
  },
  {
    q: "Which one is more accurate?",
    a: "Neither of us can honestly answer that for your statements. StatementDesk publishes a 97% figure from their own testing; we don't publish an accuracy number because a single percentage across every bank in the world isn't a meaningful claim. What we do instead is show a confidence score on every row, flag the uncertain ones before export, and check that each running balance reconciles — so you can see where a conversion is weak rather than trusting an average.",
  },
  {
    q: "Can I try before paying?",
    a: "Yes — 6 pages per conversion with no signup at all, or 10 pages as a lifetime pool with a free account. No credit card either way.",
  },
];

export const Route = createFileRoute("/statementdesk-alternative")({
  head: () => ({
    meta: [
      { title: "StatementDesk Alternative — No Row Limits, On-Device | LedgerLocal" },
      {
        name: "description",
        content:
          "An honest comparison of LedgerLocal and StatementDesk. Same $19 entry price — but StatementDesk meters transaction rows and processes in the cloud, while LedgerLocal has no limits and never uploads your statement.",
      },
      { property: "og:title", content: "StatementDesk Alternative — LedgerLocal" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }}
      />

      <ArticleBackLink />
      <ArticleHero
        eyebrow="Comparison"
        title="StatementDesk Alternative: Same Price, No Row Limit"
        publishedDate="August 2026"
      />

      <QuickSummary>
        This is the closest comparison of the four we publish. StatementDesk sits at the same entry
        price, converts PDF bank statements, and categorises transactions automatically — on a
        feature list the two look alike, and pretending otherwise would be dishonest. Two
        differences are real: their plans are measured in transaction rows, and their processing
        happens on their servers. Ours has no row or page limit, and never uploads your file.
      </QuickSummary>

      <PricingCallout competitorModel="StatementDesk's plans are measured in transaction rows, so a long statement eats more of your monthly allowance than a short one." />

      <ArticleProse>
        <p>
          On sourcing: StatementDesk&apos;s plan structure here comes from an independent software
          directory rather than a competitor&apos;s blog, and we describe how their metering works
          rather than quoting a specific row cap, because those figures are only published by rivals.
          Check{" "}
          <a href="https://www.statementdesk.com/" rel="nofollow noopener" target="_blank">
            statementdesk.com
          </a>{" "}
          for their current numbers.
        </p>
      </ArticleProse>

      <ArticleH2>Rows versus no limit</ArticleH2>
      <ArticleProse>
        <p>
          This is the difference that shows up in a real month. When a plan is measured in
          transaction rows, a single busy current account can consume a meaningful share of the
          monthly allowance on its own — and a bookkeeper closing several clients in the same week
          is exactly the person most likely to hit the ceiling, at exactly the worst moment.
        </p>
        <p>
          There is nothing dishonest about that model; it maps cost to usage, which is defensible.
          It just means your bill has a ceiling you have to think about. Ours doesn&apos;t: the same
          $19 whether the month is quiet or you convert every client you have.
        </p>
      </ArticleProse>

      <ArticleTable
        headers={["", "StatementDesk", "LedgerLocal"]}
        rows={[
          ["Metering", "Transaction rows per month", "No page or row limit"],
          ["Where processing runs", "Their servers", "Your browser"],
          ["Statement leaves your device", "Yes", "No"],
          ["Auto-categorisation", "Yes, server-side", "Yes, on-device rules engine"],
          ["Export formats", "CSV and Excel", "7, incl. native QBO, OFX, QIF, Tally XML"],
          ["Direct QuickBooks / Xero sync", "Yes", "No — exports a file you import"],
          ["Accuracy claim", "97%, self-reported", "None — per-row confidence scores instead"],
          ["Free tier", "Limited free conversions", "6 pages no signup, 10 with an account"],
        ]}
      />

      <ArticleH2>When StatementDesk is the better choice</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "You want data pushed straight into QuickBooks or Xero",
            body: "they integrate directly with both, plus Google Drive and Sheets. We export a file you import yourself, and if you do that fifty times a month the extra step is real work.",
          },
          {
            lead: "You want someone else's servers doing the work",
            body: "cloud processing means a heavy statement doesn't depend on your laptop. On an old machine or a phone, that genuinely matters.",
          },
          {
            lead: "Your volume is low and predictable",
            body: "if you convert a couple of short statements a month, a row allowance you'll never approach is not a constraint, and their integrations may be worth more to you than our lack of a ceiling.",
          },
          {
            lead: "You want a published accuracy figure",
            body: "they publish one and have documented their testing. We don't publish a number, and if a single comparable figure is what you need to make a decision, that's a real gap on our side.",
          },
        ]}
      />

      <ArticleH2>When LedgerLocal fits better</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "Your volume is uneven",
            body: "month-end, year-end and onboarding a new client are all spikes. A flat price with no ceiling means the busy month costs what the quiet one did.",
          },
          {
            lead: "The statements belong to clients",
            body: "a file that never leaves the device doesn't create a data-processing relationship with a third party. That's a compliance argument as much as a privacy one, and you can verify it yourself in the browser's Network tab rather than taking it on trust.",
          },
          {
            lead: "You need native accounting formats",
            body: "QBO, OFX and QIF import into QuickBooks, Xero and Quicken without column mapping. CSV usually needs remapping every time.",
          },
          {
            lead: "You'd rather see uncertainty than an average",
            body: "every row carries a confidence score, low-confidence rows are flagged before export, and each running balance is reconciled — so you find the weak rows rather than discovering them later in your books.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ArticleCta
        heading="Convert a statement with no row limit"
        body="Free to try, runs entirely in your browser, nothing uploaded."
        buttonLabel="Convert a statement"
      />

      <RelatedArticles
        articles={[
          {
            href: "/docuclipper-alternative",
            title: "DocuClipper Alternative",
            blurb: "Cloud processing versus on-device, compared honestly.",
          },
          {
            href: "/moneythumb-alternative",
            title: "MoneyThumb Alternative",
            blurb: "One converter for every format, versus a product per format.",
          },
          {
            href: "/propersoft-alternative",
            title: "ProperSoft Alternative",
            blurb: "One converter for every direction, versus an app per conversion pair.",
          },
          {
            href: "/bank-statement-to-csv",
            title: "Bank Statement to CSV",
            blurb: "Convert any bank's PDF statement to CSV, on-device.",
          },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
