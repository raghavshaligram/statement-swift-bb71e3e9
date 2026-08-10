-- Storage: replace unrestricted upload policy with owner-scoped policies
DROP POLICY IF EXISTS "Anyone can upload a support attachment" ON storage.objects;

CREATE POLICY "Users can upload their own support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'support-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SECURITY DEFINER functions: revoke public/anon EXECUTE, grant only where needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_page_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_page_usage() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_page_usage(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_page_usage(integer, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;