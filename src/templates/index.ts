import { E002_MCD_V1 } from './e002-mcd-v1/definition';
import type { TemplateDefinition } from './types';

export const TEMPLATES: TemplateDefinition[] = [
  E002_MCD_V1,
  // Add future templates here — one import + one array entry
];

export const getTemplate = (code: string): TemplateDefinition | undefined =>
  TEMPLATES.find((t) => t.code === code);

export { type TemplateDefinition, type FieldDefinition, type SectionDefinition, type ReportPdfData } from './types';
