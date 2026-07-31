// Supabase Edge Function: paypal-config
//
// Returns the values the frontend needs to render the PayPal subscribe
// button: the Client ID (public by design -- this is meant to be used in
// browser-side script tags, unlike the Client Secret) and the Plan ID for
// whichever environment (sandbox/live) is currently active. Keeping the
// sandbox-vs-live switch here, server-side, means the frontend never has
// to know or care which environment it's pointed at.

// CORS is required here: this function is called directly from the
// browser, cross-origin (your site -> supabase.co), so the browser sends
// a preflight OPTIONS request first. Without these headers and an explicit
// OPTIONS handler, the preflight fails and the real request never even
// happens -- which surfaces as the subscribe button silently falling back
// to "Checkout isn't live yet" even when every secret is set correctly.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // supabase.functions.invoke doesn't reliably send GET, so accept either
  // rather than rejecting a valid call on method alone.
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Trim everything: a trailing newline or space is easy to introduce when
  // pasting into a secrets UI, and an untrimmed plan ID silently produces a
  // malformed lookup URL that PayPal answers with a 404 -- indistinguishable
  // from a genuinely missing plan without this.
  const env = (Deno.env.get("PAYPAL_ENV") ?? "sandbox").trim();
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const clientId = Deno.env.get(`PAYPAL_CLIENT_ID_${suffix}`)?.trim();
  const planId = Deno.env.get(`PAYPAL_PLAN_ID_${suffix}`)?.trim();

  if (!clientId || !planId) {
    return new Response(
      JSON.stringify({
        error: "PayPal is not fully configured yet",
        // Deliberately reports only which names are missing, never any
        // value -- enough to debug a misconfiguration without leaking
        // anything sensitive.
        missing: [!clientId && `PAYPAL_CLIENT_ID_${suffix}`, !planId && `PAYPAL_PLAN_ID_${suffix}`].filter(Boolean),
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Verify the plan actually exists in THIS environment and is ACTIVE
  // before handing it to the frontend. Without this, a plan ID that's
  // missing, inactive, or belongs to a different PayPal account still
  // renders a working-looking button that only fails after the user
  // clicks it -- which is exactly how a RESOURCE_NOT_FOUND /
  // INVALID_RESOURCE_ID error surfaced in practice. Failing here instead
  // means the page honestly says checkout isn't available, and the reason
  // is visible rather than buried in a PayPal SDK stack trace.
  const clientSecret = Deno.env.get(`PAYPAL_CLIENT_SECRET_${suffix}`)?.trim();
  if (clientSecret) {
    try {
      const apiBase = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
      const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        const planRes = await fetch(`${apiBase}/v1/billing/plans/${planId}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!planRes.ok) {
          // Include PayPal's own error body: RESOURCE_NOT_FOUND means the
          // plan genuinely isn't in this environment, while NOT_AUTHORIZED
          // means it exists but belongs to a different account than this
          // Client ID -- two very different fixes, indistinguishable from
          // the HTTP status alone.
          let paypalError: unknown = null;
          try {
            paypalError = await planRes.json();
          } catch {
            paypalError = await planRes.text().catch(() => null);
          }
          return new Response(
            JSON.stringify({
              error: "The configured PayPal plan could not be verified",
              // The plan ID is NOT sensitive -- it's handed to the browser
              // for the subscribe button anyway -- so echoing it back is
              // safe and makes a typo or stray character immediately
              // obvious.
              planIdChecked: planId,
              environmentChecked: env,
              paypalStatus: planRes.status,
              paypalError,
              detail:
                `Credentials authenticated successfully, but PayPal could not return this plan in the ` +
                `"${env}" environment. If PayPal's error says RESOURCE_NOT_FOUND, the plan isn't in this ` +
                `environment (a plan created in the live dashboard doesn't exist in sandbox, or vice versa). ` +
                `If it says NOT_AUTHORIZED, the plan exists but was created under a different PayPal account ` +
                `than the one this Client ID belongs to.`,
            }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const plan = await planRes.json();
        if (plan.status !== "ACTIVE") {
          return new Response(
            JSON.stringify({
              error: "The configured PayPal plan is not active",
              detail: `The plan exists but its status is "${plan.status}", not "ACTIVE". Activate it in the PayPal dashboard before it can accept subscriptions.`,
            }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    } catch (err) {
      // A verification failure shouldn't hard-block checkout if PayPal's
      // API is briefly unreachable -- log it and fall through to serving
      // the config, since the button itself will surface any real problem.
      console.error("Plan verification could not complete:", err);
    }
  }

  return new Response(JSON.stringify({ clientId, planId, env }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
