CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_code   TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'completed', 'archived')),

  -- Structured fields for search/indexing
  client_name     TEXT,
  city            TEXT,
  equipment       TEXT,
  brand           TEXT,
  model           TEXT,
  report_date     DATE,

  -- Full form data (flexible per template)
  form_data       JSONB NOT NULL DEFAULT '{}',

  -- File references
  photo_paths               TEXT[] NOT NULL DEFAULT '{}',
  signature_executed_path   TEXT,
  signature_approved_path   TEXT,
  pdf_path                  TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_reports_user_id     ON reports(user_id);
CREATE INDEX idx_reports_status      ON reports(status);
CREATE INDEX idx_reports_report_date ON reports(report_date DESC);
CREATE INDEX idx_reports_client_name ON reports(client_name);
CREATE INDEX idx_reports_form_data   ON reports USING GIN(form_data);
