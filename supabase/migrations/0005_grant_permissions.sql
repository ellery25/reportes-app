-- Grant table permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reports TO anon;

GRANT SELECT ON TABLE public.report_templates TO authenticated;
GRANT SELECT ON TABLE public.report_templates TO anon;
