CREATE TABLE report_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  version     TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO report_templates (code, name, version, description) VALUES
  ('E002-MCD-V1', 'Reporte de Servicio E-002-MCD-V1', '1', 'Reporte de servicio para generadores eléctricos y equipos industriales');
