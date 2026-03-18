import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getTemplate } from '../templates';
import { storageService } from './storage.service';
import { reportService } from './report.service';
import type { Report } from '../lib/database.types';

export const pdfService = {
  async generateAndShare(report: Report, userId: string): Promise<string> {
    const template = getTemplate(report.template_code);
    if (!template) throw new Error(`Template ${report.template_code} not found`);

    const reportMeta = {
      id: report.id,
      client_name: report.client_name,
      city: report.city,
      equipment: report.equipment,
      brand: report.brand,
      model: report.model,
      report_date: report.report_date,
      template_code: report.template_code,
    };

    if (Platform.OS === 'web') {
      // On web: embed images as data URIs directly from form_data — no signed URLs needed
      const formData = (report.form_data as Record<string, unknown>) ?? {};

      // Collect photos from all photo_gallery fields
      const photoUrls: string[] = [];
      for (const field of template.fields) {
        if (field.type === 'photo_gallery') {
          const photos = formData[field.key] as string[] | undefined;
          if (photos?.length) photoUrls.push(...photos);
        }
      }

      // Collect signatures in order (first = executed, second = approved)
      const sigFields = template.fields.filter((f) => f.type === 'signature');
      const signatureExecutedUrl = sigFields[0] ? (formData[sigFields[0].key] as string | undefined) : undefined;
      const signatureApprovedUrl = sigFields[1] ? (formData[sigFields[1].key] as string | undefined) : undefined;

      const html = template.renderPdfHtml({
        report: reportMeta,
        formData,
        photoUrls,
        signatureExecutedUrl,
        signatureApprovedUrl,
      });

      const filename = `reporte-${(report.client_name ?? report.id).replace(/\s+/g, '-')}`;

      // Open in a new tab and trigger the browser print dialog (user selects "Guardar como PDF")
      const printUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const win = window.open(printUrl, '_blank');
      win?.addEventListener('load', () => {
        win?.print();
        setTimeout(() => URL.revokeObjectURL(printUrl), 60000);
      });

      // Mark report as completed
      const pdfPath = `web/${report.id}/${filename}.pdf`;
      await reportService.complete(report.id, pdfPath);

      return pdfPath;
    }

    // Native: resolve signed URLs and generate HTML
    const photoUrls = await storageService.getSignedUrls('reports-photos', report.photo_paths);
    const signatureExecutedUrl = report.signature_executed_path
      ? await storageService.getSignedUrl('reports-signatures', report.signature_executed_path)
      : undefined;
    const signatureApprovedUrl = report.signature_approved_path
      ? await storageService.getSignedUrl('reports-signatures', report.signature_approved_path)
      : undefined;
    const html = template.renderPdfHtml({
      report: reportMeta,
      formData: (report.form_data as Record<string, unknown>) ?? {},
      photoUrls,
      signatureExecutedUrl,
      signatureApprovedUrl,
    });

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    // Upload to storage
    const pdfPath = await storageService.uploadPdf(uri, report.id, userId);

    // Mark report as completed
    await reportService.complete(report.id, pdfPath);

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte ${report.client_name ?? report.id}`,
      });
    }

    return pdfPath;
  },

  async previewHtml(report: Report): Promise<string> {
    const template = getTemplate(report.template_code);
    if (!template) throw new Error(`Template ${report.template_code} not found`);

    const photoUrls = await storageService.getSignedUrls('reports-photos', report.photo_paths);

    return template.renderPdfHtml({
      report: {
        id: report.id,
        client_name: report.client_name,
        city: report.city,
        equipment: report.equipment,
        brand: report.brand,
        model: report.model,
        report_date: report.report_date,
        template_code: report.template_code,
      },
      formData: (report.form_data as Record<string, unknown>) ?? {},
      photoUrls,
    });
  },
};
