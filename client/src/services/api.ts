import { z } from 'zod';

import { AUTH_EXPIRED_EVENT, clearSession, getSession } from '@/lib/session';
import type { ApiErrorDetail } from '@/types/api';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
).replace(/\/+$/, '');

const responseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.unknown() }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z
        .array(z.object({ field: z.string(), message: z.string() }))
        .optional(),
    }),
  }),
]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
}

export async function api<T>(
  path: string,
  {
    method = 'GET',
    body,
    signal,
    authenticated = true,
  }: ApiRequestOptions = {},
): Promise<T> {
  const accessToken = authenticated ? getSession()?.accessToken : undefined;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: 'omit',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.',
    );
  }

  if (
    response.status === 401 &&
    accessToken &&
    getSession()?.accessToken === accessToken
  ) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Respons server tidak valid. Silakan coba lagi.',
    );
  }
  const parsed = responseSchema.safeParse(responseBody);
  if (!parsed.success) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'Respons server tidak valid. Silakan coba lagi.',
    );
  }
  if (!parsed.data.success) {
    const { code, details, message } = parsed.data.error;
    throw new ApiError(response.status, code, message, details);
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      'REQUEST_FAILED',
      'Permintaan belum berhasil. Silakan coba lagi.',
    );
  }

  return parsed.data.data as T;
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Terjadi kesalahan. Silakan coba lagi.';
  }
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email atau kata sandi salah.';
    case 'UNAUTHORIZED':
      return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
    case 'FORBIDDEN':
      return 'Anda tidak memiliki izin untuk mengakses data ini.';
    case 'NOT_FOUND':
      return 'Data yang Anda cari tidak ditemukan.';
    case 'ALREADY_APPLIED':
      return 'Anda sudah melamar lowongan ini.';
    case 'VALIDATION_ERROR':
      return 'Periksa kembali data yang Anda masukkan.';
    case 'NETWORK_ERROR':
    case 'INVALID_RESPONSE':
      return error.message;
    default:
      return 'Permintaan belum berhasil. Silakan coba lagi.';
  }
}
