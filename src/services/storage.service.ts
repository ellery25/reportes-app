import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export const storageService = {
  async uploadPhoto(localUri: string, reportId: string, userId: string): Promise<string> {
    const filename = `${Date.now()}.jpg`;
    const path = `${userId}/${reportId}/${filename}`;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from('reports-photos')
      .upload(path, decode(base64), { contentType: 'image/jpeg' });

    if (error) throw error;
    return path;
  },

  async uploadSignature(base64Data: string, reportId: string, userId: string, type: 'executed' | 'approved'): Promise<string> {
    const path = `${userId}/${reportId}/sig_${type}.png`;
    const imageData = base64Data.replace(/^data:image\/png;base64,/, '');

    const { error } = await supabase.storage
      .from('reports-signatures')
      .upload(path, decode(imageData), { contentType: 'image/png', upsert: true });

    if (error) throw error;
    return path;
  },

  async uploadPdf(pdfUri: string, reportId: string, userId: string): Promise<string> {
    const path = `${userId}/${reportId}/report.pdf`;
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from('reports-pdfs')
      .upload(path, decode(base64), { contentType: 'application/pdf', upsert: true });

    if (error) throw error;
    return path;
  },

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  async getSignedUrls(bucket: string, paths: string[], expiresIn = 3600): Promise<string[]> {
    if (paths.length === 0) return [];
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) throw error;
    return (data ?? []).map((d) => d.signedUrl ?? '').filter(Boolean);
  },
};
