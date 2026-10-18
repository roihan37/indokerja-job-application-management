import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';

import type { ResumeStorage } from '../lib/supabase.js';
import type { ValidatedHandler } from '../middleware/validate.js';
import * as profileService from '../services/profile.service.js';
import * as resumesService from '../services/resumes.service.js';
import { getCandidate } from '../services/applications.service.js';
import type {
  profileRequestSchema,
  resumeUrlRequestSchema,
} from '../validators/profile.schema.js';
import type { idRequestSchema } from '../validators/shared.schema.js';

export function createProfileController(
  db: PrismaClient,
  storage: ResumeStorage,
) {
  const getProfile: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'no-store').json({
      success: true,
      data: await profileService.getMyProfile(db, res.locals.user.id),
    });
  };
  const updateProfile: ValidatedHandler<typeof profileRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await profileService.updateMyProfile(
      db,
      res.locals.user.id,
      res.locals.validated.body,
    );
    res.set('Cache-Control', 'no-store').json({ success: true, data });
  };
  const uploadResume: RequestHandler = async (req, res) => {
    const data = await resumesService.uploadResume(
      db,
      storage,
      res.locals.user.id,
      req.file,
    );
    res
      .status(201)
      .set('Cache-Control', 'no-store')
      .json({ success: true, data });
  };
  const listResumes: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'no-store').json({
      success: true,
      data: await resumesService.listMyResumes(db, res.locals.user.id),
    });
  };
  const ownResumeUrl: ValidatedHandler<typeof resumeUrlRequestSchema> = async (
    _req,
    res,
  ) => {
    const { params, query } = res.locals.validated;
    const data = await resumesService.ownResumeUrl(
      db,
      storage,
      params.id,
      res.locals.user.id,
      query.download === 'true',
    );
    res.set('Cache-Control', 'no-store').json({ success: true, data });
  };
  const candidate: ValidatedHandler<typeof idRequestSchema> = async (
    _req,
    res,
  ) => {
    const data = await getCandidate(
      db,
      res.locals.validated.params.id,
      res.locals.user,
    );
    res.set('Cache-Control', 'no-store').json({ success: true, data });
  };
  const applicationResumeUrl: ValidatedHandler<
    typeof resumeUrlRequestSchema
  > = async (_req, res) => {
    const { params, query } = res.locals.validated;
    const data = await resumesService.applicationResumeUrl(
      db,
      storage,
      params.id,
      res.locals.user,
      query.download === 'true',
    );
    res.set('Cache-Control', 'no-store').json({ success: true, data });
  };
  return {
    getProfile,
    updateProfile,
    uploadResume,
    listResumes,
    ownResumeUrl,
    candidate,
    applicationResumeUrl,
  };
}
