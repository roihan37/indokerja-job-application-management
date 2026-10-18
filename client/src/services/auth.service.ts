import { api } from '@/services/api';
import type { LoginInput, LoginResponse } from '@/types/api';

export function login(input: LoginInput): Promise<LoginResponse> {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
    authenticated: false,
  });
}
