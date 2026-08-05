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
 * Same editorial rule as /docuclipper-alternative: no competitor prices.
 *
 * MoneyThumb's pricing was quoted as $29-99, $59.95-$599+, ~$25/mo and
 * ~$49/year across sources researched Aug 2026, mostly on competitors' blogs.
 * We don't publish any of them.
 *
 * Everything asserted about MoneyThumb below comes from moneythumb.com's own
 * pages: the per-format product lineup (pdf2qbo, pdf2csv, pdf2qfx, pdf2ofx,
 * pdf2qif, 2qbo Convert Pro), the Pro bundles pairing a lifetime Convert
 * licence with a one-year PDF+ licence, the Express licences that expire after
 * 50 days, and PinPoint OCR built specifically for bank statements. Those are
 * product-structure facts they publish themselves and would not dispute.
 */

const FAQ: FaqItem[] = [
  {
    q: "Do I need a separate BalanceExtract product for each output format?",
    a: "No. CSV, Excel, QBO, OFX, QIF, IIF, MT940 and Tally XML all come out of the same converter. Format is a choice at export, not a separate purchase.",
  },
  {
    q: "Is MoneyThumb's desktop software more private than a web tool?",
    a: "Against a typical cloud converter, yes — desktop software keeps the file on your machine. BalanceExtract is the unusual case: it runs in the browser but parses on-device, so the statement is never transmitted either. You can confirm that in the Network tab.",
  },
  {
    q: "Does BalanceExtract handle scanned statements?",
    a: "Yes, via OCR in the browser. MoneyThumb's PinPoint OCR is purpose-built for bank statements and has years of tuning behind it; on difficult scans we would expect it to do well.",
  },
  {
    q: "Is there anything to install?",
    a: "No. It runs in a browser tab on any operating system, so there's no Windows-only limitation and nothing to keep updated.",
  },
  {
    q: "How much does BalanceExtract cost?",
    a: "$19 a month, flat, with no page limit, and every export format included in that one price rather than sold separately. Before that, 6 pages per conversion with no signup, or 10 pages as a lifetime pool with a free account.",
  },
  {
    q: "What if a statement converts badly?",
    a: "Rows the parser isn't confident about are flagged before export and are editable in a side-by-side review against the source. Balance continuity is checked across every row, so an arithmetic break surfaces rather than passing silently.",
  },
];

export const Route = createFileRoute("/moneythumb-alternative")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/moneythumb-alternative` }],
    meta: [
      { title: "MoneyThumb Alternative — One Converter, Every Format" },
      {
        name: "description",
        content:
          "An honest comparison of BalanceExtract and MoneyThumb. MoneyThumb sells a separate desktop product per output format; BalanceExtract exports all of them from one on-device converter.",
      },
      { property: "og:title", content: "MoneyThumb Alternative — BalanceExtract" },
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

      <Breadcrumbs trail={[{ label: "Comparisons", href: "/blog" }, { label: "MoneyThumb Alternative" }]} />
      <ArticleBackLink />
      <ArticleHero
        eyebrow="Comparison"
        title="MoneyThumb Alternative: One Tool Instead of Five"
        publishedDate="August 2026"
      />

      <QuickSummary>
        MoneyThumb has converted bank statements for over a decade and its PinPoint OCR is built
        specifically for statement layouts — that experience is real and it shows on hard scans. The
        structural difference is the product model: MoneyThumb sells a separate converter for each
        output format, so needing both CSV and QBO means two purchases. BalanceExtract exports every
        format from one converter, and never uploads the file.
      </QuickSummary>

      <PricingCallout competitorModel="MoneyThumb sells a separate licence per output format, and its cloud service is sold in conversion bundles." />

      <ArticleProse>
        <p>
          We deliberately don't quote MoneyThumb's prices here. Researching them in August 2026
          returned four incompatible answers across sources, nearly all of them published by
          competitors. Check{" "}
          <a href="https://www.moneythumb.com/" rel="nofollow noopener" target="_blank">
            moneythumb.com
          </a>{" "}
          and our pricing page directly.
        </p>
        <p>
          What's worth comparing is how the two products are shaped, which doesn't change between
          billing cycles.
        </p>
      </ArticleProse>

      <ArticleH2>One converter versus a product per format</ArticleH2>
      <ArticleProse>
        <p>
          MoneyThumb's lineup is format-specific: pdf2qbo for QuickBooks, pdf2csv for spreadsheets,
          pdf2qfx for Quicken, pdf2ofx, pdf2qif, and the 2qbo Convert Pro bundle. Each is a separate
          desktop application with its own licence. Their Pro bundles pair a lifetime Convert licence
          with a one-year PDF+ licence, and Express licences expire after 50 days.
        </p>
        <p>
          That's a reasonable model if you only ever need one format. It's an awkward one if you
          hand CSV to a client and QBO to their accountant.
        </p>
      </ArticleProse>

      <ArticleTable
        headers={["", "MoneyThumb", "BalanceExtract"]}
        rows={[
          ["Output formats", "One product per format", "All formats, one converter"],
          ["Where it runs", "Desktop app (plus a cloud option)", "Browser tab, any OS"],
          ["Statement leaves your device", "No on desktop; yes on cloud", "No"],
          ["Installation", "Required", "None"],
          ["Licence model", "Per product; some licences time-limited", "One plan, all formats"],
          ["Pricing model", "Per-format licence; cloud sold in conversion bundles", "$19/mo flat, unlimited pages"],
          ["Free tier", "Trial", "6 pages no signup, 10 pages with an account"],
          ["OCR for scans", "PinPoint OCR, statement-specific", "In-browser OCR"],
          ["Row-level confidence flags", "—", "Yes, with balance reconciliation"],
        ]}
      />

      <ArticleH2>When MoneyThumb is the better choice</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "You have difficult scanned statements",
            body: "PinPoint OCR was built for bank statements specifically and has had years of tuning against real documents. On poor scans, that focus is worth something a general OCR pipeline can't easily match.",
          },
          {
            lead: "You want software you own outright",
            body: "a perpetual desktop licence is a genuinely different proposition from a subscription, and for some buyers it's the deciding one.",
          },
          {
            lead: "You only ever need one output format",
            body: "if it's QBO forever and nothing else, a single-purpose tool from a vendor who has done it for a decade is a perfectly sound choice.",
          },
          {
            lead: "You need obscure legacy formats",
            body: "QIF and older Quicken paths are well-trodden ground for them.",
          },
        ]}
      />

      <ArticleH2>When BalanceExtract fits better</ArticleH2>
      <LimitsList
        limits={[
          {
            lead: "You need more than one output format",
            body: "CSV for review, QBO for QuickBooks, OFX for Xero, Tally XML for Indian accounting — all from the same conversion, no second licence.",
          },
          {
            lead: "You work across machines or operating systems",
            body: "there's nothing to install and nothing tied to one computer. A browser tab works the same on macOS, Windows and Linux.",
          },
          {
            lead: "You want the privacy of desktop without installing desktop software",
            body: "on-device parsing in the browser gives the same 'file never leaves the machine' property as a desktop app, and you can verify it in the Network tab rather than trusting a claim.",
          },
          {
            lead: "You want to see what the parser was unsure about",
            body: "every row carries a confidence score, low-confidence rows are flagged before export, and balance continuity is checked across the whole statement so arithmetic breaks surface instead of passing quietly.",
          },
        ]}
      />

      <ArticleH2>Frequently asked questions</ArticleH2>
      <FaqList items={FAQ} />

      <ArticleCta
        heading="Convert a statement to any format"
        body="Free, runs entirely in your browser, nothing to install."
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
        ]}
      />

      <SiteFooter />
    </div>
  );
}
