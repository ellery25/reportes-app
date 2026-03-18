import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getTemplate } from '../templates';
import type { ReportPdfData } from '../templates/types';
import { storageService } from './storage.service';
import { reportService } from './report.service';
import type { Report } from '../lib/database.types';

export const pdfService = {
  async generateAndShare(report: Report, userId: string): Promise<string> {
    const template = getTemplate(report.template_code);
    if (!template) throw new Error(`Template ${report.template_code} not found`);

    // Resolve signed URLs for photos
    const photoUrls = await storageService.getSignedUrls('reports-photos', report.photo_paths);

    // Resolve signature URLs
    const signatureExecutedUrl = report.signature_executed_path
      ? await storageService.getSignedUrl('reports-signatures', report.signature_executed_path)
      : undefined;
    const signatureApprovedUrl = report.signature_approved_path
      ? await storageService.getSignedUrl('reports-signatures', report.signature_approved_path)
      : undefined;

    const pdfData: ReportPdfData = {
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
      signatureExecutedUrl,
      signatureApprovedUrl,
    };

    const html = template.renderPdfHtml(pdfData);

    if (Platform.OS === 'web') {
      // Web: open print dialog
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      win?.print();
      return url;
    }

    // Native: generate PDF file
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
