import type { Session, UserRole } from '@/types/api';

interface SessionOptions {
  expiresAt?: number;
  role?: UserRole;
  userId?: string;
}

export function makeSession({
  expiresAt = Math.floor(Date.now() / 1000) + 3600,
  role = 'JOB_SEEKER',
  userId = 'user-1',
}: SessionOptions = {}): Session {
  const payload = btoa(JSON.stringify({ exp: expiresAt, sub: userId }));

  return {
    accessToken: `header.${payload}.test-signature`,
    tokenType: 'Bearer',
    user: { id: userId, email: 'demo@example.com', role },
  };
}
