import { supabase } from './supabase';
import type { Report, ReportInsert, ReportUpdate } from '../lib/database.types';

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
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.ilike('client_name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
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
    // Extract top-level structured fields for searchability
    const structured: ReportUpdate = {
      form_data: formData as never,
      client_name: formData.cliente as string ?? null,
      city: formData.ciudad as string ?? null,
      equipment: formData.equipo as string ?? null,
      brand: formData.marca as string ?? null,
      model: formData.modelo as string ?? null,
      report_date: formData.fecha as string ?? null,
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

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) throw error;
  },
};
