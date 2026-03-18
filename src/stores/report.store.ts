import { create } from 'zustand';
import type { Json, Report } from '../lib/database.types';

interface ReportStore {
  // Draft being edited
  draft: Report | null;
  isDirty: boolean;
  isSaving: boolean;

  // Report list
  reports: Report[];
  isLoadingList: boolean;

  // Actions
  setDraft: (report: Report | null) => void;
  updateDraftFormData: (key: string, value: unknown) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setReports: (reports: Report[]) => void;
  setLoadingList: (loading: boolean) => void;
  updateReportInList: (report: Report) => void;
  removeReportFromList: (id: string) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  draft: null,
  isDirty: false,
  isSaving: false,
  reports: [],
  isLoadingList: false,

  setDraft: (draft) => set({ draft, isDirty: false }),

  updateDraftFormData: (key, value) =>
    set((state) => {
      if (!state.draft) return state;
      const formData = { ...(state.draft.form_data as Record<string, unknown>), [key]: value } as Json;
      return {
        draft: { ...state.draft, form_data: formData },
        isDirty: true,
      };
    }),

  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),

  setReports: (reports) => set({ reports }),
  setLoadingList: (isLoadingList) => set({ isLoadingList }),

  updateReportInList: (report) =>
    set((state) => ({
      reports: state.reports.map((r) => (r.id === report.id ? report : r)),
    })),

  removeReportFromList: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    })),
}));
