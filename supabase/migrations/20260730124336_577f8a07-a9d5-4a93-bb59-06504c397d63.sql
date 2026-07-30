CREATE POLICY "Anyone can upload a support attachment"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'support-attachments');