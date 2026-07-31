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

  const env = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const clientId = Deno.env.get(`PAYPAL_CLIENT_ID_${suffix}`);
  const planId = Deno.env.get(`PAYPAL_PLAN_ID_${suffix}`);

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
  const clientSecret = Deno.env.get(`PAYPAL_CLIENT_SECRET_${suffix}`);
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
          return new Response(
            JSON.stringify({
              error: "The configured PayPal plan was not found",
              detail:
                `PAYPAL_PLAN_ID_${suffix} does not exist in the ${env} environment for this Client ID. ` +
                `The most common cause is creating the plan in the wrong place -- a plan made in the live ` +
                `dashboard (paypal.com) won't exist in sandbox, and vice versa -- or creating it under a ` +
                `different PayPal account than the one this Client ID belongs to.`,
              paypalStatus: planRes.status,
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
