import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Platform,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation, useFocusEffect } from 'expo-router';
import { reportService } from '../../../src/services/report.service';
import { pdfService } from '../../../src/services/pdf.service';
import { storageService } from '../../../src/services/storage.service';
import { getTemplate } from '../../../src/templates';
import { useAuthStore } from '../../../src/stores/auth.store';
import type { Report } from '../../../src/lib/database.types';

// Renders a signature that may be a data URI (SVG on native) or an HTTPS URL.
// React Native's Image can't handle SVG, so we use SvgXml/SvgUri on native.
function SignaturePreview({ uri, style }: { uri: string; style: object }) {
  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={style} resizeMode="contain" />;
  }
  // Lazy require so bundler only loads on native (react-native-svg is native-only)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SvgXml, SvgUri } = require('react-native-svg');
  if (uri.startsWith('data:image/svg+xml;base64,')) {
    const xml = atob(uri.replace('data:image/svg+xml;base64,', ''));
    return <SvgXml xml={xml} width="100%" height={70} />;
  }
  if (uri.match(/\.svg($|\?)/i) || uri.includes('/sig_')) {
    return <SvgUri uri={uri} width="100%" height={70} />;
  }
  return <Image source={{ uri }} style={style} resizeMode="contain" />;
}

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
  const navigation = useNavigation();

  function goBack() {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(app)');
  }

  const [report, setReport] = useState<Report | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sigExecUrl, setSigExecUrl] = useState<string | undefined>();
  const [sigApprUrl, setSigApprUrl] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reload report every time this screen gains focus (covers back-from-edit and status changes)
  useFocusEffect(useCallback(() => {
    if (!id) return;
    setReport(null);
    setPhotoUrls([]);
    setSigExecUrl(undefined);
    setSigApprUrl(undefined);
    setGenerating(false);
    setPdfError('');
    setConfirmDelete(false);
    setDeleting(false);

    reportService.getById(id).then(async (r) => {
      if (!r) { goBack(); return; }
      setReport(r);
      const fd = (r.form_data as Record<string, unknown>) ?? {};

      if (r.photo_paths.length > 0) {
        const urls = await storageService.getSignedUrls('reports-photos', r.photo_paths);
        setPhotoUrls(urls);
      } else {
        const formPhotos = fd.fotos as string[] | undefined;
        if (formPhotos?.length) setPhotoUrls(formPhotos);
      }

      if (r.signature_executed_path) {
        setSigExecUrl(await storageService.getSignedUrl('reports-signatures', r.signature_executed_path));
      } else {
        const sig = fd.firma_ejecutado as string | undefined;
        if (sig) setSigExecUrl(sig);
      }

      if (r.signature_approved_path) {
        setSigApprUrl(await storageService.getSignedUrl('reports-signatures', r.signature_approved_path));
      } else {
        const sig = fd.firma_aprobado as string | undefined;
        if (sig) setSigApprUrl(sig);
      }
    });
  }, [id]));

  async function handleGeneratePdf() {
    if (!report || !user) return;
    setPdfError('');
    setGenerating(true);
    try {
      await pdfService.generateAndShare(report, user.id);
      const updated = await reportService.getById(report.id);
      if (updated) setReport(updated);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Error al generar PDF');
    } finally {
      setGenerating(false);
    }
  }

  async function handleArchive() {
    if (!report) return;
    await reportService.archive(report.id);
    goBack();
  }

  async function handleUnarchive() {
    if (!report) return;
    await reportService.unarchive(report.id);
    const updated = await reportService.getById(report.id);
    if (updated) setReport(updated);
  }

  async function handleDelete() {
    if (!report) return;
    setDeleting(true);
    try {
      await reportService.delete(report.id);
      router.replace('/(app)');
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Error al eliminar');
      setDeleting(false);
      setConfirmDelete(false);
    }
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
  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
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

        {sortedSections.map((section) => {
          const sectionFields = template.fields
            .filter((f) => f.section === section.key)
            .sort((a, b) => a.sectionOrder - b.sectionOrder);

          // Header section → info grid
          if (section.key === 'header') {
            const hasAny = sectionFields.some((f) => formData[f.key]);
            if (!hasAny) return null;
            return (
              <View key={section.key} style={styles.infoGrid}>
                {sectionFields.map((f) => {
                  const val = formData[f.key] as string | undefined;
                  if (!val) return null;
                  return (
                    <View key={f.key} style={styles.infoCell}>
                      <Text style={styles.infoCellLabel}>{f.label.toUpperCase()}</Text>
                      <Text style={styles.infoCellValue}>{val}</Text>
                    </View>
                  );
                })}
              </View>
            );
          }

          // Fotos section
          if (section.key === 'fotos') {
            if (photoUrls.length === 0) return null;
            return (
              <View key={section.key} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {photoUrls.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.photo} />
                  ))}
                </ScrollView>
              </View>
            );
          }

          // Firmas section
          if (section.key === 'firmas') {
            if (!sigExecUrl && !sigApprUrl) return null;
            return (
              <View key={section.key} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                <View style={styles.sigRow}>
                  {sectionFields.map((f) => {
                    const url = f.key === 'firma_ejecutado' ? sigExecUrl : sigApprUrl;
                    if (!url) return null;
                    return (
                      <View key={f.key} style={styles.sigBlock}>
                        <SignaturePreview uri={url} style={styles.sigImg} />
                        <Text style={styles.sigLabel}>{f.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }

          // Textarea/text sections
          const filledFields = sectionFields.filter((f) => {
            const val = formData[f.key];
            return val != null && val !== '' && !(Array.isArray(val) && val.length === 0);
          });
          if (filledFields.length === 0) return null;

          return (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              {filledFields.map((f) => (
                <View key={f.key} style={styles.fieldBlock}>
                  {filledFields.length > 1 && (
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                  )}
                  <Text style={styles.sectionText}>{String(formData[f.key])}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Actions */}
        <View style={styles.actions}>
          {pdfError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorMsg}>{pdfError}</Text>
            </View>
          ) : null}

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

          {report.status === 'archived' ? (
            <TouchableOpacity
              style={[styles.unarchiveBtn, generating && styles.btnDisabled]}
              onPress={handleUnarchive}
              disabled={generating}
            >
              <Text style={styles.unarchiveBtnText}>↩ Desarchivar (volver a borrador)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.archiveBtn, generating && styles.btnDisabled]}
              onPress={handleArchive}
              disabled={generating}
            >
              <Text style={styles.archiveBtnText}>Archivar</Text>
            </TouchableOpacity>
          )}

          {!confirmDelete ? (
            <TouchableOpacity
              style={[styles.deleteBtn, generating && styles.btnDisabled]}
              onPress={() => setConfirmDelete(true)}
              disabled={generating}
            >
              <Text style={styles.deleteBtnText}>🗑 Eliminar reporte</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>¿Eliminar permanentemente? Esta acción no se puede deshacer.</Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity style={styles.cancelConfirmBtn} onPress={() => setConfirmDelete(false)}>
                  <Text style={styles.cancelConfirmText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDeleteBtn, (deleting || generating) && styles.btnDisabled]}
                  onPress={handleDelete}
                  disabled={deleting || generating}
                >
                  {deleting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.confirmDeleteText}>Sí, eliminar</Text>}
                </TouchableOpacity>
              </View>
            </View>
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
  infoCellLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700', marginBottom: 2, letterSpacing: 0.4 },
  infoCellValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  sectionTitle: { backgroundColor: '#1e3a5f', color: '#fff', fontWeight: '700',
                  fontSize: 11, padding: 10, letterSpacing: 0.8 },
  fieldBlock: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  fieldLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.4, marginBottom: 4 },
  sectionText: { fontSize: 14, color: '#374151', lineHeight: 22, paddingBottom: 10 },
  photoScroll: { padding: 12 },
  photo: { width: 120, height: 90, borderRadius: 6, marginRight: 8, backgroundColor: '#f3f4f6' },
  sigRow: { flexDirection: 'row', padding: 14, gap: 14 },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigImg: { width: '100%', height: 70, backgroundColor: '#f9fafb',
            borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, marginBottom: 4 },
  sigLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  actions: { gap: 10, marginTop: 4 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
              borderRadius: 8, padding: 12 },
  errorMsg: { color: '#dc2626', fontSize: 13, lineHeight: 18 },
  editBtn: { borderWidth: 1.5, borderColor: '#1e3a5f', borderRadius: 8,
             padding: 14, alignItems: 'center' },
  editBtnText: { color: '#1e3a5f', fontWeight: '700', fontSize: 15 },
  pdfBtn: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 14, alignItems: 'center' },
  pdfBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  archiveBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center' },
  archiveBtnText: { color: '#9ca3af', fontSize: 13 },
  unarchiveBtn: { borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 8, padding: 12, alignItems: 'center' },
  unarchiveBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  deleteBtn: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  confirmBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
                borderRadius: 10, padding: 14, gap: 12 },
  confirmText: { color: '#dc2626', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: 10 },
  cancelConfirmBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
                      padding: 11, alignItems: 'center', backgroundColor: '#fff' },
  cancelConfirmText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  confirmDeleteBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 8,
                      padding: 11, alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
});
