# Fix "Checkout isn't live yet" on the billing page

## What's actually wrong

PayPal is configured correctly. Calling the config function directly returns:

```text
{ "configured": true, "clientId": "Afpg…", "env": "sandbox" }
```

So the credentials are in place. The problem is that the browser can never read that response: none of the four PayPal backend functions send CORS headers or answer the browser's pre-flight `OPTIONS` request. The browser blocks the call, the checkout component treats any failed call as "not configured", and shows the fallback message.

## The fix

Add standard CORS handling to all four PayPal functions:

1. `paypal-config`
2. `paypal-create-order`
3. `paypal-capture-order`
4. `paypal-webhook` (headers only — it is server-to-server, but harmless and consistent)

For each function:
- Answer `OPTIONS` with a `204` and the CORS headers instead of the current `405 Method not allowed`.
- Attach `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers` (`authorization, x-client-info, apikey, content-type`) and `Access-Control-Allow-Methods` to every response, including the error responses.

Then redeploy all four functions and confirm the PayPal buttons render on `/account/billing` in sandbox mode.

## Technical notes

- A shared `corsHeaders` constant per function (Edge functions don't share modules unless placed in `supabase/functions/_shared/`; a small `_shared/cors.ts` is the cleaner option and will be used).
- No frontend changes needed — `PayPalCheckoutButton` already handles `configured: true` and renders the SDK buttons once the call succeeds.
- Environment stays `sandbox` (per `PAYPAL_ENV`); flipping to live is just a secret change later.
