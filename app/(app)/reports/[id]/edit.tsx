import { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
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
import type { TemplateDefinition } from '../../../../src/templates/types';

function getMissingFields(formData: Record<string, unknown>, template: TemplateDefinition): string[] {
  const missing: string[] = [];
  for (const field of template.fields) {
    if (!field.required) continue;
    // Las firmas no están disponibles en web
    if (Platform.OS === 'web' && field.type === 'signature') continue;
    const val = formData[field.key];
    const isEmpty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
    if (isEmpty) missing.push(field.label);
  }
  return missing;
}

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuthStore();

  function goBack() {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(app)');
  }
  const { draft, setDraft, isSaving, setSaving } = useReportStore();

  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGenerating = useRef(false);
  // Refs used by the unmount flush-save (can't access state/closures from cleanup)
  const draftRef = useRef(draft);
  const userRef = useRef(user);
  const templateRef = useRef<ReturnType<typeof getTemplate> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Load report on mount
  useEffect(() => {
    if (!id) return;
    reportService.getById(id).then((report) => {
      if (!report) { setLoadError('Reporte no encontrado'); return; }
      setDraft(report);
      reset(report.form_data as Record<string, unknown>);
    }).catch((e: unknown) => {
      setLoadError(e instanceof Error ? e.message : 'Error al cargar el reporte');
    });
  }, [id]);

  const template = draft ? getTemplate(draft.template_code) : null;

  // Keep refs in sync so the unmount flush-save always has fresh values
  draftRef.current = draft;
  userRef.current = user;
  templateRef.current = template;

  // Strips binary data URIs from form data before saving to DB (avoids request size overflow on web).
  // On web, data URI photos are uploaded to storage and replaced with paths.
  // On native, file:// URIs are small strings — no stripping needed.
  async function sanitizeForDb(formData: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!draft || !user || !template) return formData;
    if (Platform.OS !== 'web') return formData;

    const clean = { ...formData };
    for (const field of template.fields) {
      if (field.type === 'photo_gallery') {
        const photos = formData[field.key] as string[] | undefined;
        if (!photos?.length) continue;
        const paths: string[] = [];
        for (const uri of photos) {
          if (uri.startsWith('data:')) {
            try {
              const path = await storageService.uploadPhotoFromDataUri(uri, draft.id, user.id);
              paths.push(path);
            } catch { paths.push(uri); } // keep as-is on error, DB update may still fail but that's ok
          } else {
            paths.push(uri);
          }
        }
        clean[field.key] = paths;
      } else if (field.type === 'signature') {
        // Web signatures are small PNGs (~5-30 KB) — safe to keep as data URIs in form_data
      }
    }
    return clean;
  }

  // Auto-save on form changes (debounced)
  const autoSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const clean = await sanitizeForDb(getValues());
      await reportService.updateFormData(draft.id, clean);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }, [draft, template, user]);

  function scheduleAutoSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(autoSave, 1500);
  }

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Flush-save on unmount so data typed before tapping "Volver" is always persisted
    const d = draftRef.current;
    const u = userRef.current;
    const t = templateRef.current;
    if (d && !isGenerating.current) {
      const formData = getValues();
      // Sanitize synchronously (no storage uploads on unmount flush — keep data URIs as-is)
      const clean: Record<string, unknown> = { ...formData };
      if (Platform.OS === 'web' && t) {
        for (const field of t.fields) {
          if (field.type === 'photo_gallery') {
            const photos = formData[field.key] as string[] | undefined;
            if (photos?.length) {
              // Strip data URIs from photos to avoid request size overflow; paths already uploaded stay
              clean[field.key] = photos.filter((p) => !p.startsWith('data:'));
            }
          }
        }
      }
      reportService.updateFormData(d.id, clean).catch(() => { /* best-effort */ });
    }
    setDraft(null);
  }, []);

  async function handleSaveDraft() {
    if (!draft) return;
    setSaveMsg('');
    try {
      const clean = await sanitizeForDb(getValues());
      await reportService.updateFormData(draft.id, clean);
      setSaveMsg('ok');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Error al guardar');
    }
  }

  async function handleGeneratePdf() {
    if (!draft || !user || isGenerating.current) return;
    setPdfError('');

    // Validate required fields before attempting
    const formData = getValues();
    if (template) {
      const missing = getMissingFields(formData, template);
      if (missing.length > 0) {
        setPdfError(`Por favor completa los siguientes campos obligatorios:\n• ${missing.join('\n• ')}`);
        return;
      }
    }

    setPdfLoading(true);
    isGenerating.current = true;

    const photoUris: string[] = (formData.fotos as string[]) ?? [];
    const localPhotos = photoUris.filter((u) => u.startsWith('file://') || u.startsWith('content://') || u.startsWith('/'));

    try {
      // Save current form data first (strips data URIs on web to avoid request size overflow)
      const cleanFormData = await sanitizeForDb(formData);
      await reportService.updateFormData(draft.id, cleanFormData);

      let updated = draft;

      if (Platform.OS !== 'web') {
        // Native: upload local photos and signatures to Supabase Storage
        const uploadedPaths: string[] = [];
        for (const uri of photoUris) {
          if (localPhotos.includes(uri)) {
            const path = await storageService.uploadPhoto(uri, draft.id, user.id);
            uploadedPaths.push(path);
          } else {
            uploadedPaths.push(uri);
          }
        }

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

        updated = await reportService.update(draft.id, {
          photo_paths: uploadedPaths,
          signature_executed_path: sigExecutedPath,
          signature_approved_path: sigApprovedPath,
        });
        setDraft(updated);
      }

      // Always pass current form values — draft.form_data may be stale (especially on web)
      await pdfService.generateAndShare(
        { ...updated, form_data: formData as unknown as typeof updated.form_data },
        user.id,
      );
      router.replace(`/(app)/reports/${draft.id}`);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Error al generar PDF');
    } finally {
      isGenerating.current = false;
      setPdfLoading(false);
    }
  }

  if (loadError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMsg}>{loadError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={goBack}>
          <Text style={styles.retryText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
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
                  <DynamicField
                    key={field.key}
                    field={field}
                    control={control}
                    onAfterChange={scheduleAutoSave}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.actions}>
          {pdfError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>No se puede generar el PDF</Text>
              <Text style={styles.errorMsg}>{pdfError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saveMsg === 'ok' && styles.saveBtnOk]}
            onPress={handleSaveDraft}
          >
            <Text style={[styles.saveBtnText, saveMsg === 'ok' && styles.saveBtnTextOk]}>
              {saveMsg === 'ok' ? '✓ Guardado' : '💾 Guardar Borrador'}
            </Text>
          </TouchableOpacity>

          {saveMsg && saveMsg !== 'ok' ? (
            <Text style={styles.saveErrText}>{saveMsg}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.pdfBtn, pdfLoading && styles.btnDisabled]}
            onPress={handleGeneratePdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.pdfBtnText}>📄 Generar PDF</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, pdfLoading && styles.btnDisabled]}
            onPress={goBack}
            disabled={pdfLoading}
          >
            <Text style={styles.cancelBtnText}>Cancelar edición</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
              borderRadius: 8, padding: 12, gap: 4 },
  errorTitle: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  errorMsg: { color: '#dc2626', fontSize: 13, lineHeight: 20 },
  retryBtn: { marginTop: 8, backgroundColor: '#1e3a5f', borderRadius: 8,
              paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
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
  saveBtnOk: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  saveBtnText: { color: '#1e3a5f', fontWeight: '700', fontSize: 15 },
  saveBtnTextOk: { color: '#16a34a' },
  saveErrText: { color: '#dc2626', fontSize: 12, textAlign: 'center' },
  pdfBtn: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 14, alignItems: 'center' },
  pdfBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 13, alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
});
