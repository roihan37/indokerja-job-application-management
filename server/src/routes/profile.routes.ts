import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { createProfileController } from '../controllers/profile.controller.js';
import type { ResumeStorage } from '../lib/supabase.js';
import { requireRole } from '../middleware/authorize.js';
import { uploadResume } from '../middleware/uploadResume.js';
import { validate } from '../middleware/validate.js';
import {
  profileRequestSchema,
  resumeUrlRequestSchema,
} from '../validators/profile.schema.js';

export function profileRoutes(db: PrismaClient, storage: ResumeStorage) {
  const router = Router();
  const controller = createProfileController(db, storage);
  router.use(requireRole('JOB_SEEKER'));
  router.get('/me', controller.getProfile);
  router.patch('/me', validate(profileRequestSchema), controller.updateProfile);
  router.post('/me/resume', uploadResume, controller.uploadResume);
  router.get('/me/resumes', controller.listResumes);
  router.get(
    '/me/resumes/:id/url',
    validate(resumeUrlRequestSchema),
    controller.ownResumeUrl,
  );
  return router;
}
