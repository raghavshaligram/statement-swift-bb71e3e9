import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type SubscriptionRow = {
  status: string;
  plan_id: string | null;
  paypal_subscription_id: string;
  created_at: string;
};

/**
 * The user's most recent subscription row. `status` is written by the
 * paypal-webhook edge function (the source of truth) -- the browser only
 * ever reads it here.
 */
export function useSubscription(refreshKey = 0) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("subscriptions")
      .select("status, plan_id, paypal_subscription_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setSubscription((data as SubscriptionRow) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  const isPro = subscription?.status === "active";
  return { subscription, isPro, loading };
}
