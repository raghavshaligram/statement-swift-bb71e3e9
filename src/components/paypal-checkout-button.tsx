import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSubscriptionCache } from "@/hooks/use-subscription";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (selector: string) => void };
    };
  }
}

type Status = "loading" | "ready" | "unavailable" | "processing" | "error" | "success";

/**
 * Renders PayPal's Buttons for a one-time lifetime Pro purchase.
 *
 * Uses the Orders API (create-order -> approve -> capture-order), not the
 * old Subscriptions API this app used to use for a recurring plan -- see
 * supabase/functions/paypal-create-order and paypal-capture-order for why:
 * a one-time capture is a much smaller API surface than a recurring
 * billing plan, and matches the lifetime-first launch decision.
 */
export function PayPalCheckoutButton() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    // getUser() (not just getSession()) because a stored session can be
    // stale -- revoked or expired server-side while still sitting in
    // localStorage. That case is exactly what produced a 401 from
    // paypal-create-order ("Session from session_id claim in JWT does not
    // exist") while the app still believed the user was signed in, so it
    // has to be caught here and turned into "sign in again" instead of a
    // generic checkout failure.
    async function authHeader(): Promise<Record<string, string> | undefined> {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return undefined;
      const { error } = await supabase.auth.getUser();
      if (error) {
        await supabase.auth.signOut();
        return undefined;
      }
      return { Authorization: `Bearer ${session.access_token}` };
    }

    async function init() {
      // Ask our own edge function for the Client ID, rather than
      // hardcoding sandbox-vs-live selection in the frontend -- keeps
      // real config server-side, and lets the same build work against
      // either environment depending only on which secrets are set.
      //
      // Wrapped with an explicit timeout: a hung or very slow request
      // here should never leave this stuck on "Loading checkout..."
      // forever.
      let result: { data: { configured?: boolean; clientId?: string } | null; error: unknown };
      try {
        result = await Promise.race([
          supabase.functions.invoke("paypal-config", { method: "GET" }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
        ]);
      } catch (err) {
        console.error("paypal-config request failed:", err);
        if (!cancelled) setStatus("unavailable");
        return;
      }

      const { data, error } = result;
      if (cancelled) return;

      if (error || !data?.configured || !data?.clientId) {
        console.error("paypal-config returned no usable config:", { error, data });
        setStatus("unavailable");
        return;
      }
      const clientId: string = data.clientId;

      const scriptId = "paypal-sdk-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        // enable-funding=venmo: PayPal's existing Buttons component renders
        // a second, Venmo-branded button automatically when the buyer is
        // eligible (US-based, USD, has the Venmo app) -- no separate
        // integration beyond this one query param, since createOrder/
        // onApprove below already handle whichever funding source the
        // buyer picks identically.
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&intent=capture&components=buttons&enable-funding=venmo`;
        script.onload = () => !cancelled && renderButton();
        script.onerror = () => !cancelled && setStatus("error");
        document.body.appendChild(script);
      } else {
        renderButton();
      }
    }

    function renderButton() {
      if (!window.paypal || !containerRef.current) {
        setStatus("error");
        return;
      }
      setStatus("ready");
      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
          async createOrder() {
            const headers = await authHeader();
            const { data, error } = await supabase.functions.invoke("paypal-create-order", {
              headers,
            });
            if (error || !data?.orderId) {
              let serverMessage: string | null = null;
              const context = (error as { context?: Response } | null)?.context;
              if (context && typeof context.text === "function") {
                try {
                  serverMessage = await context.text();
                } catch {
                  // best-effort only
                }
              }
              console.error("paypal-create-order failed:", { error, serverMessage, data });
              setErrorMessage("Something went wrong starting checkout. Please try again.");
              setStatus("error");
              throw error ?? new Error("No orderId returned");
            }
            return data.orderId as string;
          },
          async onApprove(data: { orderID: string }) {
            setStatus("processing");
            const headers = await authHeader();
            const { data: captureData, error } = await supabase.functions.invoke(
              "paypal-capture-order",
              {
                body: { orderId: data.orderID },
                headers,
              },
            );

            if (error || captureData?.status !== "COMPLETED") {
              // supabase-js puts the actual HTTP response on error.context for
              // a non-2xx invoke -- read its body so the real server-side
              // reason (auth failure, custom_id mismatch, PayPal decline, DB
              // write failure -- paypal-capture-order returns a different
              // message for each) shows up here instead of just "it errored".
              let serverMessage: string | null = null;
              const context = (error as { context?: Response } | null)?.context;
              if (context && typeof context.text === "function") {
                try {
                  serverMessage = await context.text();
                } catch {
                  // best-effort only
                }
              }
              console.error("paypal-capture-order failed:", {
                error,
                serverMessage,
                captureData,
                orderId: data.orderID,
              });
              setErrorMessage(
                captureData?.status && captureData.status !== "COMPLETED"
                  ? "PayPal didn't complete this payment (it may have been declined). No charge was made -- please try again or use a different payment method."
                  : "Your payment may have gone through, but we couldn't confirm it on our side. Please contact us so we can check and fix this manually.",
              );
              setStatus("error");
              return;
            }

            // Reflect Pro status immediately, rather than asking the user
            // to refresh the page to see it.
            invalidateSubscriptionCache();
            setStatus("success");
          },
          onCancel() {
            setStatus("ready");
          },
          onError() {
            setErrorMessage("Something went wrong starting checkout. Please try again.");
            setStatus("error");
          },
        })
        .render(`#${containerRef.current.id}`);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "unavailable") {
    return (
      <p className="mt-5 text-xs text-muted-foreground">
        Checkout isn't live yet — check back soon, or reach out via Contact if you'd like to be
        notified.
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="mt-5 text-sm font-medium text-emerald">
        You're on Lifetime — unlimited pages and every export format are unlocked now.
      </p>
    );
  }

  return (
    <div className="mt-5">
      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading checkout…
        </div>
      )}
      {status === "processing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
        </div>
      )}
      {status === "error" && errorMessage && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          {errorMessage}
        </div>
      )}
      <div id="paypal-checkout-button-container" ref={containerRef} />
    </div>
  );
}
