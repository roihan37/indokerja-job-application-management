import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { signAccessToken } from '../lib/jwt.js';
import { AppError } from '../utils/AppError.js';
import type { LoginInput } from '../validators/auth.schema.js';

// Equal-cost comparison for nonexistent users avoids a fast account-existence signal.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('unused-comparison-value', 12);

export async function loginUser(
  db: PrismaClient,
  secret: string,
  input: LoginInput,
) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const accessToken = signAccessToken(user.id, secret);
  return {
    accessToken,
    tokenType: 'Bearer',
    user: { id: user.id, email: user.email, role: user.role },
  };
}
