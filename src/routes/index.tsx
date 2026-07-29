import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/scroll-reveal";
import { EmbeddedConverter } from "@/components/embedded-converter";
import { HowItWorksTimeline } from "@/components/how-it-works-timeline";
import { TransactionSideBySide } from "@/components/transaction-side-by-side";
import { CapabilityGrid } from "@/components/capability-grid";
import { ComparisonSection } from "@/components/comparison-section";
import { HomepageFaq } from "@/components/homepage-faq";
import { BANK_LABELS } from "@/lib/pdf/bank-detection";
import { ANONYMOUS_MAX_PAGES, SIGNED_IN_MAX_PAGES } from "@/lib/pricing-constants";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LedgerLocal — Free Bank Statement Converter (PDF to CSV & Excel)" },
      {
        name: "description",
        content:
          "Convert PDF bank statements to CSV and Excel on your device — the bank statement to Excel software that works everywhere. Free to try, unlimited pages on Pro. Works with Chase, BofA, Wells Fargo, ICICI, HDFC, SBI, Axis, Kotak and more.",
      },
      { property: "og:title", content: "LedgerLocal — Free Bank Statement Converter (PDF to CSV & Excel)" },
      {
        property: "og:description",
        content: "100% on-device. Unlimited pages on Pro. Real software for real accountants.",
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
    body: "Your statement never leaves your device. No server upload, no logs, no retention.",
  },
  {
    icon: ScanLine,
    title: "Scans & Photos",
    body: "Built-in OCR reads scanned PDF statements and phone-photo PDFs so you can digitize paper too.",
  },
  {
    icon: Globe,
    title: "Any Bank",
    body: "Named profiles for Chase, BofA, Wells Fargo, ICICI, HDFC, SBI, Axis, Kotak and more.",
  },
  {
    icon: Layers,
    title: "Multi-Account",
    body: "Drop several PDFs from different accounts or banks and convert them together in one pass.",
  },
  {
    icon: FileOutput,
    title: "Every Format",
    body: "Excel (.xlsx), CSV, Tally XML, OFX, QIF, QBO, IIF — exports for whatever ledger you already use.",
  },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/upload", replace: true });
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
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-soft/40 to-transparent" aria-hidden />
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
              PDF to CSV, PDF to Excel, and more — the bank statement to Excel software that works
              everywhere. Convert bank statements entirely on your device. No signup, no credit card,
              works with 23+ banks across the US, UK, Canada, and India.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-10 max-w-2xl" delay={0.1}>
            <EmbeddedConverter />
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-8 max-w-3xl" delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <TrustPill icon={Check} label="No signup required" />
              <TrustPill icon={Lock} label="Bank-grade encryption on-device" />
              <TrustPill icon={InfinityIcon} label="Unlimited pages on Pro" />
            </div>
          </ScrollReveal>

          <ScrollReveal className="mx-auto mt-8 max-w-3xl" delay={0.25}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald" />
                Any bank, any layout
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
          <ScrollRevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* BANK SUPPORT */}
      <section id="banks" className="border-b border-border bg-surface-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
              Global coverage from day one
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              The bank statement converter that works with any bank's PDF
            </h2>
            <p className="mt-4 text-muted-foreground">
              Named support for these banks today, with a generic parsing engine handling
              standard statement layouts from any other bank in the meantime.
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
            <a
              href="mailto:support@ledgerlocal.com?subject=Bank%20profile%20request"
              className="font-medium text-emerald hover:underline"
            >
              Request a bank profile →
            </a>
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
              ["∞", "Pages per conversion, no caps on Pro"],
            ].map(([stat, label]) => (
              <ScrollRevealItem key={label}>
                <div className="text-center">
                  <div className="font-mono text-4xl font-bold text-emerald sm:text-5xl">{stat}</div>
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
              you the result. LedgerLocal parses everything locally using WebAssembly — the file never
              touches the network, even though the page itself is a normal web app you load online.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Zero server-side processing of your statement — no logs, no retention",
                "Your file is parsed entirely on your device, not uploaded anywhere",
                "Open, auditable client-side pipeline",
                "No account required for Free — only needed to subscribe to Pro",
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
              <div>[ledgerlocal] loading pdf.wasm ................. ok</div>
              <div>[ledgerlocal] parsing hdfc-statement-oct.pdf</div>
              <div>[ledgerlocal] page 1 → 14 transactions</div>
              <div>[ledgerlocal] page 2 → 22 transactions</div>
              <div>[ledgerlocal] ...</div>
              <div className="mt-2 text-emerald">[ledgerlocal] uploads to server: 0</div>
              <div className="text-emerald">[ledgerlocal] pdf leaves device: never</div>
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
            {[
              "QuickBooks",
              "Tally",
              "Xero",
              "Google Sheets",
            ].map((name) => (
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
          <ScrollRevealGroup className="mt-10 grid gap-5 sm:grid-cols-2">
            <ScrollRevealItem>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-ink">$0</span>
                  <span className="text-sm text-muted-foreground">no signup required</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Try instantly with no signup — up to {ANONYMOUS_MAX_PAGES} pages per conversion, as many
                  conversions as you like. Sign up free for a {SIGNED_IN_MAX_PAGES}-page lifetime allowance. Excel and CSV export.
                </p>
              </div>
            </ScrollRevealItem>
            <ScrollRevealItem>
              <div className="rounded-xl border-2 border-emerald bg-ink p-6 text-background">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald">LedgerLocal Pro</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-sm text-background/60">/ month · flat</span>
                </div>
                <p className="mt-3 text-sm text-background/70">
                  Unlimited conversions, unlimited pages, all seven export formats. No credits, no per-page fees.
                </p>
              </div>
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
            Convert your first statements free. Upgrade to Pro for unlimited pages — one flat price,
            no credits, no per-page fees.
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

function TrustPill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-emerald" />
      {label}
    </span>
  );
}
