import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type SubscriptionRow = {
  status: string;
  plan_id: string | null;
  /**
   * The processor's own subscription id.
   *
   * Optional, and readable under either column name, because the repo and the
   * live database are allowed to disagree here. Lovable applies migrations to
   * the live DB by hand, so 20260805_subscriptions_provider_agnostic.sql --
   * which renames paypal_subscription_id to provider_subscription_id -- may
   * not have been run yet. Naming one of them explicitly in the select made
   * the ENTIRE query fail against the un-migrated schema, which silently drops
   * every paying user to Free rather than failing visibly.
   */
  provider_subscription_id?: string | null;
  paypal_subscription_id?: string | null;
  provider?: string | null;
  created_at: string;
};

/** Reads the subscription id under whichever column name exists. */
export function subscriptionRef(row: SubscriptionRow | null): string | null {
  return row?.provider_subscription_id ?? row?.paypal_subscription_id ?? null;
}

/**
 * The user's most recent subscription row. `status` is the source of truth for
 * Pro access and is written ONLY server-side, by whichever payment processor's
 * webhook is wired up, using the service role. The browser only ever reads it.
 *
 * PayPal was removed (see the 20260805 migration); no processor is currently
 * connected, so in practice this returns null for every user until one is.
 * Everything downstream -- upload limits, export formats, the plan badge --
 * already handles that correctly, because it is the same state a free user has
 * always been in.
 */
/**
 * Shared across every caller.
 *
 * Two real bugs came from not having this. The effect below depended on the
 * `user` OBJECT, and a new reference on each render re-fired it endlessly --
 * flipping `loading` back to true and the plan badge back to "Free", which
 * is what read as Pro status "coming and going". And every component fetched
 * independently, so the profile menu, account page and billing screen each
 * resolved at different moments and disagreed with each other on screen.
 *
 * One in-flight request per user, one cached answer, so every caller shows
 * the same thing at the same time.
 */
let cache: { userId: string; data: SubscriptionRow | null } | null = null;
let inFlight: Promise<SubscriptionRow | null> | null = null;
let inFlightUserId: string | null = null;

/** Drop the cache so the next read re-fetches (e.g. after checkout). */
export function invalidateSubscriptionCache() {
  cache = null;
  inFlight = null;
  inFlightUserId = null;
}

async function fetchSubscription(userId: string): Promise<SubscriptionRow | null> {
  if (cache && cache.userId === userId) return cache.data;
  if (inFlight && inFlightUserId === userId) return inFlight;

  inFlightUserId = userId;
  inFlight = Promise.resolve(
    supabase
    .from("subscriptions")
    // select("*") rather than naming columns: the live schema may predate
    // the provider rename, and a named column that does not exist fails the
    // whole query. The table is RLS-scoped to the caller's own row.
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .then(({ data, error }) => {
      const row = error ? null : ((data as SubscriptionRow) ?? null);
      cache = { userId, data: row };
      inFlight = null;
      inFlightUserId = null;
      return row;
    })
  );

  return inFlight;
}

export function useSubscription(refreshKey = 0) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  // Seed straight from the cache when it's already known, so a remount
  // doesn't briefly report "Free" before re-resolving.
  const cached = cache && cache.userId === userId ? cache.data : null;
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(cached);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    if (refreshKey > 0) invalidateSubscriptionCache();

    if (authLoading) return; // don't decide anything until auth is known
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    if (cache && cache.userId === userId) {
      setSubscription(cache.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchSubscription(userId).then((row) => {
      if (cancelled) return;
      setSubscription(row);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // Keyed on the user ID (a stable string) rather than the user object,
    // whose identity changes on every render and caused an endless refetch.
  }, [userId, authLoading, refreshKey]);

  const isPro = subscription?.status === "active";
  // Report "still loading" while auth itself is unresolved. Otherwise this
  // briefly answers "not Pro" during a remount, which is enough to flash
  // free-tier UI (the upgrade card) at a paying customer before correcting.
  return { subscription, isPro, loading: loading || authLoading };
}
