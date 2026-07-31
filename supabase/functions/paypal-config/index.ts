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

  return new Response(JSON.stringify({ clientId, planId, env }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
