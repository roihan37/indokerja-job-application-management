import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { createApplicationsController } from '../controllers/applications.controller.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  applyRequestSchema,
  updateStatusRequestSchema,
} from '../validators/applications.schema.js';
import { idRequestSchema } from '../validators/shared.schema.js';

export function applicationRoutes(db: PrismaClient) {
  const router = Router();
  const controller = createApplicationsController(db);
  router.post(
    '/jobs/:id/applications',
    requireRole('JOB_SEEKER'),
    validate(applyRequestSchema),
    controller.applyToJob,
  );
  router.get(
    '/applications/me',
    requireRole('JOB_SEEKER'),
    controller.listMyApplications,
  );
  router.get(
    '/jobs/:id/applications',
    requireRole('COMPANY'),
    validate(idRequestSchema),
    controller.listJobApplicants,
  );
  router.patch(
    '/applications/:id/status',
    requireRole('COMPANY'),
    validate(updateStatusRequestSchema),
    controller.updateApplicationStatus,
  );
  return router;
}
