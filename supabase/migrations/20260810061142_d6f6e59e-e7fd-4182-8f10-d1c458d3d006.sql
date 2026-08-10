DROP FUNCTION IF EXISTS public.increment_page_usage(integer, integer);

CREATE OR REPLACE FUNCTION public.increment_page_usage(p_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  current_count integer;
  v_limit constant integer := 10;
begin
  if auth.uid() is null then
    return false;
  end if;
  if p_count is null or p_count <= 0 then
    return false;
  end if;

  insert into public.page_usage (user_id, lifetime_pages_used)
  values (auth.uid(), 0)
  on conflict (user_id) do nothing;

  select lifetime_pages_used into current_count
  from public.page_usage
  where user_id = auth.uid()
  for update;

  if current_count + p_count > v_limit then
    return false;
  end if;

  update public.page_usage
  set lifetime_pages_used = lifetime_pages_used + p_count,
      updated_at = now()
  where user_id = auth.uid();

  return true;
end;
$function$;

REVOKE ALL ON FUNCTION public.increment_page_usage(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_page_usage(integer) TO authenticated, service_role;