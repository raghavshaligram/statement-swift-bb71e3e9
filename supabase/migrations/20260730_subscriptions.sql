-- Tracks PayPal subscription status per user. This is the source of truth
-- for whether someone is Pro -- updated exclusively by the PayPal webhook
-- edge function (via the service role, which bypasses RLS), never directly
-- by the client. A user can read their own row to show billing status in
-- the UI, but cannot insert/update/delete it themselves -- that would let
-- someone grant themselves Pro access client-side.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paypal_subscription_id text not null unique,
  plan_id text not null,
  -- Mirrors PayPal's own subscription status values (lowercased):
  -- pending, active, suspended, cancelled, expired
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

-- Users can see their own subscription record (to show "You're on Pro" /
-- billing status in the UI), but cannot create or modify it.
create policy "Users can view their own subscription"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for anon/authenticated --
-- only the service role (used exclusively by the webhook edge function,
-- after verifying the event genuinely came from PayPal) can write here.
