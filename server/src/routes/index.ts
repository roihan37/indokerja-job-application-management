import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { applicationRoutes } from './applications.routes.js';
import { authRoutes } from './auth.routes.js';
import { jobRoutes } from './jobs.routes.js';

export function apiRoutes(db: PrismaClient, secret: string) {
  const router = Router();
  router.use('/auth', authRoutes(db, secret));
  router.use(authenticate(db, secret));
  router.use('/jobs', jobRoutes(db));
  router.use(applicationRoutes(db));
  return router;
}
