import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (selector: string) => void };
    };
  }
}

type Status = "loading" | "ready" | "unavailable" | "processing" | "error" | "success";

export function PayPalSubscribeButton() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Ask our own edge function for the Client ID + Plan ID, rather
      // than hardcoding sandbox-vs-live selection in the frontend --
      // matches the pattern used everywhere else this session for
      // keeping real config server-side.
      //
      // Wrapped with an explicit timeout: a hung or very slow request
      // here (network issue, a temporary Supabase problem, anything)
      // should never leave this stuck on "Loading checkout..." forever --
      // confirmed this was a real gap, not just a theoretical one, while
      // testing in an environment where the request never resolved at
      // all.
      let result: { data: { clientId?: string; planId?: string } | null; error: unknown };
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

      if (error || !data?.clientId || !data?.planId) {
        // Surface the real reason in the console -- the user-facing copy
        // stays friendly and generic, but a silent generic failure made a
        // genuine CORS misconfiguration very hard to diagnose, so log
        // enough to tell "not configured" apart from "couldn't reach the
        // function at all."
        console.warn("[LedgerLocal] Checkout unavailable:", error ?? data ?? "no response from paypal-config");
        setStatus("unavailable");
        return;
      }
      const clientId: string = data.clientId;
      const planId: string = data.planId;

      const scriptId = "paypal-sdk-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&components=buttons`;
        script.onload = () => !cancelled && renderButton(planId);
        script.onerror = () => !cancelled && setStatus("error");
        document.body.appendChild(script);
      } else {
        renderButton(planId);
      }
    }

    function renderButton(planId: string) {
      if (!window.paypal || !containerRef.current) {
        setStatus("error");
        return;
      }
      setStatus("ready");
      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "subscribe" },
          createSubscription(_data: unknown, actions: { subscription: { create: (opts: object) => Promise<string> } }) {
            return actions.subscription.create({ plan_id: planId });
          },
          async onApprove(data: { subscriptionID: string }) {
            setStatus("processing");
            const {
              data: { session },
            } = await supabase.auth.getSession();

            const { error } = await supabase.functions.invoke("paypal-record-subscription", {
              body: { subscriptionID: data.subscriptionID },
              headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            });

            if (error) {
              setErrorMessage(
                "Your payment went through, but we couldn't record it on our side. Please contact us so we can fix this manually.",
              );
              setStatus("error");
              return;
            }
            setStatus("success");
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
        Checkout isn't live yet — check back soon, or reach out via Contact if you'd like to be notified.
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="mt-5 text-sm font-medium text-emerald">
        Subscription started — this can take a moment to fully activate. Refresh this page shortly to see your Pro status.
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
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your subscription…
        </div>
      )}
      {status === "error" && errorMessage && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          {errorMessage}
        </div>
      )}
      <div id="paypal-subscribe-button-container" ref={containerRef} />
    </div>
  );
}
