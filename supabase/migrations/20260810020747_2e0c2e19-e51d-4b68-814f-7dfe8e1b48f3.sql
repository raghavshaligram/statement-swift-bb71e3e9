DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='subscriptions'
      AND column_name='paypal_subscription_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='subscriptions'
      AND column_name='provider_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions
      RENAME COLUMN paypal_subscription_id TO provider_subscription_id;
  END IF;
END $$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paypal';

COMMENT ON COLUMN public.subscriptions.provider IS
  'Payment processor that owns this subscription (e.g. paypal, stripe). Rows created before this column existed default to paypal.';

COMMENT ON COLUMN public.subscriptions.provider_subscription_id IS
  'The processor''s own subscription/order identifier. Unique across providers.';

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;