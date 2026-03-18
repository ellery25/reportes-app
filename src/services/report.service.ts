import { supabase } from './supabase';
import type { Report, ReportUpdate } from '../lib/database.types';

/** Converts DD/MM/YYYY to YYYY-MM-DD for Postgres DATE columns */
function toIsoDate(value: unknown): string | null {
  if (!value || String(value).trim() === '') return null;
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str; // already ISO
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return null;
}

export const reportService = {
  async createDraft(templateCode: string, userId: string): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert({ template_code: templateCode, user_id: userId, status: 'draft' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async list(filters?: { status?: string; search?: string }): Promise<Report[]> {
    let query = supabase
      .from('reports')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status as 'draft' | 'completed' | 'archived');
    }
    if (filters?.search) {
      query = query.ilike('client_name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Report[];
  },

  async update(id: string, updates: ReportUpdate): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateFormData(id: string, formData: Record<string, unknown>): Promise<void> {
    const structured: ReportUpdate = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form_data: formData as any,
      client_name: (formData.cliente as string | undefined) ?? null,
      city: (formData.ciudad as string | undefined) ?? null,
      equipment: (formData.equipo as string | undefined) ?? null,
      brand: (formData.marca as string | undefined) ?? null,
      model: (formData.modelo as string | undefined) ?? null,
      report_date: toIsoDate(formData.fecha),
    };

    const { error } = await supabase
      .from('reports')
      .update(structured)
      .eq('id', id);
    if (error) throw error;
  },

  async complete(id: string, pdfPath: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'completed', pdf_path: pdfPath })
      .eq('id', id);
    if (error) throw error;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'archived' })
      .eq('id', id);
    if (error) throw error;
  },

  async unarchive(id: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'draft' })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) throw error;
  },
};
