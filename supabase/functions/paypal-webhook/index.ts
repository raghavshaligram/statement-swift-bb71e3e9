// Supabase Edge Function: paypal-webhook
//
// Receives PAYMENT.CAPTURE.* events directly from PayPal's servers -- the
// second, independent confirmation of a purchase alongside
// paypal-capture-order (see that function's comment for why both exist:
// this covers a payment that genuinely completed but whose response never
// made it back to the browser, e.g. the tab was closed mid-flow).
//
// CRITICAL: every incoming request is verified against PayPal's own
// signature-verification endpoint before anything in it is trusted. An
// unverified POST to this URL could otherwise claim any order was paid for
// any user; verification is what makes this safe to expose publicly.
// This function must be deployed with verify_jwt = false (see
// supabase/config.toml) -- PayPal's servers cannot supply a Supabase JWT.
//
// Required secrets (set via `supabase secrets set`, never hardcoded):
//   PAYPAL_ENV                       "sandbox" or "live" (defaults to sandbox)
//   PAYPAL_CLIENT_ID_SANDBOX / _LIVE
//   PAYPAL_CLIENT_SECRET_SANDBOX / _LIVE
//   PAYPAL_WEBHOOK_ID_SANDBOX / _LIVE
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
  // Sandbox and live are registered as separate webhooks in PayPal's
  // dashboard, each with their own webhook ID -- same reason
  // PAYPAL_CLIENT_ID/_SECRET are already split by environment. Using the
  // sandbox webhook ID against a live event (or vice versa) makes every
  // verification fail, which would silently break this function's whole
  // purpose (the safety net for a payment that completed but never made
  // it back to the browser) without affecting the primary purchase flow
  // at all -- exactly the kind of failure that's invisible until someone
  // needs it.
  const env = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const webhookId = Deno.env.get(`PAYPAL_WEBHOOK_ID_${suffix}`);
  if (!webhookId) throw new Error(`Missing PAYPAL_WEBHOOK_ID_${suffix} secret`);

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

// Maps a PayPal capture event to the status we store. Returns null for
// event types we don't act on.
function statusForEvent(eventType: string): string | null {
  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      return "active";
    case "PAYMENT.CAPTURE.DENIED":
      return "denied";
    // A refund or chargeback after the fact -- Pro access is revoked, same
    // as any other processor would require.
    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED":
      return "refunded";
    default:
      return null;
  }
}

// PayPal calls this server-to-server, so CORS isn't strictly needed here --
// kept for consistency with the other three functions.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
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

    const newStatus = statusForEvent(eventType);
    if (!newStatus) {
      // Not an event we act on -- acknowledge it so PayPal doesn't retry.
      return new Response("Acknowledged, no action taken", { status: 200 });
    }

    // custom_id (set at order creation to the purchasing user's own id --
    // see paypal-create-order) is the primary way to identify who this
    // event is for. supplementary_data.related_ids.order_id is the fallback
    // match key when custom_id is absent for some reason, since
    // provider_subscription_id was written as the order id in
    // paypal-capture-order.
    const customId: string | undefined = resource.custom_id;
    const orderId: string | undefined = resource.supplementary_data?.related_ids?.order_id;

    if (!customId && !orderId) {
      console.error(
        "Webhook event has neither custom_id nor order_id; nothing to match against.",
        eventType,
      );
      return new Response("Acknowledged, no identifying id", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (customId) {
      // Upsert rather than update: this webhook can genuinely be the
      // FIRST confirmation of a purchase (if paypal-capture-order's
      // response never reached the browser), not just a follow-up to a
      // row that already exists.
      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: customId,
          provider: "paypal",
          provider_subscription_id: orderId ?? resource.id,
          plan_id: "lifetime",
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider_subscription_id" },
      );
      if (error) {
        console.error("Failed to upsert subscription by custom_id:", error);
        return new Response("Database write failed", { status: 500 });
      }
    } else {
      // No custom_id on this event (e.g. a refund event referencing the
      // capture but not echoing the original order's custom_id) -- fall
      // back to matching the row we already wrote by order id.
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("provider_subscription_id", orderId);
      if (error) {
        console.error("Failed to update subscription by order_id:", error);
        return new Response("Database update failed", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
