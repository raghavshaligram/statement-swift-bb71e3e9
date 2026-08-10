// Supabase Edge Function: paypal-config
//
// Returns what the frontend needs to load PayPal's JS SDK: the Client ID
// (public by design -- meant for a browser-side <script> tag, unlike the
// Client Secret, which never leaves this and the other server-side
// functions) and which environment is active. Keeping the sandbox-vs-live
// switch here, server-side, means the frontend never has to know or care
// which environment it's pointed at -- one deploy, one env var flip
// (PAYPAL_ENV), no frontend code change.
//
// Required secrets (set via `supabase secrets set`, never hardcoded):
//   PAYPAL_ENV                       "sandbox" or "live" (defaults to sandbox)
//   PAYPAL_CLIENT_ID_SANDBOX / _LIVE

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const env = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
  const suffix = env === "live" ? "LIVE" : "SANDBOX";
  const clientId = Deno.env.get(`PAYPAL_CLIENT_ID_${suffix}`);

  // Not an error -- checkout being unconfigured is a real, valid state
  // (e.g. before live credentials are set), and the frontend uses this
  // exact response shape to fall back to the "checkout isn't open yet"
  // message instead of rendering a broken button.
  if (!clientId) {
    return new Response(JSON.stringify({ configured: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ configured: true, clientId, env }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
