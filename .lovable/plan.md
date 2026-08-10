# Fix "we couldn't confirm your payment"

## What's actually happening

The payment does go through at PayPal. It fails on our side at the last step: writing the purchase record.

The backend log for the capture step shows:

```text
Failed to record lifetime purchase:
  code: "PGRST204"
  message: "Could not find the 'provider' column of 'subscriptions' in the schema cache"
```

The purchase-recording code writes two columns — `provider` and `provider_subscription_id` — but the live database table still has the older shape: `paypal_subscription_id`, and no `provider` column at all. A migration renaming those columns exists in the repo (`20260805_subscriptions_provider_agnostic.sql`) but was never applied to the database, so code and database are out of sync. Every capture ends in a database write failure, which is exactly the message you're seeing.

Confirmed live table columns today: `id, user_id, paypal_subscription_id, plan_id, status, created_at, updated_at`.

## The fix

1. Apply a new idempotent migration that brings the table to the shape the code expects:
   - rename `paypal_subscription_id` to `provider_subscription_id` (only if it still exists), keeping its unique constraint — that constraint is what makes the purchase write safely repeatable
   - add `provider text not null default 'paypal'`
   - re-assert write grants for the backend role and read grants for signed-in users, leaving the existing RLS policy (users read only their own row, writes are server-side only) untouched
2. Regenerate the database types so the frontend and the recording code agree on the new column names.
3. Redeploy `paypal-capture-order` and `paypal-webhook` (unchanged code, but they should be running against the corrected schema).
4. Verify end to end: run a sandbox purchase and confirm a row appears with `status = 'active'`, `plan_id = 'lifetime'`, and that the billing page flips to Pro.

## Recovering the payments you already made

Any real capture that hit this error took the buyer's money without granting Pro. After the schema fix I'll list the affected PayPal orders from the backend logs and insert the missing rows so those accounts get Pro without paying again. If you have order IDs or the buyer emails, share them and I'll match them directly.

## Technical notes

- `subscriptions` write path stays service-role only; no client-side grant of Pro.
- The upsert uses `onConflict: "provider_subscription_id"`, so replaying a capture or a duplicate webhook remains safe.
- `src/hooks/use-subscription.ts` already reads either column name, so no frontend change is needed beyond regenerated types.
