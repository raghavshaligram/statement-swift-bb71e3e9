import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, ServerOff, FileText, Mail, Bot, Paperclip } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LedgerLocal" },
      {
        name: "description",
        content:
          "LedgerLocal processes PDF bank statements on your device. Learn what data we collect, how it is used, and how your financial documents stay private.",
      },
      { property: "og:title", content: "Privacy Policy — LedgerLocal" },
      {
        property: "og:description",
        content: "Your bank statements never leave your device. Read LedgerLocal's privacy practices.",
      },
    ],
  }),
  component: Privacy,
});

const sections = [
  {
    icon: ServerOff,
    title: "On-device processing",
    body: "Converting a PDF, CSV, or other statement file happens entirely inside your browser. The file itself — and every transaction in it — is read, parsed, and exported without ever being sent to our servers. You can verify this yourself: open your browser's DevTools Network tab during a conversion and watch for outbound requests. There won't be any. There is exactly one exception to this, described below under \"Contact and support requests.\"",
  },
  {
    icon: Shield,
    title: "What we collect",
    body: "Using LedgerLocal without an account (up to 6 pages per conversion) requires nothing from you — no email, no tracking, nothing stored about you at all. Creating a free account gets you a larger page allowance; this requires an email address and password, handled by our authentication provider, Supabase, and we track a single running count of how many pages you've converted (a number, not the statement content itself) so we can enforce that allowance. We do not currently run any product analytics, error tracking, or usage-analytics tooling — we simply don't collect that data today.",
  },
  {
    icon: Lock,
    title: "Pro billing",
    body: "Pro subscription billing is not live yet. When it launches, payment will be handled by a third-party payment processor (such as Stripe) who collects and stores your card details directly under their own security standards — LedgerLocal itself never sees or stores your full card number. This section will be updated with the specific processor's name once billing is active.",
  },
  {
    icon: FileText,
    title: "Cookies and local storage",
    body: "We use your browser's local storage (not cookies) to keep you signed in between visits. That's it — no advertising cookies, no third-party tracking pixels, no cross-site tracking of any kind. You can clear this at any time through your browser settings; you'll simply need to sign in again.",
  },
  {
    icon: Bot,
    title: "The help assistant",
    body: "The chat assistant available on every page answers questions by matching what you type against a fixed set of pre-written answers, entirely in your browser — it is not connected to any AI service, and nothing you type into it is sent anywhere. If that ever changes, we'll update this policy and the assistant's own description before it does.",
  },
  {
    icon: Paperclip,
    title: "Contact and support requests",
    body: "If you reach out via our Contact page and choose to attach a statement that isn't converting correctly, that specific file is uploaded to our support system — this is the one real exception to on-device processing on this site, and it only happens if you actively choose to attach a file and confirm you understand it will be uploaded. We use it solely to diagnose the issue you've reported, and it is not accessible to anyone outside our support process.",
  },
  {
    icon: Mail,
    title: "Your rights and contact",
    body: "You can request access to, correction of, or deletion of your account data (email, password, page-usage count) at any time via our Contact page. Because statement content is processed locally and never reaches us, there is generally nothing for us to delete on that front — the one exception being a file you've explicitly attached to a support request, which we'll delete on request.",
  },
];

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald">Privacy</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your bank statements are processed on your device, not on our servers. This page explains exactly
            what we do and do not collect, with no exception left unstated.
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
            <h2 className="text-xl font-semibold text-ink">Questions?</h2>
            <p className="mt-2 text-muted-foreground">
              If you have any questions about this Privacy Policy or your data, reach out via our{" "}
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
