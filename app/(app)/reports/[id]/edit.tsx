import { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useForm } from 'react-hook-form';
import { getTemplate } from '../../../../src/templates';
import { reportService } from '../../../../src/services/report.service';
import { pdfService } from '../../../../src/services/pdf.service';
import { storageService } from '../../../../src/services/storage.service';
import { useReportStore } from '../../../../src/stores/report.store';
import { useAuthStore } from '../../../../src/stores/auth.store';
import { DynamicField } from '../../../../src/components/forms/DynamicField';

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { draft, setDraft, isSaving, setSaving } = useReportStore();

  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGenerating = useRef(false);

  // Load report on mount
  useEffect(() => {
    if (!id) return;
    reportService.getById(id).then((report) => {
      if (!report) { Alert.alert('Error', 'Reporte no encontrado'); router.back(); return; }
      setDraft(report);
      reset(report.form_data as Record<string, unknown>);
    });
  }, [id]);

  const template = draft ? getTemplate(draft.template_code) : null;

  // Auto-save on form changes (debounced)
  const autoSave = useCallback(async () => {
    if (!draft || isSaving) return;
    setSaving(true);
    try {
      await reportService.updateFormData(draft.id, getValues());
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }, [draft, isSaving]);

  function scheduleAutoSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(autoSave, 1500);
  }

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  async function handleGeneratePdf() {
    if (!draft || !user || isGenerating.current) return;

    // Upload photo URIs that are local (haven't been uploaded yet)
    const formData = getValues();
    const photoUris: string[] = (formData.fotos as string[]) ?? [];
    const localPhotos = photoUris.filter((u) => u.startsWith('file://') || u.startsWith('content://') || u.startsWith('/'));

    if (localPhotos.length > 0) {
      Alert.alert('Subiendo fotos', 'Un momento, subiendo imágenes...');
    }

    isGenerating.current = true;
    try {
      // Save current form data first
      await reportService.updateFormData(draft.id, formData);

      // Upload local photos to storage
      const uploadedPaths: string[] = [];
      for (const uri of photoUris) {
        if (localPhotos.includes(uri)) {
          const path = await storageService.uploadPhoto(uri, draft.id, user.id);
          uploadedPaths.push(path);
        } else {
          uploadedPaths.push(uri); // already a storage path
        }
      }

      // Upload signatures if they're base64
      let sigExecutedPath = draft.signature_executed_path;
      let sigApprovedPath = draft.signature_approved_path;
      const sigExec = formData.firma_ejecutado as string | undefined;
      const sigAppr = formData.firma_aprobado as string | undefined;

      if (sigExec?.startsWith('data:image')) {
        sigExecutedPath = await storageService.uploadSignature(sigExec, draft.id, user.id, 'executed');
      }
      if (sigAppr?.startsWith('data:image')) {
        sigApprovedPath = await storageService.uploadSignature(sigAppr, draft.id, user.id, 'approved');
      }

      // Update report with paths
      const updated = await reportService.update(draft.id, {
        photo_paths: uploadedPaths,
        signature_executed_path: sigExecutedPath,
        signature_approved_path: sigApprovedPath,
      });

      setDraft(updated);

      // Generate and share PDF
      await pdfService.generateAndShare(updated, user.id);

      router.replace(`/(app)/reports/${draft.id}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al generar PDF');
    } finally {
      isGenerating.current = false;
    }
  }

  if (!template || !draft) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      {/* Header with save indicator */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{template.name}</Text>
        {isSaving
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.savedText}>✓</Text>}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sortedSections.map((section) => {
          const sectionFields = template.fields
            .filter((f) => f.section === section.key)
            .sort((a, b) => a.sectionOrder - b.sectionOrder);

          if (sectionFields.length === 0) return null;

          return (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              <View style={styles.sectionBody}>
                {sectionFields.map((field) => (
                  <View key={field.key} onChange={scheduleAutoSave}>
                    <DynamicField field={field} control={control} />
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => reportService.updateFormData(draft.id, getValues())}
          >
            <Text style={styles.saveBtnText}>💾 Guardar Borrador</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfBtn} onPress={handleGeneratePdf}>
            <Text style={styles.pdfBtnText}>📄 Generar PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  header: { backgroundColor: '#1e3a5f', flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { paddingRight: 4 },
  backText: { color: '#fff', fontSize: 16 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  savedText: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  section: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden',
             shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
             shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionTitle: { backgroundColor: '#1e3a5f', color: '#fff', fontWeight: '700',
                  fontSize: 11, padding: 10, letterSpacing: 0.8 },
  sectionBody: { padding: 14 },
  actions: { gap: 10, marginTop: 8 },
  saveBtn: { borderWidth: 1.5, borderColor: '#1e3a5f', borderRadius: 8,
             padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#1e3a5f', fontWeight: '700', fontSize: 15 },
  pdfBtn: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 14, alignItems: 'center' },
  pdfBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
