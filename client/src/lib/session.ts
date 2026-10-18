import { z } from 'zod';

import type { Session } from '@/types/api';

export const AUTH_EXPIRED_EVENT = 'indokerja:auth-expired';

const SESSION_STORAGE_KEY = 'indokerja.session';
const sessionSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['JOB_SEEKER', 'COMPANY']),
  }),
});
const tokenPayloadSchema = z.object({ exp: z.number().int().positive() });

let memorySession: Session | null = null;
let storageUnavailable = false;

export function getTokenExpiresAt(accessToken: string): number | null {
  try {
    const segments = accessToken.split('.');
    if (segments.length !== 3 || !segments[1]) {
      return null;
    }
    const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payload.padEnd(
      Math.ceil(payload.length / 4) * 4,
      '=',
    );
    const parsed = tokenPayloadSchema.safeParse(
      JSON.parse(atob(paddedPayload)) as unknown,
    );
    if (!parsed.success) {
      return null;
    }
    const expiresAt = parsed.data.exp * 1000;
    return Number.isSafeInteger(expiresAt) ? expiresAt : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  memorySession = null;
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Some browser privacy settings disable storage; memory remains usable.
    storageUnavailable = true;
  }
}

export function getSession(): Session | null {
  let storedSession: unknown = memorySession;
  try {
    if (!storageUnavailable && typeof window !== 'undefined') {
      const storedValue = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      storedSession = storedValue ? (JSON.parse(storedValue) as unknown) : null;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      clearSession();
      return null;
    }
    storageUnavailable = true;
    storedSession = memorySession;
  }

  const parsed = sessionSchema.safeParse(storedSession);
  if (!parsed.success) {
    clearSession();
    return null;
  }
  // Expiry is a UI safeguard; signature and permissions are checked by the API.
  const expiresAt = getTokenExpiresAt(parsed.data.accessToken);
  if (expiresAt === null || expiresAt <= Date.now()) {
    clearSession();
    return null;
  }
  memorySession = parsed.data;
  return parsed.data;
}

export function setSession(session: Session) {
  const parsed = sessionSchema.parse(session);
  memorySession = parsed;
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(parsed),
      );
    }
  } catch {
    // Keep the active session in memory when browser storage is unavailable.
    storageUnavailable = true;
  }
}
