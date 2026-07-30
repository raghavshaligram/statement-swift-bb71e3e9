// Supabase Edge Function: paypal-webhook
//
// Receives PayPal subscription lifecycle events (activated, cancelled,
// suspended, payment completed/failed) and updates the subscriptions
// table -- the source of truth for who's actually Pro.
//
// CRITICAL: every incoming request is verified against PayPal's own
// signature-verification endpoint before anything in it is trusted. An
// unverified POST to this URL could otherwise claim to be "subscription
// activated" for any user; verification is what makes this safe to expose
// publicly.
//
// Required secrets (set via `supabase secrets set`, never hardcoded):
//   PAYPAL_ENV                       "sandbox" or "live"
//   PAYPAL_CLIENT_ID_SANDBOX / _LIVE
//   PAYPAL_CLIENT_SECRET_SANDBOX / _LIVE
//   PAYPAL_WEBHOOK_ID
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (already present by default
//     in every Supabase Edge Function's environment)

import { createClient } from "jsr:@supabase/supabase-js@2";

function paypalApiBase(): string {
  const env = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function paypalCredentials(): { clientId: string; clientSecret: string } {
  const env = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const clientId = Deno.env.get(`PAYPAL_CLIENT_ID_${suffix}`);
  const clientSecret = Deno.env.get(`PAYPAL_CLIENT_SECRET_${suffix}`);
  if (!clientId || !clientSecret) {
    throw new Error(`Missing PayPal credentials for environment: ${env}`);
  }
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = paypalCredentials();
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal OAuth token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
  accessToken: string,
): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  if (!webhookId) throw new Error("Missing PAYPAL_WEBHOOK_ID secret");

  const verifyRes = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  if (!verifyRes.ok) return false;
  const result = await verifyRes.json();
  return result.verification_status === "SUCCESS";
}

// Maps a PayPal event type to the subscription status we store. Returns
// null for event types we don't act on (e.g. informational payment
// events we don't need to track separately from the subscription's own
// status).
function statusForEvent(eventType: string): string | null {
  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      return "active";
    case "BILLING.SUBSCRIPTION.CANCELLED":
      return "cancelled";
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      return "suspended";
    case "BILLING.SUBSCRIPTION.EXPIRED":
      return "expired";
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      return "past_due";
    default:
      return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  try {
    const accessToken = await getAccessToken();
    const verified = await verifyWebhookSignature(req.headers, rawBody, accessToken);

    if (!verified) {
      console.error("PayPal webhook signature verification failed");
      return new Response("Signature verification failed", { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type as string;
    const resource = event.resource ?? {};
    const subscriptionId: string | undefined = resource.id ?? resource.billing_agreement_id;

    const newStatus = statusForEvent(eventType);

    if (!subscriptionId || !newStatus) {
      // Not an event we act on -- acknowledge it so PayPal doesn't retry,
      // but there's nothing to update.
      return new Response("Acknowledged, no action taken", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("paypal_subscription_id", subscriptionId);

    if (error) {
      console.error("Failed to update subscription status:", error);
      return new Response("Database update failed", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
