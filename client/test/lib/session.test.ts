import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearSession,
  getSession,
  getTokenExpiresAt,
  setSession,
} from '@/lib/session';
import { makeSession } from '../fixtures';

describe('session storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    clearSession();
  });

  afterEach(() => {
    clearSession();
    vi.useRealTimers();
  });

  it('restores the user and token from session storage', () => {
    const session = makeSession({ role: 'COMPANY' });

    setSession(session);

    expect(getSession()).toEqual(session);
    expect(window.localStorage.length).toBe(0);
  });

  it('clears an expired session instead of restoring its user', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setSession(makeSession({ expiresAt: 1_767_225_601 }));
    expect(getSession()).not.toBeNull();

    vi.advanceTimersByTime(1000);

    expect(getSession()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('rejects malformed storage without crashing', () => {
    window.sessionStorage.setItem('indokerja.session', '{invalid-json');

    expect(getSession()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('rejects an unsupported stored role', () => {
    window.sessionStorage.setItem(
      'indokerja.session',
      JSON.stringify({
        ...makeSession(),
        user: { id: '1', email: 'demo@example.com', role: 'ADMIN' },
      }),
    );

    expect(getSession()).toBeNull();
  });

  it('removes a session on logout', () => {
    setSession(makeSession());

    clearSession();

    expect(getSession()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });
});

describe('token expiration', () => {
  it('reads the expiration in milliseconds', () => {
    const session = makeSession({ expiresAt: 1_900_000_000 });

    expect(getTokenExpiresAt(session.accessToken)).toBe(1_900_000_000_000);
  });

  it.each(['invalid', 'header.!invalid!.signature', 'header.e30.signature'])(
    'rejects malformed token %s',
    (token) => {
      expect(getTokenExpiresAt(token)).toBeNull();
    },
  );
});
