import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  AUTH_EXPIRED_EVENT,
  clearSession,
  getSession,
  setSession,
} from '@/lib/session';
import { login as requestLogin } from '@/services/auth.service';
import { makeSession } from '@/test/fixtures';

vi.mock('@/services/auth.service', () => ({ login: vi.fn() }));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

const loginInput = { email: 'demo@example.com', password: 'demo-password' };

function AuthProbe() {
  const { login, logout, user } = useAuth();
  const [error, setError] = useState(false);

  async function submitLogin() {
    try {
      await login(loginInput);
    } catch {
      setError(true);
    }
  }

  return (
    <>
      <p>{user ? user.role : 'Logged out'}</p>
      <button onClick={submitLogin}>Login</button>
      <button onClick={logout}>Logout</button>
      {error && <p role="alert">Login failed</p>}
    </>
  );
}

function renderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return queryClient;
}

describe('authentication provider', () => {
  beforeEach(() => {
    clearSession();
    vi.mocked(requestLogin).mockReset();
  });

  afterEach(() => {
    clearSession();
    vi.useRealTimers();
  });

  it('uses the server role on login and clears previous cached records', async () => {
    const session = makeSession({ role: 'COMPANY' });
    vi.mocked(requestLogin).mockResolvedValue(session);
    const queryClient = renderAuth();
    queryClient.setQueryData(['previous-user'], { private: true });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('COMPANY')).toBeInTheDocument();
    expect(requestLogin).toHaveBeenCalledWith(loginInput);
    expect(getSession()).toEqual(session);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('keeps failed login attempts unauthenticated', async () => {
    vi.mocked(requestLogin).mockRejectedValue(new Error('Invalid credentials'));
    renderAuth();

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Login failed');
    expect(screen.getByText('Logged out')).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  it('clears user, storage and cached records on logout', () => {
    setSession(makeSession());
    const queryClient = renderAuth();
    queryClient.setQueryData(['my-applications'], [{ private: true }]);

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByText('Logged out')).toBeInTheDocument();
    expect(getSession()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('logs out when the API announces an expired session', async () => {
    setSession(makeSession());
    const queryClient = renderAuth();
    queryClient.setQueryData(['private-records'], ['private']);

    await act(async () => {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    });

    await waitFor(() =>
      expect(screen.getByText('Logged out')).toBeInTheDocument(),
    );
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(getSession()).toBeNull();
  });

  it('expires an open session when its JWT reaches exp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setSession(makeSession({ expiresAt: 1_767_225_601 }));
    renderAuth();
    expect(screen.getByText('JOB_SEEKER')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(screen.getByText('Logged out')).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });
});
