import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { reportService } from '../../../src/services/report.service';
import { pdfService } from '../../../src/services/pdf.service';
import { storageService } from '../../../src/services/storage.service';
import { getTemplate } from '../../../src/templates';
import { useAuthStore } from '../../../src/stores/auth.store';
import type { Report } from '../../../src/lib/database.types';

const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b',
  completed: '#10b981',
  archived: '#9ca3af',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  completed: 'Completado',
  archived: 'Archivado',
};

export default function ViewReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [report, setReport] = useState<Report | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sigExecUrl, setSigExecUrl] = useState<string | undefined>();
  const [sigApprUrl, setSigApprUrl] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    reportService.getById(id).then(async (r) => {
      if (!r) { router.back(); return; }
      setReport(r);
      // Load signed URLs
      if (r.photo_paths.length > 0) {
        const urls = await storageService.getSignedUrls('reports-photos', r.photo_paths);
        setPhotoUrls(urls);
      }
      if (r.signature_executed_path) {
        setSigExecUrl(await storageService.getSignedUrl('reports-signatures', r.signature_executed_path));
      }
      if (r.signature_approved_path) {
        setSigApprUrl(await storageService.getSignedUrl('reports-signatures', r.signature_approved_path));
      }
    });
  }, [id]);

  async function handleGeneratePdf() {
    if (!report || !user) return;
    setGenerating(true);
    try {
      await pdfService.generateAndShare(report, user.id);
      const updated = await reportService.getById(report.id);
      if (updated) setReport(updated);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al generar PDF');
    } finally {
      setGenerating(false);
    }
  }

  async function handleArchive() {
    if (!report) return;
    Alert.alert('Archivar', '¿Archivar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar', style: 'destructive',
        onPress: async () => {
          await reportService.archive(report.id);
          router.back();
        },
      },
    ]);
  }

  if (!report) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  const template = getTemplate(report.template_code);
  const formData = (report.form_data as Record<string, unknown>) ?? {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {report.client_name ?? 'Reporte'}
        </Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[report.status] + '30' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[report.status] }]}>
            {STATUS_LABELS[report.status]}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {[
            ['Cliente', formData.cliente],
            ['Ciudad', formData.ciudad],
            ['Equipo', formData.equipo],
            ['Fecha', formData.fecha],
            ['Marca', formData.marca],
            ['Modelo', formData.modelo],
          ].map(([label, value]) => (
            <View key={label as string} style={styles.infoCell}>
              <Text style={styles.infoCellLabel}>{label as string}</Text>
              <Text style={styles.infoCellValue}>{(value as string) ?? '—'}</Text>
            </View>
          ))}
        </View>

        {/* Text sections */}
        {[
          ['Situación Reportada', formData.situacion_reportada],
          ['Situación Encontrada', formData.situacion_encontrada],
          ['Trabajos Realizados', formData.trabajos_realizados],
          ['Observaciones y/o Recomendaciones', formData.observaciones],
        ].map(([title, content]) => content ? (
          <View key={title as string} style={styles.section}>
            <Text style={styles.sectionTitle}>{(title as string).toUpperCase()}</Text>
            <Text style={styles.sectionText}>{content as string}</Text>
          </View>
        ) : null)}

        {/* Photos */}
        {photoUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REGISTRO FOTOGRÁFICO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {photoUrls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Signatures */}
        {(sigExecUrl || sigApprUrl) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FIRMAS</Text>
            <View style={styles.sigRow}>
              <View style={styles.sigBlock}>
                {sigExecUrl && <Image source={{ uri: sigExecUrl }} style={styles.sigImg} resizeMode="contain" />}
                <Text style={styles.sigLabel}>Ejecutado</Text>
              </View>
              <View style={styles.sigBlock}>
                {sigApprUrl && <Image source={{ uri: sigApprUrl }} style={styles.sigImg} resizeMode="contain" />}
                <Text style={styles.sigLabel}>Aprobado</Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {report.status === 'draft' && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/(app)/reports/${report.id}/edit`)}
            >
              <Text style={styles.editBtnText}>✏️ Editar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.pdfBtn, generating && styles.btnDisabled]}
            onPress={handleGeneratePdf}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.pdfBtnText}>📄 Generar y Compartir PDF</Text>}
          </TouchableOpacity>

          {report.status !== 'archived' && (
            <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive}>
              <Text style={styles.archiveBtnText}>Archivar</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1e3a5f', flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { paddingRight: 4 },
  backText: { color: '#fff', fontSize: 16 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  infoGrid: { backgroundColor: '#fff', borderRadius: 10, padding: 14, flexDirection: 'row',
              flexWrap: 'wrap', gap: 10 },
  infoCell: { width: '46%' },
  infoCellLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  infoCellValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  sectionTitle: { backgroundColor: '#1e3a5f', color: '#fff', fontWeight: '700',
                  fontSize: 11, padding: 10, letterSpacing: 0.8 },
  sectionText: { padding: 14, fontSize: 14, color: '#374151', lineHeight: 22 },
  photoScroll: { padding: 12 },
  photo: { width: 120, height: 90, borderRadius: 6, marginRight: 8, backgroundColor: '#f3f4f6' },
  sigRow: { flexDirection: 'row', padding: 14, gap: 14 },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigImg: { width: '100%', height: 70, backgroundColor: '#f9fafb',
            borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, marginBottom: 4 },
  sigLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  actions: { gap: 10, marginTop: 4 },
  editBtn: { borderWidth: 1.5, borderColor: '#1e3a5f', borderRadius: 8,
             padding: 14, alignItems: 'center' },
  editBtnText: { color: '#1e3a5f', fontWeight: '700', fontSize: 15 },
  pdfBtn: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 14, alignItems: 'center' },
  pdfBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  archiveBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center' },
  archiveBtnText: { color: '#9ca3af', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
});
