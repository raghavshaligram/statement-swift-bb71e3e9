import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSubscriptionCache } from "@/hooks/use-subscription";
import { LIFETIME_PRICE_USD } from "@/lib/pricing-constants";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (selector: string) => void };
      Googlepay?: () => {
        config: () => Promise<{
          allowedPaymentMethods: Record<string, unknown>[];
          merchantInfo: Record<string, unknown>;
        }>;
        confirmOrder: (params: {
          orderId: string;
          paymentMethodData: Record<string, unknown>;
        }) => Promise<{ id: string; status: string }>;
      };
    };
    // Google Pay's own SDK global, loaded from pay.google.com -- not part
    // of our type system, kept loosely typed like window.paypal above
    // rather than hand-maintaining Google's full SDK surface.
    google?: {
      payments: {
        api: {
          PaymentsClient: new (options: Record<string, unknown>) => {
            isReadyToPay: (req: Record<string, unknown>) => Promise<{ result: boolean }>;
            createButton: (options: Record<string, unknown>) => HTMLElement;
            loadPaymentData: (req: Record<string, unknown>) => Promise<unknown>;
          };
        };
      };
    };
  }
}

type Status = "loading" | "ready" | "unavailable" | "processing" | "error" | "success";

/** What the server-side create/capture calls return, shared by every funding source. */
type OrderOutcome = { ok: true; orderId: string } | { ok: false; message: string };
type CaptureOutcome = { ok: true } | { ok: false; message: string };

/**
 * Renders PayPal's Buttons (PayPal login + card, plus Venmo when the buyer
 * is eligible) and, where available, a separate Google Pay button, for a
 * one-time lifetime Pro purchase.
 *
 * Uses the Orders API (create-order -> approve -> capture-order), not the
 * old Subscriptions API this app used to use for a recurring plan -- see
 * supabase/functions/paypal-create-order and paypal-capture-order for why:
 * a one-time capture is a much smaller API surface than a recurring
 * billing plan, and matches the lifetime-first launch decision.
 *
 * Every funding source (PayPal, Venmo, Google Pay) calls the exact same two
 * edge functions to create and capture the order -- the server has no idea
 * which button the buyer clicked, and doesn't need to. Only the client-side
 * approval flow differs between PayPal's own Buttons (createOrder/onApprove
 * callbacks) and Google Pay (confirmOrder via paypal.Googlepay(), driven by
 * Google's own payment sheet).
 */
export function PayPalCheckoutButton() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const googlePayContainerRef = useRef<HTMLDivElement>(null);

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

    async function serverErrorMessage(error: unknown): Promise<string | null> {
      // supabase-js puts the actual HTTP response on error.context for a
      // non-2xx invoke -- read its body so the real server-side reason
      // (auth failure, custom_id mismatch, PayPal decline, DB write
      // failure -- each edge function returns a distinct message) is
      // available to callers instead of just "it errored".
      const context = (error as { context?: Response } | null)?.context;
      if (!context || typeof context.text !== "function") return null;
      try {
        return await context.text();
      } catch {
        return null;
      }
    }

    // Shared by every funding source -- see the component doc comment.
    async function createServerOrder(): Promise<OrderOutcome> {
      const headers = await authHeader();
      if (!headers) {
        return {
          ok: false,
          message: "Your session has expired. Please sign in again to continue.",
        };
      }
      const { data, error } = await supabase.functions.invoke("paypal-create-order", { headers });
      if (error || !data?.orderId) {
        const serverMessage = await serverErrorMessage(error);
        console.error("paypal-create-order failed:", { error, serverMessage, data });
        return {
          ok: false,
          message:
            serverMessage === "Unauthorized"
              ? "Your session has expired. Please sign in again to continue."
              : "Something went wrong starting checkout. Please try again.",
        };
      }
      return { ok: true, orderId: data.orderId as string };
    }

    async function captureServerOrder(orderId: string): Promise<CaptureOutcome> {
      const headers = await authHeader();
      const { data: captureData, error } = await supabase.functions.invoke("paypal-capture-order", {
        body: { orderId },
        headers,
      });

      if (error || captureData?.status !== "COMPLETED") {
        const serverMessage = await serverErrorMessage(error);
        console.error("paypal-capture-order failed:", {
          error,
          serverMessage,
          captureData,
          orderId,
        });
        return {
          ok: false,
          message:
            captureData?.status && captureData.status !== "COMPLETED"
              ? "PayPal didn't complete this payment (it may have been declined). No charge was made -- please try again or use a different payment method."
              : "Your payment may have gone through, but we couldn't confirm it on our side. Please contact us so we can check and fix this manually.",
        };
      }
      return { ok: true };
    }

    function loadScript(id: string, src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
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
      let result: {
        data: { configured?: boolean; clientId?: string; env?: string } | null;
        error: unknown;
      };
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
      // Google Pay's OWN environment flag is separate from PayPal's --
      // driven by the same server-side PAYPAL_ENV, since there's no
      // reason for them to ever disagree in this app.
      const googlePayEnv = data.env === "live" ? "PRODUCTION" : "TEST";

      try {
        // enable-funding=venmo: PayPal's Buttons component renders a
        // second, Venmo-branded button automatically when the buyer is
        // eligible (US-based, USD, has the Venmo app) -- no separate
        // integration beyond this query param. components=googlepay adds
        // the paypal.Googlepay() client used below.
        await loadScript(
          "paypal-sdk-script",
          `https://www.paypal.com/sdk/js?client-id=${clientId}&intent=capture&components=buttons,googlepay&enable-funding=venmo`,
        );
      } catch (err) {
        console.error("PayPal SDK failed to load:", err);
        if (!cancelled) setStatus("error");
        return;
      }
      if (cancelled) return;
      renderPayPalButtons();

      // Google Pay is loaded and set up independently of, and after, the
      // main PayPal buttons -- if this fails or the buyer/browser isn't
      // eligible, the PayPal buttons above still work on their own. Never
      // escalates to the whole component's error state.
      try {
        await loadScript("google-pay-sdk-script", "https://pay.google.com/gp/p/js/pay.js");
        if (!cancelled) await setupGooglePay(googlePayEnv);
      } catch (err) {
        console.error("Google Pay setup skipped:", err);
      }
    }

    function renderPayPalButtons() {
      if (!window.paypal || !containerRef.current) {
        setStatus("error");
        return;
      }
      setStatus("ready");
      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
          async createOrder() {
            const outcome = await createServerOrder();
            if (!outcome.ok) {
              setErrorMessage(outcome.message);
              setStatus("error");
              throw new Error(outcome.message);
            }
            return outcome.orderId;
          },
          async onApprove(data: { orderID: string }) {
            setStatus("processing");
            const outcome = await captureServerOrder(data.orderID);
            if (!outcome.ok) {
              setErrorMessage(outcome.message);
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

    async function setupGooglePay(googlePayEnv: "PRODUCTION" | "TEST") {
      if (
        !window.paypal?.Googlepay ||
        !window.google?.payments?.api ||
        !googlePayContainerRef.current
      ) {
        return;
      }

      const googlePayClient = window.paypal.Googlepay();
      const config = await googlePayClient.config();

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: googlePayEnv,
        // PAYMENT_AUTHORIZATION: keeps Google's payment sheet open until
        // onPaymentAuthorized below resolves, so the buyer sees a single
        // continuous flow -- approve in Google's sheet, we confirm and
        // capture with PayPal, then the sheet closes on success/failure --
        // rather than closing immediately and separately reporting the
        // result after the fact.
        paymentDataCallbacks: {
          onPaymentAuthorized: async (paymentData: {
            paymentMethodData: Record<string, unknown>;
          }) => {
            const orderOutcome = await createServerOrder();
            if (!orderOutcome.ok) {
              return {
                transactionState: "ERROR",
                error: { intent: "PAYMENT_AUTHORIZATION", message: orderOutcome.message },
              };
            }

            let confirmed: { id: string; status: string };
            try {
              confirmed = await googlePayClient.confirmOrder({
                orderId: orderOutcome.orderId,
                paymentMethodData: paymentData.paymentMethodData,
              });
            } catch (err) {
              console.error("Google Pay confirmOrder failed:", err);
              return {
                transactionState: "ERROR",
                error: { intent: "PAYMENT_AUTHORIZATION", message: "Payment confirmation failed." },
              };
            }

            // Strong Customer Authentication (3D Secure) is not handled
            // here -- PAYER_ACTION_REQUIRED would need a follow-up
            // initiatePayerAction() step this integration doesn't
            // implement. Treated as a decline rather than silently
            // failing, since this market (US/UK) makes SCA a real
            // possibility for some UK-issued cards.
            if (confirmed.status !== "APPROVED") {
              return {
                transactionState: "ERROR",
                error: {
                  intent: "PAYMENT_AUTHORIZATION",
                  message:
                    "This card needs additional verification that isn't supported yet. Please try a different payment method.",
                },
              };
            }

            setStatus("processing");
            const captureOutcome = await captureServerOrder(orderOutcome.orderId);
            if (!captureOutcome.ok) {
              setErrorMessage(captureOutcome.message);
              setStatus("error");
              return {
                transactionState: "ERROR",
                error: { intent: "PAYMENT_AUTHORIZATION", message: captureOutcome.message },
              };
            }

            invalidateSubscriptionCache();
            setStatus("success");
            return { transactionState: "SUCCESS" };
          },
        },
      });

      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: config.allowedPaymentMethods,
      };

      let ready: { result: boolean };
      try {
        ready = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      } catch (err) {
        console.error("Google Pay isReadyToPay check failed:", err);
        return;
      }
      if (!ready.result || cancelled || !googlePayContainerRef.current) return;

      const button = paymentsClient.createButton({
        buttonColor: "black",
        buttonType: "pay",
        buttonSizeMode: "fill",
        onClick: async () => {
          try {
            await paymentsClient.loadPaymentData({
              apiVersion: 2,
              apiVersionMinor: 0,
              allowedPaymentMethods: config.allowedPaymentMethods,
              merchantInfo: config.merchantInfo,
              transactionInfo: {
                countryCode: "US",
                currencyCode: "USD",
                totalPriceStatus: "FINAL",
                totalPrice: LIFETIME_PRICE_USD.toFixed(2),
              },
              callbackIntents: ["PAYMENT_AUTHORIZATION"],
            });
          } catch (err) {
            // Includes the buyer simply closing the Google Pay sheet --
            // not every rejection here is a real error worth surfacing.
            const isCancel = (err as { statusCode?: string })?.statusCode === "CANCELED";
            if (!isCancel) {
              console.error("Google Pay loadPaymentData failed:", err);
              setErrorMessage("Something went wrong starting Google Pay. Please try again.");
              setStatus("error");
            }
          }
        },
      });
      googlePayContainerRef.current.appendChild(button);
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
      {/* Empty when Google Pay isn't eligible (buyer/browser/merchant) --
          setupGooglePay only appends a button here when isReadyToPay
          confirms it, so there's nothing to hide/show conditionally. */}
      <div ref={googlePayContainerRef} className="mt-3" />
    </div>
  );
}
