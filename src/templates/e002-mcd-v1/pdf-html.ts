import type { ReportPdfData } from '../types';

export function renderPdfHtml(data: ReportPdfData): string {
  const { report, formData: d, photoUrls, signatureExecutedUrl, signatureApprovedUrl } = data;

  const photoGrid = photoUrls.length > 0
    ? photoUrls.map((url, i) => `
        <div class="photo-cell">
          <img src="${url}" alt="Foto ${i + 1}" />
        </div>`).join('')
    : '<p style="color:#aaa;font-size:9pt;padding:10px;">Sin fotos registradas</p>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; background: white; }
  .page { width: 100%; padding: 15mm; }
  @media print {
    @page { margin: 10mm; size: A4; }
    body { margin: 0; }
    .page { padding: 0; }
  }

  /* HEADER */
  .header { display: flex; justify-content: space-between; align-items: center;
            border: 2px solid #1a1a1a; margin-bottom: 0; }
  .header-logo { width: 130px; padding: 8px 12px; border-right: 2px solid #1a1a1a;
                 display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .header-logo .company { font-weight: bold; font-size: 13pt; line-height: 1.1; text-align: center; }
  .header-logo .company span { display: block; }
  .header-center { flex: 1; text-align: center; padding: 8px;
                   border-right: 2px solid #1a1a1a; font-weight: bold; font-size: 12pt; }
  .header-code { padding: 8px 12px; font-weight: bold; font-size: 10pt; white-space: nowrap; }

  /* INFO ROWS */
  .info-table { width: 100%; border-collapse: collapse; border: 2px solid #1a1a1a;
                border-top: none; margin-bottom: 0; }
  .info-table td { border: 1px solid #1a1a1a; padding: 4px 8px; font-size: 9.5pt; }
  .info-table .label { font-weight: bold; width: 70px; }
  .info-table .value { font-weight: normal; }

  /* SECTION */
  .section-title { background-color: #d9d9d9; font-weight: bold; font-size: 9pt;
                   padding: 3px 8px; border: 1px solid #1a1a1a; border-top: none;
                   text-align: center; }
  .text-block { border: 1px solid #1a1a1a; border-top: none;
                min-height: 65px; padding: 8px; font-size: 9.5pt;
                line-height: 1.6; white-space: pre-wrap; }

  /* PHOTO GRID */
  .photo-section-border { border: 1px solid #1a1a1a; border-top: none; padding: 10px; }
  .photo-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .photo-cell { width: 180px; height: 130px; overflow: hidden; border: 1px solid #ccc; }
  .photo-cell img { width: 100%; height: 100%; object-fit: cover; }

  /* SIGNATURES */
  .sig-row { border: 1px solid #1a1a1a; border-top: none;
             display: flex; min-height: 70px; }
  .sig-block { flex: 1; padding: 8px; text-align: center; }
  .sig-block:first-child { border-right: 1px solid #1a1a1a; }
  .sig-block img { height: 50px; max-width: 100%; margin-bottom: 4px; }
  .sig-label { font-size: 8.5pt; font-weight: bold; margin-top: 4px; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-logo">
      <div class="company"><span>RCE</span><span>INGENIERIA</span></div>
    </div>
    <div class="header-center">REPORTE DE SERVICIO</div>
    <div class="header-code">E-002-MCD-V1</div>
  </div>

  <!-- CLIENT INFO TABLE -->
  <table class="info-table">
    <tr>
      <td class="label">Cliente</td>
      <td class="value" colspan="3">${d.cliente ?? ''}</td>
      <td class="label">Ciudad</td>
      <td class="value">${d.ciudad ?? ''}</td>
    </tr>
    <tr>
      <td class="label">Equipo</td>
      <td class="value" colspan="3">${d.equipo ?? ''}</td>
      <td class="label">Fecha</td>
      <td class="value">${d.fecha ?? ''}</td>
    </tr>
    <tr>
      <td class="label">Marca</td>
      <td class="value" colspan="3">${d.marca ?? ''}</td>
      <td class="label">Modelo</td>
      <td class="value">${d.modelo ?? ''}</td>
    </tr>
  </table>

  <!-- SITUACIÓN REPORTADA -->
  <div class="section-title">Situacion Reportada</div>
  <div class="text-block">${d.situacion_reportada ?? ''}</div>

  <!-- SITUACIÓN ENCONTRADA -->
  <div class="section-title">Situacion Encontrada</div>
  <div class="text-block">${d.situacion_encontrada ?? ''}</div>

  <!-- TRABAJOS REALIZADOS -->
  <div class="section-title">Trabajos realizados</div>
  <div class="text-block">${d.trabajos_realizados ?? ''}</div>

  <!-- OBSERVACIONES -->
  <div class="section-title">Observaciones y/o Recomendaciones</div>
  <div class="text-block">${d.observaciones ?? ''}</div>

  <!-- REGISTRO FOTOGRÁFICO -->
  <div class="section-title">Registro Fotografico</div>
  <div class="photo-section-border">
    <div class="photo-grid">${photoGrid}</div>
  </div>

  <!-- FIRMAS -->
  <div class="sig-row">
    <div class="sig-block">
      ${signatureExecutedUrl
        ? `<img src="${signatureExecutedUrl}" alt="Firma ejecutado"/>`
        : '<div style="height:50px"></div>'}
      <div class="sig-label">Ejecutado</div>
    </div>
    <div class="sig-block">
      ${signatureApprovedUrl
        ? `<img src="${signatureApprovedUrl}" alt="Firma aprobado"/>`
        : '<div style="height:50px"></div>'}
      <div class="sig-label">Aprobado</div>
    </div>
  </div>

</div>
</body>
</html>`;
}
