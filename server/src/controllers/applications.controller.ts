import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';

import type { ValidatedHandler } from '../middleware/validate.js';
import * as applicationsService from '../services/applications.service.js';
import type {
  applyRequestSchema,
  updateStatusRequestSchema,
} from '../validators/applications.schema.js';
import type { idRequestSchema } from '../validators/shared.schema.js';

export function createApplicationsController(db: PrismaClient) {
  const applyToJob: ValidatedHandler<typeof applyRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await applicationsService.applyToJob(
      db,
      res.locals.validated.params.id,
      res.locals.user.id,
      res.locals.validated.body.resumeId,
    );
    res.status(201).json({ success: true, data });
  };
  const listMyApplications: RequestHandler = async (_req, res) => {
    const data = await applicationsService.listMyApplications(
      db,
      res.locals.user.id,
    );
    res.json({ success: true, data });
  };
  const listJobApplicants: ValidatedHandler<typeof idRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await applicationsService.listJobApplicants(
      db,
      res.locals.validated.params.id,
      res.locals.user,
    );
    res.json({ success: true, data });
  };
  const updateApplicationStatus: ValidatedHandler<
    typeof updateStatusRequestSchema
  > = async (_req, res) => {
    const { params, body } = res.locals.validated;
    const data = await applicationsService.updateApplicationStatus(
      db,
      params.id,
      body.status,
      res.locals.user,
    );
    res.json({ success: true, data });
  };
  return {
    applyToJob,
    listMyApplications,
    listJobApplicants,
    updateApplicationStatus,
  };
}
