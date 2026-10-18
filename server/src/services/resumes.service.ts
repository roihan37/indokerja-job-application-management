import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import type { ResumeStorage } from '../lib/supabase.js';
import { MAX_RESUME_SIZE } from '../middleware/uploadResume.js';
import type { AuthenticatedUser } from '../types/auth-user.js';
import { AppError, forbidden, notFound } from '../utils/AppError.js';

export const resumeMetadataSelect = {
  id: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  createdAt: true,
} as const;
export function validatePdf(file: Express.Multer.File | undefined) {
  if (
    !file ||
    file.mimetype !== 'application/pdf' ||
    file.size === 0 ||
    file.size > MAX_RESUME_SIZE ||
    file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
  ) {
    throw new AppError(
      400,
      'INVALID_RESUME',
      'Upload a PDF file of at most 5 MB',
    );
  }
  return file;
}
export async function uploadResume(
  db: PrismaClient,
  storage: ResumeStorage,
  userId: string,
  input: Express.Multer.File | undefined,
) {
  const file = validatePdf(input);
  const id = randomUUID();
  const storageKey = `${userId}/${id}.pdf`;
  const fileName =
    file.originalname
      .replace(/^.*[\\/]/, '')
      .replace(/[^a-zA-Z0-9._ ()-]/g, '_')
      .slice(0, 180)
      .replace(/\.pdf$/i, '') + '.pdf';
  await storage.upload(storageKey, file.buffer);
  try {
    return await db.resume.create({
      data: {
        id,
        userId,
        storageKey,
        fileName,
        mimeType: 'application/pdf',
        fileSize: file.size,
      },
      select: resumeMetadataSelect,
    });
  } catch (error) {
    try {
      await storage.remove(storageKey);
    } catch {
      console.error('Failed to clean up newly uploaded resume');
    }
    throw error;
  }
}
export function listMyResumes(db: PrismaClient, userId: string) {
  return db.resume.findMany({
    where: { userId },
    select: resumeMetadataSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}
export async function ownResumeUrl(
  db: PrismaClient,
  storage: ResumeStorage,
  id: string,
  userId: string,
  download: boolean,
) {
  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume) {
    throw notFound();
  }
  return {
    url: await storage.signedUrl(
      resume.storageKey,
      download ? resume.fileName : undefined,
    ),
    expiresIn: 60,
  };
}
export async function ownedApplication(
  db: PrismaClient,
  id: string,
  user: AuthenticatedUser,
) {
  const application = await db.application.findUnique({
    where: { id },
    select: { job: { select: { companyId: true } } },
  });
  if (!application) {
    throw notFound();
  }
  if (application.job.companyId !== user.company?.id) {
    throw forbidden();
  }
}
export async function applicationResumeUrl(
  db: PrismaClient,
  storage: ResumeStorage,
  id: string,
  user: AuthenticatedUser,
  download: boolean,
) {
  await ownedApplication(db, id, user);
  const application = await db.application.findUnique({
    where: { id },
    select: { resume: { select: { storageKey: true, fileName: true } } },
  });
  if (!application?.resume) {
    throw notFound();
  }
  return {
    url: await storage.signedUrl(
      application.resume.storageKey,
      download ? application.resume.fileName : undefined,
    ),
    expiresIn: 60,
  };
}
