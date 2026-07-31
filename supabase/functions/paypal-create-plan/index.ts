// Supabase Edge Function: paypal-create-plan
//
// ONE-TIME SETUP. Creates the "LedgerLocal Pro" product and its $19/month
// plan, then returns the new Plan ID to set as PAYPAL_PLAN_ID_SANDBOX (or
// _LIVE).
//
// Why this exists as an edge function rather than only the bash script:
// it authenticates with the EXACT same credentials paypal-config uses, so
// the plan it creates is guaranteed to land in the account and environment
// the app can actually see. That makes the account-mismatch failure mode
// impossible by construction, instead of something to diagnose after the
// fact. It also needs no local bash/curl/python, which the script does.
//
// PROTECTED: requires PAYPAL_SETUP_TOKEN to be set as a secret, and for
// the caller to pass the same value. Without that this endpoint would let
// anyone create billing plans in your PayPal account. Delete the token
// secret once setup is done.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const setupToken = Deno.env.get("PAYPAL_SETUP_TOKEN")?.trim();
  if (!setupToken) {
    return json(
      {
        error: "Setup endpoint is disabled",
        detail:
          "Set a PAYPAL_SETUP_TOKEN secret to any random string to enable this one-time endpoint, " +
          "then call it again with ?token=<that value>. Remove the secret once setup is complete.",
      },
      403,
    );
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("token") ?? req.headers.get("x-setup-token");
  if (provided !== setupToken) {
    return json({ error: "Invalid or missing setup token" }, 403);
  }

  const env = (Deno.env.get("PAYPAL_ENV") ?? "sandbox").trim();
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const clientId = Deno.env.get(`PAYPAL_CLIENT_ID_${suffix}`)?.trim();
  const clientSecret = Deno.env.get(`PAYPAL_CLIENT_SECRET_${suffix}`)?.trim();

  if (!clientId || !clientSecret) {
    return json(
      {
        error: "Missing PayPal credentials",
        missing: [!clientId && `PAYPAL_CLIENT_ID_${suffix}`, !clientSecret && `PAYPAL_CLIENT_SECRET_${suffix}`].filter(
          Boolean,
        ),
      },
      503,
    );
  }

  const apiBase = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  try {
    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      return json(
        {
          error: "PayPal rejected the credentials",
          environmentChecked: env,
          paypalStatus: tokenRes.status,
          paypalError: await tokenRes.json().catch(() => null),
          clientIdLength: clientId.length,
          clientIdLooksValid: clientId.length > 50,
        },
        503,
      );
    }

    const { access_token } = await tokenRes.json();
    const stamp = Date.now();

    const productRes = await fetch(`${apiBase}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `ledgerlocal-product-${stamp}`,
      },
      body: JSON.stringify({
        name: "LedgerLocal Pro",
        description: "Unlimited bank statement conversions, no page cap, all export formats",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    });

    const product = await productRes.json();
    if (!productRes.ok || !product.id) {
      return json({ error: "Product creation failed", paypalStatus: productRes.status, paypalError: product }, 503);
    }

    const planRes = await fetch(`${apiBase}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `ledgerlocal-plan-${stamp}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        name: "LedgerLocal Pro Monthly",
        description: "$19/month flat - unlimited conversions, no page cap, all export formats",
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: "19.00", currency_code: "USD" } },
          },
        ],
        payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 3 },
      }),
    });

    const plan = await planRes.json();
    if (!planRes.ok || !plan.id) {
      return json({ error: "Plan creation failed", paypalStatus: planRes.status, paypalError: plan }, 503);
    }

    return json({
      success: true,
      environment: env,
      productId: product.id,
      planId: plan.id,
      planStatus: plan.status,
      nextSteps: [
        `Set PAYPAL_PLAN_ID_${suffix} = ${plan.id} in your secrets.`,
        "Redeploy paypal-config so it picks up the new value.",
        "Delete the PAYPAL_SETUP_TOKEN secret to disable this endpoint again.",
      ],
    });
  } catch (err) {
    return json({ error: "Setup failed", detail: err instanceof Error ? err.message : String(err) }, 500);
  }
});
