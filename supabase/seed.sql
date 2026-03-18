-- =============================================================
-- SEED DATA — Reportes de ejemplo
-- Reemplaza el UUID de abajo con tu user_id real de Supabase
-- (Supabase Dashboard → Authentication → Users → copia el ID)
-- =============================================================

DO $$
DECLARE
  uid UUID := (SELECT id FROM auth.users LIMIT 1);  -- toma el primer usuario registrado
BEGIN

IF uid IS NULL THEN
  RAISE EXCEPTION 'No hay usuarios en auth.users. Regístrate en la app primero.';
END IF;

-- ---- Reporte 1: Borrador (sin fotos, sin firmas) ----
INSERT INTO reports (
  user_id, template_code, status,
  client_name, city, equipment, brand, model, report_date,
  form_data
) VALUES (
  uid, 'E002-MCD-V1', 'draft',
  'Industrias Metálicas del Norte', 'Medellín',
  'Generador Eléctrico', 'Caterpillar', 'C15',
  '2026-03-10',
  '{
    "cliente":             "Industrias Metálicas del Norte",
    "ciudad":              "Medellín",
    "equipo":              "Generador Eléctrico",
    "fecha":               "10/03/2026",
    "marca":               "Caterpillar",
    "modelo":              "C15",
    "situacion_reportada": "El generador presenta falla al arranque en frío. El cliente reporta que no enciende después de períodos de inactividad superiores a 48 horas.",
    "situacion_encontrada":"Se encontró el sistema de precalentamiento (glow plugs) con dos elementos defectuosos. Batería con voltaje bajo (11.8V). Filtro de combustible saturado.",
    "trabajos_realizados": "- Reemplazo de 2 glow plugs defectuosos\n- Carga y prueba de batería (recuperó 12.6V)\n- Cambio de filtro de combustible\n- Purga del sistema de combustible\n- Prueba de arranque en frío: exitosa",
    "observaciones":       "Se recomienda revisar el estado de la batería en 3 meses. Programar mantenimiento preventivo completo para el próximo trimestre.",
    "fotos":               []
  }'::jsonb
);

-- ---- Reporte 2: Completado ----
INSERT INTO reports (
  user_id, template_code, status,
  client_name, city, equipment, brand, model, report_date,
  form_data, pdf_path
) VALUES (
  uid, 'E002-MCD-V1', 'completed',
  'Constructora Horizon S.A.S.', 'Bogotá',
  'Compresor de Aire Industrial', 'Atlas Copco', 'GA55',
  '2026-03-05',
  '{
    "cliente":             "Constructora Horizon S.A.S.",
    "ciudad":              "Bogotá",
    "equipo":              "Compresor de Aire Industrial",
    "fecha":               "05/03/2026",
    "marca":               "Atlas Copco",
    "modelo":              "GA55",
    "situacion_reportada": "El compresor genera ruido excesivo y la presión de trabajo ha disminuido de 8 bar a 5.5 bar en las últimas semanas.",
    "situacion_encontrada":"Desgaste avanzado en los rodamientos del elemento compresor. Válvula de mínima presión con fuga. Separador de aceite saturado (∆P = 1.2 bar).",
    "trabajos_realizados": "- Reemplazo de rodamientos del elemento compresor (juego completo)\n- Sustitución de la válvula de mínima presión\n- Cambio del separador de aceite\n- Cambio de aceite sintético (20L Roto-Inject Fluid)\n- Limpieza del enfriador de aire y aceite\n- Calibración del presostato a 8 bar\n- Prueba de funcionamiento: 4 horas continuas sin anomalías",
    "observaciones":       "Equipo entregado en óptimas condiciones. Se recomienda mantener el plan de mantenimiento cada 2.000 horas.",
    "fotos":               []
  }'::jsonb,
  'web/demo-completed/reporte-Constructora-Horizon.pdf'
);

-- ---- Reporte 3: Archivado ----
INSERT INTO reports (
  user_id, template_code, status,
  client_name, city, equipment, brand, model, report_date,
  form_data
) VALUES (
  uid, 'E002-MCD-V1', 'archived',
  'Planta de Alimentos Buencomer', 'Cali',
  'UPS Industrial', 'Eaton', '9PX 10kVA',
  '2026-02-18',
  '{
    "cliente":             "Planta de Alimentos Buencomer",
    "ciudad":              "Cali",
    "equipo":              "UPS Industrial",
    "fecha":               "18/02/2026",
    "marca":               "Eaton",
    "modelo":              "9PX 10kVA",
    "situacion_reportada": "La UPS emite alarma de falla de batería y no mantiene autonomía durante cortes de energía.",
    "situacion_encontrada":"Banco de baterías de 5 años con capacidad degradada al 42%. Celdas con voltaje desbalanceado (rango 11.2V - 12.8V). Módulo de carga con corriente reducida.",
    "trabajos_realizados": "- Diagnóstico completo del banco de baterías\n- Reemplazo total del banco de baterías (12 unidades 12V/9Ah)\n- Verificación y ajuste del módulo de carga\n- Reset de contadores de ciclos\n- Prueba de autonomía: 18 minutos a carga nominal (dentro del spec)",
    "observaciones":       "Garantía de baterías: 1 año. Próximo reemplazo estimado: febrero 2029.",
    "fotos":               []
  }'::jsonb
);

-- ---- Reporte 4: Borrador (reciente, sin completar) ----
INSERT INTO reports (
  user_id, template_code, status,
  client_name, city, equipment, brand, model, report_date,
  form_data
) VALUES (
  uid, 'E002-MCD-V1', 'draft',
  'Hotel Grand Palace', 'Cartagena',
  'Planta Eléctrica de Emergencia', 'Cummins', 'C250D5',
  '2026-03-17',
  '{
    "cliente": "Hotel Grand Palace",
    "ciudad":  "Cartagena",
    "equipo":  "Planta Eléctrica de Emergencia",
    "fecha":   "17/03/2026",
    "marca":   "Cummins",
    "modelo":  "C250D5",
    "situacion_reportada": "Falla en arranque automático durante simulacro de emergencia. La planta no responde a la señal del ATS.",
    "fotos": []
  }'::jsonb
);

END $$;
