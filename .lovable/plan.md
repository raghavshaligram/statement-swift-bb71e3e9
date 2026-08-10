# Verify PayPal live checkout

Current state (checked just now): the config endpoint returns `configured: true` with `env: "live"` and a live client ID, so the app is pointed at real PayPal, not sandbox. That only proves the client ID exists — it does not prove the live secret, order creation, capture, or webhook work.

## Verification steps

1. **Live credential check** — call the order-creation endpoint as an authenticated user and confirm PayPal returns an order ID. If the live client secret is wrong or the app isn't approved for live, this fails here with an auth error from PayPal. No money moves; an uncaptured order expires on its own.
2. **Read the function logs** for that call to confirm it hit `api-m.paypal.com` (live) and not the sandbox host.
3. **Webhook check** — confirm the configured webhook ID belongs to the live app and that the webhook endpoint verifies and accepts a live event. A webhook ID created in sandbox will silently reject every live event, which is the most common "payment succeeded but Pro never activated" cause.
4. **End-to-end real purchase (the only conclusive test)** — you buy Lifetime on the live site with your own card/PayPal account, then we confirm: the subscription row is written as active/lifetime, the billing page flips to Pro, and the webhook event was recorded. You then refund it from your PayPal dashboard. PayPal keeps the fixed fee on refunds, so the cost is a few cents plus fee, not the full price.

Steps 1–3 are read-only diagnostics I run for you. Step 4 needs you, because PayPal has no live test mode.

## Technical notes

- Step 1 uses the deployed `paypal-create-order` function with the preview session token; it does not capture, so no charge occurs.
- Step 3 compares `PAYPAL_WEBHOOK_ID` against the live app's webhook list via the PayPal API using the live credentials.
- If step 1 or 3 fails, the fix is a secret correction (`PAYPAL_CLIENT_SECRET_LIVE` or `PAYPAL_WEBHOOK_ID`), not a code change.
