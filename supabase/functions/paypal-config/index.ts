// Supabase Edge Function: paypal-config
//
// Returns the values the frontend needs to render the PayPal subscribe
// button: the Client ID (public by design -- this is meant to be used in
// browser-side script tags, unlike the Client Secret) and the Plan ID for
// whichever environment (sandbox/live) is currently active. Keeping the
// sandbox-vs-live switch here, server-side, means the frontend never has
// to know or care which environment it's pointed at.

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const env = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const clientId = Deno.env.get(`PAYPAL_CLIENT_ID_${suffix}`);
  const planId = Deno.env.get(`PAYPAL_PLAN_ID_${suffix}`);

  if (!clientId || !planId) {
    return new Response(
      JSON.stringify({ error: "PayPal is not fully configured yet" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ clientId, planId, env }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
