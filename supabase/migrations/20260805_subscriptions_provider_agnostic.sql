-- Make the subscriptions table provider-agnostic.
--
-- PayPal was removed from the app: the sandbox-to-live flow was never proven
-- end to end, and PayPal's India domestic payment restrictions made it the
-- wrong processor for this business anyway.
--
-- The TABLE is deliberately kept. It is not PayPal-specific in any meaningful
-- way -- it records "which user has an active paid subscription", which is
-- what seven places in the app read to decide Pro access. Dropping it would
-- mean rebuilding that gating from scratch for whichever processor comes next,
-- and would break upload limits, export formats and the plan badge in the
-- meantime.
--
-- Two changes, both purely about naming and future-proofing:
--   1. paypal_subscription_id -> provider_subscription_id
--   2. a `provider` column, so a future Razorpay/Paddle/Stripe integration can
--      coexist with (or replace) any historical rows without ambiguity.
--
-- The RLS posture is unchanged and still the important part: users may READ
-- their own row and nothing else. Writes remain service-role only, so no
-- client can grant itself Pro access. Whatever processor is wired up next must
-- write through a server-side webhook, exactly as before.

alter table public.subscriptions
  rename column paypal_subscription_id to provider_subscription_id;

alter table public.subscriptions
  add column if not exists provider text not null default 'unknown';

comment on column public.subscriptions.provider is
  'Payment processor that owns this subscription (e.g. razorpay, paddle, stripe). Rows created before the provider column existed are marked unknown.';

comment on column public.subscriptions.provider_subscription_id is
  'The processor''s own subscription identifier. Unique across providers; prefix if a future processor could collide.';

comment on column public.subscriptions.status is
  'Lowercased lifecycle status: pending, active, suspended, cancelled, expired. Written only by a server-side webhook using the service role.';
