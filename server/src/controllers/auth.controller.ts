import type { PrismaClient } from '@prisma/client';

import type { ValidatedHandler } from '../middleware/validate.js';
import { loginUser } from '../services/auth.service.js';
import type { loginRequestSchema } from '../validators/auth.schema.js';

export function createAuthController(db: PrismaClient, secret: string) {
  const login: ValidatedHandler<typeof loginRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await loginUser(db, secret, res.locals.validated.body);
    res.json({ success: true, data });
  };
  return { login };
}
