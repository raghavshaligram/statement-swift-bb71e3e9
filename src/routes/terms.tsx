import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE_ORIGIN } from "@/lib/site";
import { Scale, CheckCircle, AlertCircle, RefreshCcw, FileCheck, Gavel } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/terms")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/terms` }],
    meta: [
      { title: "Terms & Conditions — BalanceExtract" },
      {
        name: "description",
        content: "Read the Terms and Conditions for using BalanceExtract, the on-device bank statement to Excel and CSV converter. Plain-language, no surprises.",
      },
      { property: "og:title", content: "Terms & Conditions — BalanceExtract" },
      {
        property: "og:description",
        content: "Terms of use for BalanceExtract's on-device bank statement conversion software.",
      },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    icon: CheckCircle,
    title: "Acceptance of terms",
    body: "By accessing or using BalanceExtract, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the software. These terms apply to all visitors, users, and customers of the application.",
  },
  {
    icon: Scale,
    title: "License to use",
    body: "BalanceExtract grants you a limited, non-exclusive, non-transferable license to use the software for personal or business purposes, subject to these terms. You may not reverse-engineer, decompile, distribute, or resell the software without written permission.",
  },
  {
    icon: FileCheck,
    title: "User responsibilities",
    body: "You are responsible for the bank statements and financial files you process. You agree to use BalanceExtract only on documents you have the right to access and convert. We do not review your files and are not responsible for the accuracy of your source documents or any output generated from them.",
  },
  {
    icon: RefreshCcw,
    title: "Free tier and Pro billing",
    body: "The free tier — 6 pages per conversion with no account, or a 10-page lifetime allowance once you sign up — is available now at no cost. Pro subscription billing is not live yet; pricing shown for Pro reflects our intended launch price, not an active charge. Once billing launches, this section will be updated with the specific terms for subscribing, cancelling, and any refund policy that applies.",
  },
  {
    icon: AlertCircle,
    title: "Disclaimer and liability",
    body: "BalanceExtract is provided as-is without warranties of any kind. While we aim to produce accurate exports, you should always verify converted figures against your original statement before using them for accounting, tax, or financial reporting. To the fullest extent permitted by law, BalanceExtract shall not be liable for any indirect, incidental, or consequential damages arising from use of the software.",
  },
  {
    icon: Gavel,
    title: "Governing law",
    body: "PLACEHOLDER — this section needs your input, not a guess: which country's and state's/region's law governs these terms, and where would a dispute be resolved (e.g. courts, or an arbitration clause)? This typically follows wherever your business is legally registered. Replace this paragraph once decided — don't publish this placeholder text as-is.",
  },
];

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Terms</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">Terms & Conditions</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            These terms govern your use of BalanceExtract software and services. Please read them carefully.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: July 30, 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-12">
            {sections.map((s) => (
              <div key={s.title} className="flex gap-5">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald/10 text-emerald sm:flex">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink">{s.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-border bg-surface-muted/40 p-8">
            <h2 className="text-xl font-semibold text-ink">Changes to these terms</h2>
            <p className="mt-2 text-muted-foreground">
              We may update these Terms & Conditions from time to time. Continued use of BalanceExtract after
              changes constitutes acceptance of the revised terms. If you have questions, reach out via our{" "}
              <Link to="/contact" className="text-emerald hover:underline">
                Contact page
              </Link>
              .
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-background transition hover:bg-ink/90"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
