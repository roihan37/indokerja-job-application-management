import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import type { ResumeStorage } from '../lib/supabase.js';
import { profileRoutes } from './profile.routes.js';
import { authenticate } from '../middleware/authenticate.js';
import { applicationRoutes } from './applications.routes.js';
import { authRoutes } from './auth.routes.js';
import { jobRoutes } from './jobs.routes.js';

export function apiRoutes(
  db: PrismaClient,
  secret: string,
  storage: ResumeStorage,
) {
  const router = Router();
  router.use('/auth', authRoutes(db, secret));
  router.use(authenticate(db, secret));
  router.use('/jobs', jobRoutes(db));
  router.use(applicationRoutes(db, storage));
  router.use('/profile', profileRoutes(db, storage));
  return router;
}
