// Supabase Edge Function: paypal-create-order
//
// Creates a PayPal Order (Orders API v2, one-time payment -- NOT the
// Subscriptions/Billing Plans API the old, removed integration used) for
// the lifetime Pro price. Called by the browser right before PayPal's JS
// SDK renders its payment flow.
//
// The price is a hardcoded constant here, not anything the client sends.
// A request body could otherwise say {"amount": "0.01"} and this function
// would have no way to know that wasn't real -- so the amount charged is
// decided entirely server-side, deliberately duplicating
// LIFETIME_PRICE_USD in src/lib/pricing-constants.ts (see that file's
// comment) rather than trusting a number that crossed the network.
//
// The order's custom_id is set to the caller's own user id (verified via
// their auth token, not anything they claim). This is what lets both
// paypal-capture-order and paypal-webhook attribute a completed payment to
// the right user directly -- reading a field PayPal itself echoes back on
// every subsequent event -- rather than needing to parse or trust a PayPal
// order/capture ID as a proxy for identity.
//
// Required secrets (set via `supabase secrets set`, never hardcoded):
//   PAYPAL_ENV                       "sandbox" or "live" (defaults to sandbox)
//   PAYPAL_CLIENT_ID_SANDBOX / _LIVE
//   PAYPAL_CLIENT_SECRET_SANDBOX / _LIVE
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (already present by default
//     in every Supabase Edge Function's environment)

import { createClient } from "jsr:@supabase/supabase-js@2";

// Kept in sync by hand with src/lib/pricing-constants.ts -- see that
// file's comment for why this can't just import the frontend constant
// (this function must never trust anything that crossed the network, and
// duplicating one number here is a much smaller risk than that).
const LIFETIME_PRICE_USD = "79.00";

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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Identify the calling user from their own auth token -- this is what
    // gets embedded as custom_id below, never anything the request body
    // claims about itself (the body isn't even read for identity here).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return new Response("Unauthorized", { status: 401 });

    const accessToken = await getAccessToken();
    const orderRes = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: user.id,
            description: "BalanceExtract Pro -- lifetime",
            amount: { currency_code: "USD", value: LIFETIME_PRICE_USD },
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const body = await orderRes.text();
      console.error("PayPal create-order failed:", orderRes.status, body);
      return new Response("Failed to create PayPal order", { status: 502 });
    }

    const order = await orderRes.json();
    return new Response(JSON.stringify({ orderId: order.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("paypal-create-order error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
