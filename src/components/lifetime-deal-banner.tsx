import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useSubscription, planLabel } from "@/hooks/use-subscription";
import { LIFETIME_PRICE_USD } from "@/lib/pricing-constants";

/**
 * Slim announcement strip for the lifetime Pro deal, rendered above the main
 * nav bar in SiteHeader -- one component, so it shows on every marketing
 * page (converter routes, comparison pages, blog, the homepage) without
 * needing to be added to each individually.
 *
 * Deliberately no countdown timer or fake urgency ("ends in 2 days!") --
 * this is a real, standing launch price, not a time-limited promo, and
 * inventing a deadline that doesn't exist would be misleading. The honest
 * value prop (one payment, no recurring fee, ever) is a strong enough hook
 * on its own.
 *
 * Hidden once someone's already a lifetime Pro user -- advertising an
 * upgrade to something they already bought reads as either a bug or (worse)
 * as not knowing who's visiting.
 */
export function LifetimeDealBanner() {
  const { subscription, isPro, loading } = useSubscription();

  // Also hidden while subscription status is still loading, rather than
  // flashing the banner at an already-Pro user for a moment before it
  // disappears.
  if (loading) return null;
  if (isPro && planLabel(subscription, isPro) === "Lifetime") return null;

  return (
    <div className="border-b border-emerald/20 bg-emerald text-primary-foreground">
      <Link
        to="/pricing"
        className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-center text-[13px] font-semibold transition hover:bg-emerald/90 sm:text-sm"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Lifetime Pro: <span className="font-mono">${LIFETIME_PRICE_USD}</span> once, unlimited
          pages forever &mdash; no subscription
        </span>
        <span className="hidden underline underline-offset-2 sm:inline">See pricing &rarr;</span>
      </Link>
    </div>
  );
}
