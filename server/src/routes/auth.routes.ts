import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { createAuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginRequestSchema } from '../validators/auth.schema.js';

export function authRoutes(db: PrismaClient, secret: string) {
  const router = Router();
  const controller = createAuthController(db, secret);
  router.post('/login', validate(loginRequestSchema), controller.login);
  return router;
}
