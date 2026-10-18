import {
  type ApplicationStatus,
  Prisma,
  type PrismaClient,
} from '@prisma/client';

import { profileSelect } from './profile.service.js';
import { ownedApplication, resumeMetadataSelect } from './resumes.service.js';
import type { AuthenticatedUser } from '../types/auth-user.js';
import { AppError, forbidden, notFound } from '../utils/AppError.js';

const MAX_STATUS_UPDATE_ATTEMPTS = 4;
const alreadyApplied = () =>
  new AppError(409, 'ALREADY_APPLIED', 'You have already applied to this job');
const statusSelect = {
  id: true,
  jobId: true,
  status: true,
  updatedAt: true,
} satisfies Prisma.ApplicationSelect;

export async function applyToJob(
  db: PrismaClient,
  jobId: string,
  jobSeekerId: string,
  resumeId?: string,
) {
  if (
    !(await db.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    }))
  ) {
    throw notFound();
  }
  const existingApplication = await db.application.findUnique({
    where: { jobId_jobSeekerId: { jobId, jobSeekerId } },
    select: { id: true },
  });
  if (existingApplication) {
    throw alreadyApplied();
  }
  try {
    const data = await db.$transaction(async (tx) => {
      if (
        resumeId &&
        !(await tx.resume.findFirst({
          where: { id: resumeId, userId: jobSeekerId },
          select: { id: true },
        }))
      ) {
        throw new AppError(
          400,
          'INVALID_RESUME',
          'Choose one of your own uploaded resumes',
        );
      }
      const application = await tx.application.create({
        data: { jobId, jobSeekerId, ...(resumeId ? { resumeId } : {}) },
        select: {
          id: true,
          jobId: true,
          jobSeekerId: true,
          status: true,
          createdAt: true,
        },
      });
      await tx.applicationHistory.create({
        data: {
          applicationId: application.id,
          newStatus: 'Applied',
          changedById: jobSeekerId,
        },
      });
      return application;
    });
    return data;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw alreadyApplied();
    }
    throw error;
  }
}

export function listMyApplications(db: PrismaClient, jobSeekerId: string) {
  return db.application.findMany({
    where: { jobSeekerId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
}

export async function listJobApplicants(
  db: PrismaClient,
  jobId: string,
  user: AuthenticatedUser,
) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { companyId: true },
  });
  if (!job) {
    throw notFound();
  }
  if (job.companyId !== user.company?.id) {
    throw forbidden();
  }
  return db.application.findMany({
    where: { jobId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      jobSeeker: {
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true, headline: true } },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
}

export async function updateApplicationStatus(
  db: PrismaClient,
  id: string,
  status: ApplicationStatus,
  user: AuthenticatedUser,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      // Serializable retries keep concurrent changes and history in the same order.
      const data = await db.$transaction(
        async (tx) => {
          const application = await tx.application.findUnique({
            where: { id },
            include: { job: { select: { companyId: true } } },
          });
          if (!application) {
            throw notFound();
          }
          if (application.job.companyId !== user.company?.id) {
            throw forbidden();
          }
          if (application.status === status) {
            return {
              id: application.id,
              jobId: application.jobId,
              status: application.status,
              updatedAt: application.updatedAt,
            };
          }
          const updated = await tx.application.update({
            where: { id },
            data: { status },
            select: statusSelect,
          });
          await tx.applicationHistory.create({
            data: {
              applicationId: id,
              previousStatus: application.status,
              newStatus: status,
              changedById: user.id,
            },
          });
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return data;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < MAX_STATUS_UPDATE_ATTEMPTS - 1
      ) {
        continue;
      }
      throw error;
    }
  }
}

export async function getCandidate(
  db: PrismaClient,
  id: string,
  user: AuthenticatedUser,
) {
  await ownedApplication(db, id, user);
  return db.application.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      job: { select: { id: true, title: true } },
      jobSeeker: {
        select: { id: true, email: true, profile: { select: profileSelect } },
      },
      resume: { select: resumeMetadataSelect },
    },
  });
}
