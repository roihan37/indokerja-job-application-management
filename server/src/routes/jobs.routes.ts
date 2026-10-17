import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

import { createJobsController } from '../controllers/jobs.controller.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createJobRequestSchema,
  listJobsRequestSchema,
} from '../validators/jobs.schema.js';
import { idRequestSchema } from '../validators/shared.schema.js';

export function jobRoutes(db: PrismaClient) {
  const router = Router();
  const controller = createJobsController(db);
  router.get('/', validate(listJobsRequestSchema), controller.listJobs);
  router.get('/:id', validate(idRequestSchema), controller.getJob);
  router.post(
    '/',
    requireRole('COMPANY'),
    validate(createJobRequestSchema),
    controller.createJob,
  );
  return router;
}
