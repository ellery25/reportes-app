import type { TemplateDefinition } from '../types';
import { renderPdfHtml } from './pdf-html';

export const E002_MCD_V1: TemplateDefinition = {
  code: 'E002-MCD-V1',
  name: 'Reporte de Servicio E-002-MCD-V1',
  version: '1',
  sections: [
    { key: 'header',    title: 'Información General',               order: 0 },
    { key: 'situacion', title: 'Diagnóstico',                       order: 1 },
    { key: 'trabajos',  title: 'Trabajos Realizados',               order: 2 },
    { key: 'observ',    title: 'Observaciones y Recomendaciones',   order: 3 },
    { key: 'fotos',     title: 'Registro Fotográfico',              order: 4 },
    { key: 'firmas',    title: 'Firmas',                            order: 5 },
  ],
  fields: [
    { key: 'cliente',              label: 'Cliente',                           type: 'text',          required: true,  section: 'header',    sectionOrder: 0 },
    { key: 'ciudad',               label: 'Ciudad',                            type: 'text',          required: true,  section: 'header',    sectionOrder: 1 },
    { key: 'equipo',               label: 'Equipo',                            type: 'text',          required: true,  section: 'header',    sectionOrder: 2 },
    { key: 'fecha',                label: 'Fecha',                             type: 'date',          required: true,  section: 'header',    sectionOrder: 3 },
    { key: 'marca',                label: 'Marca',                             type: 'text',          required: true,  section: 'header',    sectionOrder: 4 },
    { key: 'modelo',               label: 'Modelo',                            type: 'text',          required: true,  section: 'header',    sectionOrder: 5 },
    { key: 'situacion_reportada',  label: 'Situación Reportada',               type: 'textarea',      required: true,  section: 'situacion', sectionOrder: 0 },
    { key: 'situacion_encontrada', label: 'Situación Encontrada',              type: 'textarea',      required: true,  section: 'situacion', sectionOrder: 1 },
    { key: 'trabajos_realizados',  label: 'Trabajos Realizados',               type: 'textarea',      required: true,  section: 'trabajos',  sectionOrder: 0 },
    { key: 'observaciones',        label: 'Observaciones y/o Recomendaciones', type: 'textarea',      required: false, section: 'observ',    sectionOrder: 0 },
    { key: 'fotos',                label: 'Registro Fotográfico',              type: 'photo_gallery', required: false, section: 'fotos',     sectionOrder: 0, maxPhotos: 10 },
    { key: 'firma_ejecutado',      label: 'Firma Ejecutado',                   type: 'signature',     required: true,  section: 'firmas',    sectionOrder: 0 },
    { key: 'firma_aprobado',       label: 'Firma Aprobado',                    type: 'signature',     required: true,  section: 'firmas',    sectionOrder: 1 },
  ],
  renderPdfHtml,
};
