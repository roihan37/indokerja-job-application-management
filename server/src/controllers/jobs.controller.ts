import type { PrismaClient } from '@prisma/client';

import type { ValidatedHandler } from '../middleware/validate.js';
import * as jobsService from '../services/jobs.service.js';
import type {
  createJobRequestSchema,
  listJobsRequestSchema,
} from '../validators/jobs.schema.js';
import type { idRequestSchema } from '../validators/shared.schema.js';

export function createJobsController(db: PrismaClient) {
  const listJobs: ValidatedHandler<typeof listJobsRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await jobsService.listJobs(
      db,
      res.locals.user,
      res.locals.validated.query,
    );
    res.json({ success: true, data });
  };
  const getJob: ValidatedHandler<typeof idRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await jobsService.getJob(db, res.locals.validated.params.id);
    res.json({ success: true, data });
  };
  const createJob: ValidatedHandler<typeof createJobRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await jobsService.createJob(
      db,
      res.locals.user,
      res.locals.validated.body,
    );
    res.status(201).json({ success: true, data });
  };
  return { listJobs, getJob, createJob };
}
