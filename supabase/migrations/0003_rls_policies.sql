-- Row Level Security for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reports"
  ON reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Report templates: authenticated users can read
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
  ON report_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Storage policies (run via Supabase dashboard or supabase CLI):
-- Bucket: reports-photos   (private)
-- Bucket: reports-signatures (private)
-- Bucket: reports-pdfs     (private)
--
-- Policy for each bucket:
--   SELECT/INSERT/UPDATE/DELETE where (storage.foldername(name))[1] = auth.uid()::text
