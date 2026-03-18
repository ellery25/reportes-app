export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      report_templates: {
        Row: {
          id: string;
          code: string;
          name: string;
          version: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['report_templates']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['report_templates']['Insert']>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          template_code: string;
          status: 'draft' | 'completed' | 'archived';
          client_name: string | null;
          city: string | null;
          equipment: string | null;
          brand: string | null;
          model: string | null;
          report_date: string | null;
          form_data: Json;
          photo_paths: string[];
          signature_executed_path: string | null;
          signature_approved_path: string | null;
          pdf_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          template_code: string;
          status?: 'draft' | 'completed' | 'archived';
          client_name?: string | null;
          city?: string | null;
          equipment?: string | null;
          brand?: string | null;
          model?: string | null;
          report_date?: string | null;
          form_data?: Json;
          photo_paths?: string[];
          signature_executed_path?: string | null;
          signature_approved_path?: string | null;
          pdf_path?: string | null;
        };
        Update: Partial<{
          status: 'draft' | 'completed' | 'archived';
          client_name: string | null;
          city: string | null;
          equipment: string | null;
          brand: string | null;
          model: string | null;
          report_date: string | null;
          form_data: Json;
          photo_paths: string[];
          signature_executed_path: string | null;
          signature_approved_path: string | null;
          pdf_path: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];
export type ReportTemplate = Database['public']['Tables']['report_templates']['Row'];
