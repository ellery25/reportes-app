export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'photo_gallery'
  | 'signature'
  | 'select'
  | 'number';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  section: string;
  sectionOrder: number;
  options?: string[];   // for 'select'
  maxPhotos?: number;   // for 'photo_gallery'
}

export interface SectionDefinition {
  key: string;
  title: string;
  order: number;
}

export interface ReportPdfData {
  report: {
    id: string;
    client_name: string | null;
    city: string | null;
    equipment: string | null;
    brand: string | null;
    model: string | null;
    report_date: string | null;
    template_code: string;
  };
  formData: Record<string, unknown>;
  photoUrls: string[];
  signatureExecutedUrl?: string;
  signatureApprovedUrl?: string;
}

export interface TemplateDefinition {
  code: string;
  name: string;
  version: string;
  sections: SectionDefinition[];
  fields: FieldDefinition[];
  renderPdfHtml: (data: ReportPdfData) => string;
}
