import { createFileRoute } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
 * Same editorial rule as the other comparison pages: no competitor prices.
 *
 * Everything asserted about ProperSoft comes from their own product listings:
 * the per-conversion-pair product line (CSV2QBO, Bank2CSV, CSV2CSV and the
 * rest), Windows and Mac desktop distribution, the free trial capped at 10
 * transactions per file, and the 14-day money-back guarantee.
 *
 * The honest framing here differs from the DocuClipper page. ProperSoft is
 * not really a PDF-parsing competitor -- their converters move data BETWEEN
 * structured formats (OFX, QFX, QIF, QBO, CSV). That overlaps our format
 * converters closely and our PDF parser barely at all, and saying so is more
 * useful to a reader than pretending it's a head-to-head.
 */

const FAQ: FaqItem[] = [
  {
    q: "Do I need a different product for each conversion?",
    a: "Not here. One converter reads QBO, OFX, QFX, QIF, IIF, MT940 and CSV, and writes CSV, Excel, QBO, OFX, QIF, IIF and Tally XML. ProperSoft's model is a separate named application per conversion pair — CSV2QBO, Bank2CSV, CSV2CSV and so on.",
  },
  {
    q: "Can I convert PDF bank statements too?",
    a: "Yes, and this is the main functional difference. ProperSoft's converters work on structured financial files. BalanceExtract reads those same formats and also parses PDF statements directly, including scanned ones via OCR.",
  },
  {
    q: "Is there a trial limit on the number of transactions?",
    a: "No. The free tier is limited by pages, not rows — 6 pages per conversion with no signup, or 10 pages as a lifetime pool with a free account. Every transaction on those pages converts in full.",
  },
  {
    q: "Do I have to install anything?",
    a: "No. It runs in a browser tab on any operating system. ProperSoft ships desktop applications for Windows and Mac, so their tools are tied to a machine and need installing and updating.",
  },
  {
    q: "How much does BalanceExtract cost?",
    a: "$79 once, with no page limit and every export format included in that one price rather than sold per conversion pair. No subscription, no renewal.",
  },
  {
    q: "Is my data uploaded?",
    a: "No. Parsing runs in your browser and the file is never transmitted. Desktop software keeps data local too — the difference is you get that property without installing anything, and you can verify it in the browser's Network tab.",
  },
];

export const Route = createFileRoute("/propersoft-alternative")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/propersoft-alternative` }],
    meta: [
      { title: "ProperSoft Alternative — One Converter, No Install" },
      {
        name: "description",
        content:
          "An honest comparison of BalanceExtract and ProperSoft. ProperSoft sells a desktop app per conversion pair; BalanceExtract reads every format — and PDF statements — in one browser-based converter.",
      },
      { property: "og:title", content: "ProperSoft Alternative — BalanceExtract" },
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

      <Breadcrumbs
        trail={[{ label: "Comparisons", href: "/blog" }, { label: "ProperSoft Alternative" }]}
      />
      <ArticleBackLink />
      <ArticleHero
        eyebrow="Comparison"
        title="ProperSoft Alternative: One Tool, Every Direction"
        publishedDate="August 2026"
      />

      <QuickSummary>
        ProperSoft have made accountant-focused conversion utilities for years and they do the job
        they set out to do. Two structural differences matter: they sell a separate desktop
        application for each conversion pair, and their converters work on structured financial
        files rather than PDF statements. BalanceExtract handles every direction in one
        browser-based converter, and reads PDFs as well.
      </QuickSummary>

      <PricingCallout competitorModel="ProperSoft licenses a separate desktop application per conversion pair, and its trial is capped at 10 transactions per file." />

      <ArticleProse>
        <p>
          As on our other comparison pages, we don&apos;t quote ProperSoft&apos;s prices — check{" "}
          <a href="https://www.propersoft.net/" rel="nofollow noopener" target="_blank">
            propersoft.net
          </a>{" "}
          directly, since a per-product line-up prices differently depending on which converters you
          need. What follows is product shape, which doesn&apos;t change month to month.
        </p>
      </ArticleProse>

      <ArticleH2>A product per conversion, or one converter</ArticleH2>
      <ArticleProse>
        <p>
          ProperSoft&apos;s catalogue is organised by direction: CSV2QBO turns spreadsheets into
          QuickBooks Web Connect files, Bank2CSV turns OFX, QFX, QIF, QBO and OFC files into
          spreadsheets, CSV2CSV produces Mint-format CSV, and so on. Each is a separate application
          with its own licence.
        </p>
        <p>
          If you convert in exactly one direction forever, that is a perfectly reasonable way to buy
          software. If you take QBO from a bank, hand CSV to a client and produce OFX for their
          accountant, it means three purchases and three applications.
        </p>
      </ArticleProse>

      <ArticleTable
        headers={["", "ProperSoft", "BalanceExtract"]}
        rows={[
          ["Product model", "One app per conversion pair", "One converter, all directions"],
          [
            "PDF bank statements",
            "Not the focus — structured files",
            "Yes, including scanned via OCR",
          ],
          ["Where it runs", "Windows / Mac desktop app", "Browser tab, any OS"],
          ["Installation", "Required", "None"],
          [
            "Free tier",
            "Trial capped at 10 transactions per file",
            "6 pages no signup, 10 pages with an account",
          ],
          ["Pricing model", "Per-product licence", "$79 once, lifetime, unlimited pages"],
          ["Multi-account OFX/QBO files", "—", "Split by account, one sheet each"],
        ]}
      />

      <ArticleH2>When ProperSoft is the better choice</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "You want desktop software you install and own",
            body: "a locally installed application with a perpetual licence is a genuinely different proposition from a subscription, and for some buyers that settles it.",
          },
          {
            lead: "You need a niche conversion direction",
            body: "their catalogue covers pairings — Mint CSV, POSH, Sage ASO, older Quicken paths — that a general-purpose converter may not.",
          },
          {
            lead: "You convert in exactly one direction, forever",
            body: "a single-purpose tool bought once is hard to argue against when the requirement never changes.",
          },
          {
            lead: "You need to work with no internet at all",
            body: "our converter runs offline once the page has loaded, but a desktop app doesn't need the page load in the first place.",
          },
        ]}
      />

      <ArticleH2>When BalanceExtract fits better</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "Your source is a PDF statement",
            body: "this is the clearest split. ProperSoft's converters expect structured files that a bank already gave you. If what you have is a PDF — which is what most banks hand out beyond a few months of history — that's the problem we're built for.",
          },
          {
            lead: "You convert in more than one direction",
            body: "seven output formats from one conversion, with no second licence and no second application to keep updated.",
          },
          {
            lead: "You want to evaluate on real files",
            body: "a trial capped at 10 transactions per file tells you the software runs, not whether it reads YOUR statements correctly. Six full pages with no signup answers the question that actually matters.",
          },
          {
            lead: "You work across machines or operating systems",
            body: "nothing installed, nothing tied to one computer, identical on macOS, Windows and Linux.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ArticleCta
        heading="Convert a file in any direction"
        body="Free, runs entirely in your browser, nothing to install."
        buttonLabel="Convert a file"
      />

      <RelatedArticles
        articles={[
          {
            href: "/moneythumb-alternative",
            title: "MoneyThumb Alternative",
            blurb: "One converter for every format, versus a product per format.",
          },
          {
            href: "/docuclipper-alternative",
            title: "DocuClipper Alternative",
            blurb: "Cloud processing versus on-device, compared honestly.",
          },
          {
            href: "/statementdesk-alternative",
            title: "StatementDesk Alternative",
            blurb: "Same price — row-metered and cloud, versus no limit and on-device.",
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
