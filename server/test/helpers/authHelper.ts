import { signAccessToken } from '../../src/lib/jwt.js';

export function authorization(secret: string, userId: string) {
  return { Authorization: `Bearer ${signAccessToken(userId, secret)}` };
}
