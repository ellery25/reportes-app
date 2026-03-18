-- Create private storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('reports-photos',     'reports-photos',     false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('reports-signatures', 'reports-signatures', false, 2097152,  ARRAY['image/png']),
  ('reports-pdfs',       'reports-pdfs',       false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies: users can only access their own files
-- (path format: {user_id}/{report_id}/filename)

CREATE POLICY "Users manage their own photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'reports-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'reports-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage their own signatures"
  ON storage.objects FOR ALL
  USING (bucket_id = 'reports-signatures' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'reports-signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage their own pdfs"
  ON storage.objects FOR ALL
  USING (bucket_id = 'reports-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'reports-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
