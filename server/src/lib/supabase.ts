import { createClient } from '@supabase/supabase-js';

import type { Config } from './config.js';
import { AppError } from '../utils/AppError.js';

export interface ResumeStorage {
  upload(key: string, content: Buffer): Promise<void>;
  remove(key: string): Promise<void>;
  signedUrl(key: string, download?: string): Promise<string>;
}
export type StorageConfig = Partial<
  Pick<
    Config,
    'SUPABASE_URL' | 'SUPABASE_SECRET_KEY' | 'SUPABASE_STORAGE_BUCKET'
  >
>;

export function createResumeStorage(config: StorageConfig): ResumeStorage {
  function bucket() {
    if (!config.SUPABASE_URL || !config.SUPABASE_SECRET_KEY) {
      throw new AppError(
        503,
        'STORAGE_UNAVAILABLE',
        'Resume storage is not configured',
      );
    }
    return createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }).storage.from(config.SUPABASE_STORAGE_BUCKET ?? 'candidate-resumes');
  }
  return {
    async upload(key, content) {
      const { error } = await bucket().upload(key, content, {
        contentType: 'application/pdf',
        upsert: false,
      });
      if (error) {
        throw new AppError(
          503,
          'STORAGE_ERROR',
          'Resume upload failed. Please retry',
        );
      }
    },
    async remove(key) {
      const { error } = await bucket().remove([key]);
      if (error) {
        throw new Error('StorageCleanupError');
      }
    },
    async signedUrl(key, download) {
      const { data, error } = await bucket().createSignedUrl(key, 60, {
        download: download ?? false,
      });
      if (error || !data) {
        throw new AppError(
          503,
          'STORAGE_ERROR',
          'Resume access is temporarily unavailable',
        );
      }
      return data.signedUrl;
    },
  };
}
