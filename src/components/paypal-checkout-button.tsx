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

    async function authHeader(): Promise<Record<string, string> | undefined> {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session ? { Authorization: `Bearer ${session.access_token}` } : undefined;
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
      } catch {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      const { data, error } = result;
      if (cancelled) return;

      if (error || !data?.configured || !data?.clientId) {
        setStatus("unavailable");
        return;
      }
      const clientId: string = data.clientId;

      const scriptId = "paypal-sdk-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&intent=capture&components=buttons`;
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
        You're on Pro — unlimited pages and every export format are unlocked now.
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
