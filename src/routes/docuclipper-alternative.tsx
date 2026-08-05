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
 * Editorial rule for every comparison page on this site:
 *
 * DO NOT state a competitor's prices. Researched Aug 2026, DocuClipper's
 * entry tier was quoted as $20, $29, $39, $74, $79, $99, $149, $159 and $191
 * across ten sources -- nearly all of them competitors' own comparison pages,
 * each with an incentive to distort. Publishing a number we cannot verify is
 * a factual claim about a named company that goes stale in weeks and is
 * trivially disproved, which destroys the credibility the whole page depends
 * on. Link to their pricing page and let the reader check it.
 *
 * Compare on structure instead: where the file is processed, what the free
 * tier is, what happens on cancellation. Those are architectural facts, they
 * do not go stale, and they are the ones a privacy-conscious buyer is
 * actually deciding on.
 */

const FAQ: FaqItem[] = [
  {
    q: "Is BalanceExtract a drop-in replacement for DocuClipper?",
    a: "For converting statement PDFs into CSV, Excel, QBO, OFX or QIF, yes. For direct QuickBooks Online and Xero sync, no — DocuClipper pushes data into those systems, BalanceExtract produces a file you import yourself.",
  },
  {
    q: "Does my statement get uploaded anywhere?",
    a: "No. Parsing runs in your browser using JavaScript and WebAssembly. Your statement is never transmitted, which is the core architectural difference between the two tools.",
  },
  {
    q: "Can I check that claim rather than take it on faith?",
    a: "Yes, and you should. Open your browser's Network tab, then convert a statement. You will see no upload request. You can also disconnect from the internet after the page loads and convert offline.",
  },
  {
    q: "Which one is more accurate?",
    a: "Depends on the statement. DocuClipper is a mature product with a large template library and strong results on common US bank formats. BalanceExtract infers layout from the document's own structure rather than matching a template, and flags rows it isn't confident about instead of silently guessing.",
  },
  {
    q: "How much does BalanceExtract cost?",
    a: "$19 a month, flat, with no page limit — the same price whether you convert ten pages or ten thousand, and all seven export formats are included. Before that, 6 pages per conversion with no signup at all, or 10 pages as a lifetime pool once you make an account.",
  },
  {
    q: "What happens to my data if I stop paying?",
    a: "Nothing to happen — there is no stored copy. Files never left your device, so cancelling doesn't strand data on a server you no longer have access to.",
  },
];

export const Route = createFileRoute("/docuclipper-alternative")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/docuclipper-alternative` }],
    meta: [
      { title: "DocuClipper Alternative — On-Device Bank Statement Converter | BalanceExtract" },
      {
        name: "description",
        content:
          "An honest comparison of BalanceExtract and DocuClipper. The real difference is architecture: DocuClipper processes statements on its servers, BalanceExtract never uploads them.",
      },
      { property: "og:title", content: "DocuClipper Alternative — BalanceExtract" },
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

      <Breadcrumbs trail={[{ label: "Comparisons", href: "/blog" }, { label: "DocuClipper Alternative" }]} />
      <ArticleBackLink />
      <ArticleHero
        eyebrow="Comparison"
        title="DocuClipper Alternative: What Actually Differs"
        publishedDate="August 2026"
      />

      <QuickSummary>
        DocuClipper is a mature, well-reviewed product and for a lot of accounting firms it is the
        right choice. The difference that matters is not a feature list — it is where your statement
        gets processed. DocuClipper sends the file to its servers. BalanceExtract parses it in your
        browser and never uploads it. If your statements belong to clients rather than to you, that
        distinction is the decision.
      </QuickSummary>

      <PricingCallout competitorModel="DocuClipper meters by page — their own pricing page is titled &quot;Pay by Pages Processed&quot;, and every tier carries a monthly page allowance." />

      <ArticleProse>
        <p>
          Most "alternative" pages are a pricing table with the author's product coloured green. This
          one deliberately isn't. We researched DocuClipper's entry-tier price across ten sources in
          August 2026 and got nine different answers, nearly all of them published by competitors.
          Rather than add a tenth, check{" "}
          <a href="https://www.docuclipper.com/pricing/" rel="nofollow noopener" target="_blank">
            DocuClipper's own pricing page
          </a>{" "}
          and ours, and compare them yourself.
        </p>
        <p>
          What follows is the part that doesn't change between billing cycles.
        </p>
      </ArticleProse>

      <ArticleH2>The architectural difference</ArticleH2>
      <ArticleTable
        headers={["", "DocuClipper", "BalanceExtract"]}
        rows={[
          ["Where parsing runs", "On DocuClipper's servers", "In your browser"],
          ["Statement leaves your device", "Yes", "No"],
          ["Works offline once loaded", "No", "Yes"],
          ["Approach to layouts", "Template library plus AI", "Infers structure from the document"],
          ["QuickBooks / Xero direct sync", "Yes", "No — exports a file you import"],
          ["Pricing model", "Metered — priced by pages processed", "$19/mo flat, unlimited pages"],
          ["Cost as volume grows", "Rises with usage", "Unchanged"],
          ["Free tier", "Trial only", "6 pages no signup, 10 pages with an account"],
          ["Rows it isn't sure about", "—", "Flagged for review before export"],
        ]}
      />

      <ArticleH2>When DocuClipper is the better choice</ArticleH2>
      <ArticleProse>
        <p>
          We would rather you pick correctly than pick us. DocuClipper is the stronger option if:
        </p>
      </ArticleProse>
      <LimitsList
        limits={[
          {
            lead: "You need statements pushed straight into QuickBooks or Xero",
            body: "direct integration is real work we haven't built. Exporting a file and importing it is an extra step, and if you do it fifty times a month that step matters.",
          },
          {
            lead: "You need an API or automated pipeline",
            body: "on-device processing means there is no server to call. A browser tool cannot be a backend integration, and that is a genuine structural limit rather than a missing feature.",
          },
          {
            lead: "You want vendor-audited compliance paperwork",
            body: "DocuClipper holds SOC 2 Type II certification. Our answer to compliance is that the data never moves, which is a different argument — stronger in substance for some buyers, but it isn't a certificate you can hand to a procurement team.",
          },
          {
            lead: "You process very high volumes with a team",
            body: "server-side batch processing and shared client workspaces are things a purely local tool doesn't do well.",
          },
        ]}
      />

      <ArticleH2>When on-device is the better choice</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "The statements aren't yours",
            body: "bookkeepers, accountants and lawyers handling client statements take on a data-processing obligation the moment those files reach a third-party server. If the file never leaves the device, that obligation largely doesn't arise.",
          },
          {
            lead: "You want to verify the privacy claim rather than trust it",
            body: "open the Network tab and convert a statement — there is no upload request. Or disconnect from the internet after the page loads and convert anyway. No cloud tool can offer that test.",
          },
          {
            lead: "You convert occasionally",
            body: "a per-page subscription is poor value for someone converting a handful of statements a quarter, which is most people applying for a mortgage or filing a tax return.",
          },
          {
            lead: "You'd rather not add a vendor to your breach surface",
            body: "every service holding your statements is somewhere a future incident can include them. Not uploading is the only reliable way to stay out of that.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ArticleCta
        heading="Convert a statement without uploading it"
        body="Free, runs entirely in your browser. Check the Network tab while it works."
        buttonLabel="Convert a statement"
      />

      <RelatedArticles
        articles={[
          {
            href: "/bank-statement-to-csv",
            title: "Bank Statement to CSV",
            blurb: "Convert any bank's PDF statement to CSV, on-device.",
          },
          {
            href: "/statementdesk-alternative",
            title: "StatementDesk Alternative",
            blurb: "Same price — row-metered and cloud, versus no limit and on-device.",
          },
          {
            href: "/propersoft-alternative",
            title: "ProperSoft Alternative",
            blurb: "One converter for every direction, versus an app per conversion pair.",
          },
          {
            href: "/moneythumb-alternative",
            title: "MoneyThumb Alternative",
            blurb: "One converter for every format, versus a product per format.",
          },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
