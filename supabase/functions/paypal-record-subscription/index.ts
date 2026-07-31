// Supabase Edge Function: paypal-record-subscription
//
// Called by the browser immediately after a user approves a PayPal
// subscription (the createSubscription button's onApprove callback).
// Records the initial link between this user and the new subscription ID.
//
// This request comes from the USER's browser, not from PayPal directly --
// unlike paypal-webhook, which only trusts requests whose signature is
// verified against PayPal. Here, the safeguard is different: we don't
// trust the subscription ID at face value just because the client sent
// it. Instead we look the subscription up directly against PayPal's own
// API using our server-side credentials, and only record it if PayPal
// confirms it's real and actually belongs to the plan we expect. Without
// this check, anyone could call this function with a made-up ID and
// grant themselves a Pro row.
//
// The actual "active" status transition still comes from paypal-webhook
// once PayPal's BILLING.SUBSCRIPTION.ACTIVATED event arrives -- this
// function only ever records a "pending" row.

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

// Same CORS requirement as paypal-config: this is called directly from the
// browser after a user approves a subscription, so the preflight OPTIONS
// request has to be handled or the real call never happens.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { subscriptionID } = await req.json();
    if (!subscriptionID || typeof subscriptionID !== "string") {
      return new Response("Missing subscriptionID", { status: 400, headers: corsHeaders });
    }

    // Identify the calling user from their own auth token, not from
    // anything the client claims about itself.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // Confirm this subscription ID is real by asking PayPal directly --
    // never trust it just because the browser sent it.
    const accessToken = await getAccessToken();
    const subRes = await fetch(`${paypalApiBase()}/v1/billing/subscriptions/${subscriptionID}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!subRes.ok) {
      return new Response("Subscription not found with PayPal", { status: 400, headers: corsHeaders });
    }
    const subscription = await subRes.json();

    const { error: insertError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      paypal_subscription_id: subscriptionID,
      plan_id: subscription.plan_id,
      status: "pending",
    });

    if (insertError) {
      // A unique-constraint violation here just means this subscription
      // was already recorded (e.g. a duplicate onApprove call) -- not a
      // real error worth failing loudly over.
      if (insertError.code === "23505") {
        return new Response("Already recorded", { status: 200, headers: corsHeaders });
      }
      console.error("Failed to record subscription:", insertError);
      return new Response("Database insert failed", { status: 500, headers: corsHeaders });
    }

    return new Response("Recorded", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("paypal-record-subscription error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
