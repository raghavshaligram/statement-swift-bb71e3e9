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

// Verifies a caller's access token against the Auth API directly and
// returns their user record, or null if the token isn't a valid session.
async function getUserFromToken(token: string): Promise<{ id: string } | null> {
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    },
  });
  if (!res.ok) {
    console.error("auth: token rejected by auth API:", res.status, await res.text());
    return null;
  }
  const user = await res.json();
  return user?.id ? { id: user.id as string } : null;
}

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
    // Identify the calling user from their own auth token -- this is what
    // gets embedded as custom_id below, never anything the request body
    // claims about itself (the body isn't even read for identity here).
    //
    // Done with a direct call to the Auth API rather than
    // supabase.auth.getUser(token): with this project's opaque
    // (non-JWT) service key, the SDK path rejected perfectly valid user
    // tokens with "Auth session missing!", because it looks for a stored
    // session instead of verifying the token it was handed.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      console.error("auth: no bearer token on request");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const user = await getUserFromToken(token);
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

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
        // Digital product, nothing to ship -- without this, PayPal's
        // default is to prompt for a shipping address AND a phone number
        // on the review/card page, neither of which this checkout has any
        // use for. shipping_preference: NO_SHIPPING removes the address
        // prompt entirely; contact_preference: NO_CONTACT_INFO removes the
        // phone number prompt. Both live under payment_source.paypal in
        // the current Orders v2 API (the older, deprecated field for this
        // was a top-level application_context).
        payment_source: {
          paypal: {
            experience_context: {
              shipping_preference: "NO_SHIPPING",
              contact_preference: "NO_CONTACT_INFO",
            },
          },
        },
      }),
    });

    if (!orderRes.ok) {
      const body = await orderRes.text();
      console.error("PayPal create-order failed:", orderRes.status, body);
      return new Response("Failed to create PayPal order", { status: 502, headers: corsHeaders });
    }

    const order = await orderRes.json();
    return new Response(JSON.stringify({ orderId: order.id }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("paypal-create-order error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
