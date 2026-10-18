import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthContext } from '@/hooks/useAuth';
import {
  AUTH_EXPIRED_EVENT,
  clearSession,
  getSession,
  getTokenExpiresAt,
  setSession,
} from '@/lib/session';
import { login as requestLogin } from '@/services/auth.service';
import type { LoginInput } from '@/types/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, updateSession] = useState(getSession);

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    updateSession(null);
  }, [queryClient]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const expireSession = () => {
      logout();
      toast.info('Sesi Anda telah berakhir. Silakan masuk kembali.');
    };
    const expiresAt = getTokenExpiresAt(session.accessToken) ?? Date.now();
    const timer = window.setTimeout(
      expireSession,
      Math.max(0, expiresAt - Date.now()),
    );
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
    };
  }, [logout, session]);

  async function login(input: LoginInput) {
    const nextSession = await requestLogin(input);
    queryClient.clear();
    setSession(nextSession);
    updateSession(nextSession);
  }

  return (
    <AuthContext value={{ user: session?.user ?? null, login, logout }}>
      {children}
    </AuthContext>
  );
}
