// Supabase Edge Function: paypal-capture-order
//
// Called by the browser's onApprove callback once the buyer has approved
// payment on PayPal's side. Captures the order (this is the step that
// actually moves money), verifies PayPal itself reports it COMPLETED, and
// only then grants Pro by writing to the subscriptions table.
//
// Two safety checks beyond "the client said it worked":
//   1. The capture response's status is checked directly -- an order can
//      be approved but still fail to capture (insufficient funds, a
//      declined card backing the PayPal balance, etc.), and only a
//      genuinely COMPLETED capture grants access.
//   2. The order's custom_id (set server-side in paypal-create-order to
//      the user id who created it) is checked against the CALLING user's
//      own id. This stops someone from taking an order id that isn't
//      theirs -- found in a leaked URL, a browser history, wherever -- and
//      trying to capture it under their own account to grant themselves
//      Pro from someone else's payment.
//
// This is the primary path that grants Pro. paypal-webhook is a second,
// independent confirmation of the same event straight from PayPal's
// servers -- it exists specifically to cover the case where this function
// runs but the response never makes it back to a closed browser tab, so a
// real payment doesn't silently fail to unlock anything.
//
// Required secrets: same as paypal-create-order.

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

// See paypal-config for why these are required: the browser pre-flights
// every functions.invoke() call, and a missing CORS header blocks it.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return new Response("Missing orderId", { status: 400, headers: corsHeaders });
    }

    // Verified against the Auth API directly rather than with
    // supabase.auth.getUser(token): with this project's opaque (non-JWT)
    // service key the SDK path rejected valid user tokens with "Auth
    // session missing!", since it looks for a stored session instead of
    // checking the token it was given.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      console.error("auth: no bearer token on request");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const user = await getUserFromToken(token);
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const accessToken = await getAccessToken();
    const captureRes = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const body = await captureRes.text();
      console.error("PayPal capture failed:", captureRes.status, body);
      return new Response("Failed to capture PayPal order", { status: 502, headers: corsHeaders });
    }

    const captured = await captureRes.json();
    const purchaseUnit = captured.purchase_units?.[0];
    const customId: string | undefined =
      purchaseUnit?.custom_id ?? purchaseUnit?.payments?.captures?.[0]?.custom_id;
    const captureStatus: string | undefined = purchaseUnit?.payments?.captures?.[0]?.status;

    if (customId !== user.id) {
      // Either a genuinely different order (see the file comment on why
      // this check exists), or custom_id came back missing/unexpected --
      // either way, do not grant Pro on the caller's say-so alone.
      console.error("Order custom_id does not match calling user; refusing to grant Pro.", {
        orderId,
        customId,
        userId: user.id,
      });
      return new Response("Order does not belong to this account", {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (captureStatus !== "COMPLETED") {
      // Approved but not actually captured -- e.g. a declined funding
      // source. Nothing to grant; the buyer sees PayPal's own error.
      return new Response(JSON.stringify({ status: captureStatus ?? "unknown" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    // Idempotent by design: paypal-webhook may also write this same row
    // for the same order (see that function's comment), and a user
    // double-clicking or a retried request could call this function twice
    // for the same order too. provider_subscription_id is unique, so this
    // upsert is safe to run more than once for the same payment.
    const { error: upsertError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        provider: "paypal",
        provider_subscription_id: orderId,
        plan_id: "lifetime",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_subscription_id" },
    );

    if (upsertError) {
      console.error("Failed to record lifetime purchase:", upsertError);
      return new Response("Database write failed", { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ status: "COMPLETED" }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("paypal-capture-order error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
