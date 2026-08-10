-- Fixes 4 issues, all found via the platform's own security advisor.

-- =============================================================================
-- 1. increment_page_usage's limit was CALLER-SUPPLIED, not enforced
--    server-side -- a real bypass, not just an advisory nitpick.
--
--    The call itself is server-side (a Postgres RPC, atomic, race-safe),
--    but the LIMIT VALUE was an argument the client sent along with it:
--    `supabase.rpc("increment_page_usage", { p_count, p_limit })`. Nothing
--    stopped any signed-in user from opening devtools and calling
--    `supabase.rpc("increment_page_usage", { p_count: 1, p_limit: 999999 })`
--    directly, bypassing the entire free-tier page cap. The comment at the
--    call site even claimed this was safe from exactly that -- true of the
--    mechanism, false of the limit.
--
--    Fixed by hardcoding the limit inside the function itself, the same
--    reasoning already applied to LIFETIME_PRICE_USD in
--    paypal-create-order: never trust a number that crossed the network.
--    Must be kept in sync by hand with SIGNED_IN_MAX_PAGES in
--    src/lib/pricing-constants.ts -- there are now two places this number
--    lives, and both need updating together if it ever changes.
-- =============================================================================

create or replace function public.increment_page_usage(p_count integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  page_limit constant integer := 10; -- keep in sync with SIGNED_IN_MAX_PAGES
begin
  insert into public.page_usage (user_id, lifetime_pages_used)
  values (auth.uid(), 0)
  on conflict (user_id) do nothing;

  select lifetime_pages_used into current_count
  from public.page_usage
  where user_id = auth.uid()
  for update;

  if current_count + p_count > page_limit then
    return false;
  end if;

  update public.page_usage
  set lifetime_pages_used = lifetime_pages_used + p_count,
      updated_at = now()
  where user_id = auth.uid();

  return true;
end;
$$;

-- The old two-argument signature is dropped, not left dangling -- nothing
-- should still be calling it now that the frontend is updated to match.
drop function if exists public.increment_page_usage(integer, integer);

-- =============================================================================
-- 2 & 3. Both SECURITY DEFINER functions were missing an explicit REVOKE
--    FROM PUBLIC. Postgres grants EXECUTE to the PUBLIC pseudo-role by
--    default on function creation unless explicitly revoked -- the
--    original migration only ever GRANTed to `authenticated`, which reads
--    as "only signed-in users can call this" but doesn't actually say
--    anon/public can't. This is the exact gap the security advisor's
--    "Public Can Execute SECURITY DEFINER Function" finding describes.
-- =============================================================================

revoke all on function public.increment_page_usage(integer) from public;
grant execute on function public.increment_page_usage(integer) to authenticated;

revoke all on function public.get_page_usage() from public;
grant execute on function public.get_page_usage() to authenticated;

-- =============================================================================
-- 4. support-attachments accepted arbitrary files of any size -- the 15 MB
--    limit in contact.tsx (MAX_ATTACHMENT_BYTES) is a frontend-only check,
--    trivially bypassed by anyone calling the Storage API directly. The
--    bucket itself never enforced anything.
--
--    Fixed at the bucket level, which Storage enforces regardless of which
--    client made the request -- not narrowing who can upload (anon
--    submission with an attachment is the deliberate, intentional design
--    from the original migration), only constraining what.
--
--    "Ownership cannot be verified on retrieval" (the fourth finding) has
--    no separate fix here: the bucket is private and there is, deliberately,
--    no SELECT policy for anon or authenticated at all -- only the service
--    role (via the dashboard) can read these objects, so there is no
--    client-facing retrieval path to attach ownership-verification to in
--    the first place. Confirmed no other migration added one.
-- =============================================================================

update storage.buckets
set file_size_limit = 15728640, -- 15 MB, matches MAX_ATTACHMENT_BYTES in contact.tsx
    allowed_mime_types = array[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/heic',
      'image/webp',
      'text/csv',
      'text/plain'
    ]
where id = 'support-attachments';
