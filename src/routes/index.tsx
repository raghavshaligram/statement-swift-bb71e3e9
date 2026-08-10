import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import {
  ShieldCheck,
  Lock,
  Infinity as InfinityIcon,
  Check,
  Upload,
  ArrowRight,
  ScanLine,
  Globe,
  Layers,
  FileOutput,
  Shield,
  Scale,
  Gauge,
  CalendarCheck,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/scroll-reveal";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { WorkbookAnimation } from "@/components/workbook-animation";
import { motion } from "framer-motion";
import { HowItWorksTimeline } from "@/components/how-it-works-timeline";
import { TransactionSideBySide } from "@/components/transaction-side-by-side";
import { CapabilityGrid } from "@/components/capability-grid";
import { ComparisonSection } from "@/components/comparison-section";
import { HomepageFaq } from "@/components/homepage-faq";
import { BANK_LABELS } from "@/lib/pdf/bank-detection";
import {
  ANONYMOUS_MAX_PAGES,
  SIGNED_IN_MAX_PAGES,
  LIFETIME_PRICE_USD,
} from "@/lib/pricing-constants";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ClaimTag, CornerRibbon } from "@/components/claim-tag";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/` }],
    meta: [
      { title: "Free Bank Statement Converter — PDF to Excel & CSV" },
      {
        name: "description",
        content:
          "Close your books without retyping transactions — the bank statement to Excel software that works everywhere. Convert PDF bank statements to CSV and Excel on your device, free to try, unlimited pages with Lifetime access. Works with Chase, BofA, Wells Fargo, ICICI, HDFC, SBI, Axis, Kotak and more.",
      },
      {
        property: "og:title",
        content: "BalanceExtract — Free Bank Statement Converter (PDF to CSV & Excel)",
      },
      {
        property: "og:description",
        content:
          "100% on-device. Unlimited pages with Lifetime access. Real software for real accountants.",
      },
    ],
  }),
  component: Landing,
});

const banks = Object.values(BANK_LABELS).filter((label) => !label.startsWith("Unrecognized"));

const FEATURES = [
  {
    icon: Shield,
    title: "Private & Secure",
    body: "Never uploaded. No server, no logs, no retention.",
  },
  {
    icon: InfinityIcon,
    title: "No Page Cap on Lifetime",
    body: "Competitors meter by page or row. Lifetime access is one payment, any volume.",
  },
  {
    icon: ScanLine,
    title: "Scans & Photos",
    body: "On-device OCR reads scans and phone photos of paper statements.",
  },
  {
    icon: Globe,
    title: "23+ Banks",
    body: "Named profiles across the US, UK, Canada and India.",
  },
  {
    icon: Layers,
    title: "Multi-Account",
    body: "Several accounts or banks, converted together in one pass.",
  },
  {
    icon: FileOutput,
    title: "Every Format",
    body: "Excel, CSV, QBO, OFX, QIF, IIF and Tally XML.",
  },
];

const ACCURACY = [
  {
    icon: Scale,
    title: "We check the maths",
    body: "Every row's running balance is checked against the one before it. If the statement doesn't tie out, you're told the exact row where it breaks — before you export, not after your reconciliation fails.",
  },
  {
    icon: Gauge,
    title: "Every row is scored",
    body: "Each transaction gets a confidence score, so a misread digit is flagged rather than quietly exported. Low-confidence rows can be reviewed side by side against the original, or excluded entirely.",
  },
  {
    icon: CalendarCheck,
    title: "Dates come out right",
    body: "03/04 means different months either side of the Atlantic. The date order is inferred from the statement itself rather than guessed, then normalised so Excel can't reinterpret it.",
  },
  {
    icon: KeyRound,
    title: "Password-protected PDFs",
    body: "Statements emailed with a password — common from ICICI, HDFC and SBI — are unlocked in your browser. The password is used on your device and never sent anywhere.",
  },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    // A signed-in visitor normally belongs in the app, but if they were sent
    // to sign in from somewhere specific (Get Pro -> billing, say), honour
    // that rather than dropping them on the converter.
    let target = "/upload";
    try {
      const stashed = sessionStorage.getItem("balanceextract.postAuthRedirect");
      if (stashed) {
        target = stashed;
        sessionStorage.removeItem("balanceextract.postAuthRedirect");
      }
    } catch {
      /* fall through to the default */
    }
    navigate({ to: target, replace: true });
  }, [user, loading, navigate]);
  useEffect(() => {
    if (loading || user) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let tries = 0;
    const tick = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (tries++ < 20) {
        setTimeout(tick, 100);
      }
    };
    tick();
  }, [loading, user]);
  if (loading || user) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO — centered, clean, reference-style layout */}
      <section id="converter" className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-fintech" aria-hidden />
        <div
          className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-soft/40 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-6 pb-12 pt-16 lg:pt-24">
          <ScrollReveal className="text-center">
            <div className="mb-5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-card px-3.5 py-1.5 text-xs font-semibold text-emerald shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacy through architecture — zero server uploads
              </span>
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Free Bank Statement Converter <span className="text-emerald">to Excel & CSV</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {/*
                Load-bearing phrases, kept deliberately short. An earlier
                version restored every dropped keyword into this one paragraph
                and it grew to ~60 words, pushing the dropzone -- the actual
                conversion -- below the fold on mobile. Keywords are now spread
                across the H1, this paragraph and the tag row rather than
                stacked here. Any edit needs to check both length AND terms.

                Held here: "bank statement to Excel software" (1,600/mo, KD 10),
                "convert bank statement to Excel" (480/mo, KD 2, $10.22 CPC),
                "convert PDF to CSV" (2,400/mo). Bank coverage moved to a tag.
              */}
              The{" "}
              <strong className="font-semibold text-ink">bank statement to Excel software</strong>{" "}
              that runs entirely on your device. Convert bank statement to Excel, convert PDF to CSV
              and more — every row balance-checked before you export.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <ClaimTag tone="local">On-device only</ClaimTag>
              <ClaimTag tone="unlimited">No page cap on Lifetime</ClaimTag>
              <ClaimTag tone="free">23+ banks · US UK CA IN</ClaimTag>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-10 max-w-2xl" delay={0.1}>
            <EmbeddedConverter />
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-8 max-w-3xl" delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <TrustPill icon={Check} label="No signup required" />
              <TrustPill icon={Lock} label="Nothing uploaded — runs in your browser" />
              <TrustPill
                icon={InfinityIcon}
                label="No page cap on Lifetime — do a full year at once"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-8 max-w-3xl" delay={0.25}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald" />
                Tested on 23+ bank layouts
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald" />
                Reads scans & photos
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald" />
                Exports to Excel, CSV & QuickBooks
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mt-8 text-center" delay={0.3}>
            <span className="text-sm text-muted-foreground">Need more than the demo? </span>
            <Link
              to="/signin"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald hover:underline"
            >
              Start free with 10 pages <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* FEATURE CARDS — reference-style row */}
      <section className="border-b border-border bg-surface-muted/20 py-14">
        <div className="mx-auto max-w-7xl px-6">
          {/* 6 across on desktop. Bodies are deliberately one line -- at this
              width anything longer wraps to five lines and the row loses its
              scannability, which is the only reason to have a row. */}
          <ScrollRevealGroup className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {FEATURES.map((f) => (
              <ScrollRevealItem key={f.title}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 text-center transition hover:border-emerald/30 hover:shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-soft text-emerald">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* BATCH → WORKBOOK — shipped since early on, never mentioned anywhere */}
      <section className="border-b border-border bg-surface-muted/20 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <ScrollReveal>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
              Batch conversion
            </div>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A year of statements, one workbook
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Drop twelve monthly PDFs at once and get a single Excel file back — with each
              statement on its own named tab, not merged into one undifferentiated sheet you then
              have to pull apart by hand.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "One tab per statement, named after the file it came from",
                "Mix banks freely — each is detected and parsed on its own terms",
                "Prefer everything on one sheet? It's a toggle on the export screen",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <WorkbookAnimation />
          </ScrollReveal>
        </div>
      </section>

      {/* ACCURACY — the checks that already run but were never mentioned */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
              Accuracy
            </div>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Getting the numbers out is the easy part
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Any tool can pull text off a PDF. The question that matters is whether the figures are
              right — so BalanceExtract checks its own work and tells you where it isn't sure.
            </p>
          </ScrollReveal>

          <ScrollRevealGroup className="mt-12 grid gap-5 sm:grid-cols-2">
            {ACCURACY.map((f) => (
              <ScrollRevealItem key={f.title}>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-6 transition hover:border-emerald/30 hover:shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-soft text-emerald">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* BANK SUPPORT */}
      <section id="banks" className="border-b border-border bg-surface-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
              US, UK, Canada & India
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A bank statement converter tested against real statements
            </h2>
            <p className="mt-4 text-muted-foreground">
              Named support for these banks today. Statements from other banks go through the same
              generic parsing engine, and every row it isn't sure about is flagged for you to check
              before export — so you always know what to trust.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3">
            {banks.map((b) => (
              <div
                key={b}
                className="flex h-16 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-ink/80"
              >
                {b}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don't see yours?{" "}
            <Link to="/contact" className="font-medium text-emerald hover:underline">
              Request a bank profile →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — animated 4-step timeline */}
      <HowItWorksTimeline />

      {/* REVIEW EVERY TRANSACTION, SIDE BY SIDE */}
      <TransactionSideBySide />

      {/* STATS BAR */}
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollRevealGroup className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              ["6", "Export formats"],
              ["0", "Bytes uploaded to any server, ever"],
              ["6+", "Countries with bank support"],
              ["∞", "Pages per conversion, no caps with Lifetime"],
            ].map(([stat, label]) => (
              <ScrollRevealItem key={label}>
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-emerald sm:text-5xl">
                    {stat}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground sm:text-sm">{label}</div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* CAPABILITY GRID */}
      <CapabilityGrid />

      {/* SECURITY */}
      <section id="security" className="border-b border-border bg-ink py-20 text-background">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald">
              <ShieldCheck className="h-3.5 w-3.5" /> Why on-device matters
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your bank statements never leave your device.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-background/70">
              Competing "converters" upload your PDF to their servers, parse it there, then email
              you the result. BalanceExtract parses everything locally using WebAssembly — the file
              never touches the network, even though the page itself is a normal web app you load
              online.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Zero server-side processing of your statement — no logs, no retention",
                "Your file is parsed entirely on your device, not uploaded anywhere",
                "Open, auditable client-side pipeline",
                "No account required for Free — only needed to upgrade to Lifetime",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  <span className="text-background/85">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-emerald/90">
              <div className="mb-2 text-background/40">// network activity during conversion</div>
              <div>[balanceextract] loading pdf.wasm ................. ok</div>
              <div>[balanceextract] parsing hdfc-statement-oct.pdf</div>
              <div>[balanceextract] page 1 → 14 transactions</div>
              <div>[balanceextract] page 2 → 22 transactions</div>
              <div>[balanceextract] ...</div>
              <div className="mt-2 text-emerald">[balanceextract] uploads to server: 0</div>
              <div className="text-emerald">[balanceextract] pdf leaves device: never</div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-background/60">
              <Lock className="h-3.5 w-3.5" />
              You can verify this in your browser's DevTools → Network tab.
            </div>
          </div>
        </div>
      </section>

      {/* MANUAL ENTRY VS LEDGERLOCAL */}
      <ComparisonSection />

      {/* ACCOUNTING-STACK LOGOS */}
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exports straight into the tools you already use
          </div>
          <ScrollRevealGroup className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {["QuickBooks", "Tally", "Xero", "Google Sheets"].map((name) => (
              <ScrollRevealItem key={name}>
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-ink/80 transition hover:border-emerald/40 hover:text-ink"
                >
                  {name}
                </Link>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="border-b border-border bg-surface-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Simple, flat pricing
            </h2>
          </ScrollReveal>
          {/* items-stretch + h-full so both cards match height regardless of
              how much copy each carries -- previously they were sized by
              their own prose and visibly mismatched. The CTA is pushed down
              with mt-auto so the buttons line up too. */}
          <ScrollRevealGroup className="mt-10 grid items-stretch gap-5 sm:grid-cols-2">
            <ScrollRevealItem className="h-full">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Free
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-ink">$0</span>
                  <span className="text-sm text-muted-foreground">no signup required</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prove it works on a real statement first.
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {[
                    `${ANONYMOUS_MAX_PAGES} pages per conversion, no account at all`,
                    "As many separate conversions as you like",
                    `Sign up free for a ${SIGNED_IN_MAX_PAGES}-page lifetime allowance`,
                    "Excel and CSV export",
                    "Everything processed on your device",
                  ].map((f) => (
                    <li key={f} className="flex gap-2.5 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/upload"
                  className="mt-7 inline-flex h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold text-ink transition hover:border-emerald/50 hover:text-emerald"
                >
                  Start converting
                </Link>
              </motion.div>
            </ScrollRevealItem>

            <ScrollRevealItem className="h-full">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-emerald bg-ink p-7 text-background shadow-lg"
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald/20 blur-3xl"
                  aria-hidden
                />
                <CornerRibbon>No page cap</CornerRibbon>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald">
                    BalanceExtract Lifetime
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">${LIFETIME_PRICE_USD}</span>
                  <span className="text-sm text-background/60">once · lifetime</span>
                </div>
                <p className="mt-2 text-sm text-background/70">
                  One payment. No subscription, no renewal, ever.
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {[
                    "Unlimited pages and unlimited conversions, forever",
                    "A full year, every account, in one sitting",
                    "All seven export formats, including Tally XML",
                    "Multi-statement workbooks with a tab per statement",
                    "Everything in Free, still fully on-device",
                  ].map((f) => (
                    <li key={f} className="flex gap-2.5 text-background/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/account/billing"
                  className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-emerald text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-emerald/90"
                >
                  Get lifetime access
                </Link>
              </motion.div>
            </ScrollRevealItem>
          </ScrollRevealGroup>
          <div className="mt-8 text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald hover:underline"
            >
              See full pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <HomepageFaq />

      {/* CTA */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Try it now. No signup, no credit card.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Convert your first statements free. Upgrade to Lifetime for unlimited pages — one
            payment, no credits, no per-page fees, ever again.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-background transition hover:bg-ink/90"
            >
              <Upload className="h-4 w-4" /> Convert a statement
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-ink transition hover:bg-surface-muted"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function TrustPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-emerald" />
      {label}
    </span>
  );
}
