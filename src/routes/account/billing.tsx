import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, CreditCard } from "lucide-react";
import { AccountShell } from "@/components/account-shell";
import { usePageUsage } from "@/hooks/use-page-usage";
import { SIGNED_IN_MAX_PAGES, LIFETIME_PRICE_USD } from "@/lib/pricing-constants";
import { useSubscription, planLabel } from "@/hooks/use-subscription";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";

export const Route = createFileRoute("/account/billing")({
  head: () => ({
    meta: [
      { title: "Billing & subscription — BalanceExtract" },
      {
        name: "description",
        content:
          "Manage your BalanceExtract subscription, page usage, and upgrade to Pro for unlimited pages.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const FEATURES = [
  {
    label: "Pages, lifetime (PDFs + photos/scans combined)",
    free: `${SIGNED_IN_MAX_PAGES} pages`,
    pro: "Unlimited",
  },
  { label: "Excel (.xlsx) export", free: true, pro: true },
  { label: "CSV export", free: true, pro: true },
  { label: "OFX / QIF / QBO / IIF", free: false, pro: true },
  { label: "Tally XML export", free: false, pro: true },
  { label: "Side-by-side review", free: true, pro: true },
  { label: "Conversion history", free: true, pro: true },
  { label: "Priority support", free: false, pro: true },
] as const;

function Cell({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <span className="font-mono text-sm text-ink">{v}</span>;
  return v ? (
    <Check className="mx-auto h-4 w-4 text-emerald" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />
  );
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  denied: "Payment declined",
  refunded: "Refunded",
  // Kept for any historical rows from the earlier subscription-based model.
  pending: "Pending activation",
  past_due: "Payment failed",
  suspended: "Suspended",
  cancelled: "Cancelled",
  expired: "Expired",
};

function BillingPage() {
  const pageUsage = usePageUsage(0);
  const { subscription, isPro, loading: subLoading } = useSubscription();
  const used = pageUsage.used ?? 0;
  const cap = pageUsage.limit;
  const pct = Math.min(100, (used / cap) * 100);
  const statusLabel = subscription
    ? (STATUS_LABEL[subscription.status] ?? subscription.status)
    : "Free tier";
  return (
    <AccountShell
      eyebrow="Account"
      title="Billing & subscription"
      subtitle="Manage your plan, usage, and payment method."
    >
      {/* Current plan + usage */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current plan
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight text-ink">
              {subLoading ? "…" : planLabel(subscription, isPro)}
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                isPro ? "bg-emerald/10 text-emerald" : "bg-surface-muted text-muted-foreground"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {isPro
              ? "Unlimited pages and every export format are unlocked, for life. Contact us if anything looks wrong."
              : subscription
                ? "Your last payment wasn't completed (declined or refunded) — you're on the free tier. Contact us if this looks wrong, or try upgrading again below."
                : "No payment on file. Upgrade to Pro once for unlimited pages and all export formats, forever."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Page usage (lifetime)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-ink">{used}</span>
            <span className="font-mono text-sm text-muted-foreground">
              {isPro ? "pages · unlimited" : `/ ${cap} pages`}
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-emerald"
              style={{ width: `${isPro ? 100 : pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {isPro
              ? "No page cap on Pro — PDF pages and photo/scan conversions are both unlimited."
              : `${Math.max(0, cap - used)} pages remaining · doesn't reset, ever, on Free — PDF pages and photo/scan conversions draw from this same pool`}
          </div>
        </div>
      </div>

      {/* Upgrade card */}
      {!isPro && (
        <div className="mt-6 rounded-2xl border-2 border-emerald/40 bg-emerald/[0.03] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold tracking-tight text-ink">Upgrade to Pro</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlimited pages, all export formats, priority support. One payment, yours forever.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="font-mono text-4xl font-bold tracking-tight text-ink">
              ${LIFETIME_PRICE_USD}
            </span>
            <span className="font-mono text-sm text-muted-foreground">one-time · lifetime</span>
          </div>
          {/*
            PayPalCheckoutButton handles its own "checkout isn't configured
            yet" state (see that component) by asking paypal-config, so this
            renders correctly whether or not PayPal credentials are set for
            the current environment -- no separate placeholder needed here.
          */}
          <PayPalCheckoutButton />
        </div>
      )}

      {/* Refund request -- there's no "payment method on file" to manage
          here (PayPal handles the one-time charge; we never store card
          details), and no billing to "cancel" on a lifetime purchase. The
          one real thing a Pro customer might need after paying is a refund,
          so that's the only thing this card offers, and only once there's
          something to refund. */}
      {isPro && (
        <div className="mt-6 rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">Need a refund?</div>
                <div className="text-xs text-muted-foreground">
                  This was a one-time payment, so there's no subscription to cancel — just let us
                  know and we'll take care of it.
                </div>
              </div>
            </div>
            <Link
              to="/contact"
              search={{ issue: "Refund request" }}
              className="shrink-0 text-sm font-semibold text-emerald hover:underline"
            >
              Request a refund →
            </Link>
          </div>
        </div>
      )}

      {/* Comparison table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/60">
            <tr>
              <th className="px-6 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Feature
              </th>
              <th className="w-28 px-6 py-3 text-center text-sm font-semibold text-ink">Free</th>
              <th className="w-28 px-6 py-3 text-center text-sm font-semibold text-emerald">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FEATURES.map((f) => (
              <tr key={f.label}>
                <td className="px-6 py-3 text-ink">{f.label}</td>
                <td className="px-6 py-3 text-center">
                  <Cell v={f.free} />
                </td>
                <td className="px-6 py-3 text-center">
                  <Cell v={f.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AccountShell>
  );
}
