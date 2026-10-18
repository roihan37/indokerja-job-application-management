import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AUTH_EXPIRED_EVENT,
  clearSession,
  getSession,
  setSession,
} from '@/lib/session';
import { ApiError, api } from '@/services/api';
import { makeSession } from '../fixtures';

const fetchMock = vi.fn<typeof fetch>();

function errorResponse(status: number, code: string) {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message: 'Request failed.' },
    }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('API client', () => {
  beforeEach(() => {
    clearSession();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it('sends bearer authentication and returns the success envelope data', async () => {
    const session = makeSession();
    setSession(session);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [{ id: 'job-1' }] })),
    );

    await expect(api('/jobs')).resolves.toEqual([{ id: 'job-1' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/jobs$/),
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      }),
    );
  });

  it('does not attach an existing token to a public login request', async () => {
    setSession(makeSession());
    const input = { email: 'demo@example.com', password: 'demo-password' };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: makeSession() })),
    );

    await api('/auth/login', {
      method: 'POST',
      body: input,
      authenticated: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        body: JSON.stringify(input),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('preserves structured validation errors for form fields', async () => {
    const details = [{ field: 'salary', message: 'Must be nonnegative.' }];
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid data.',
            details,
          },
        }),
        { status: 400 },
      ),
    );

    await expect(api('/jobs')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
  });

  it('clears the current session and announces an authenticated 401', async () => {
    setSession(makeSession());
    const onExpired = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired, { once: true });
    fetchMock.mockResolvedValue(errorResponse(401, 'UNAUTHORIZED'));

    await expect(api('/jobs')).rejects.toBeInstanceOf(ApiError);

    expect(getSession()).toBeNull();
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it('keeps the session when ownership is denied with 403', async () => {
    const session = makeSession({ role: 'COMPANY' });
    setSession(session);
    fetchMock.mockResolvedValue(errorResponse(403, 'FORBIDDEN'));

    await expect(api('/jobs/other-company/applications')).rejects.toMatchObject(
      { code: 'FORBIDDEN' },
    );

    expect(getSession()).toEqual(session);
  });

  it('does not clear a newer login when an older request returns 401', async () => {
    setSession(makeSession({ userId: 'old-user' }));
    let finishRequest: ((response: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finishRequest = resolve;
        }),
    );
    const oldRequest = api('/jobs');
    const newSession = makeSession({ userId: 'new-user' });
    setSession(newSession);

    finishRequest?.(errorResponse(401, 'UNAUTHORIZED'));

    await expect(oldRequest).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(getSession()).toEqual(newSession);
  });

  it('reports network failure without inventing a successful response', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api('/jobs')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('preserves request cancellation', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValue(abortError);

    await expect(api('/jobs')).rejects.toBe(abortError);
  });

  it('rejects a response outside the documented envelope', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ jobs: [] })));

    await expect(api('/jobs')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});
