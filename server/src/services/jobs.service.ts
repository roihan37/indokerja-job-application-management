import type { Prisma, PrismaClient } from '@prisma/client';

import type { AuthenticatedUser } from '../types/auth-user.js';
import { forbidden, notFound } from '../utils/AppError.js';
import type { CreateJobInput, JobQuery } from '../validators/jobs.schema.js';

const jobSelect = {
  id: true,
  title: true,
  location: true,
  salary: true,
  jobType: true,
  createdAt: true,
  company: { select: { id: true, name: true } },
} satisfies Prisma.JobSelect;

export function listJobs(
  db: PrismaClient,
  user: AuthenticatedUser,
  query: JobQuery,
) {
  const where: Prisma.JobWhereInput = {};
  if (query.mine === 'true') {
    if (user.role !== 'COMPANY' || !user.company) {
      throw forbidden();
    }
    where.companyId = user.company.id;
  }

  return db.job.findMany({
    where,
    select: jobSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
}

export async function getJob(db: PrismaClient, id: string) {
  const job = await db.job.findUnique({
    where: { id },
    select: { ...jobSelect, description: true },
  });
  if (!job) {
    throw notFound();
  }
  return job;
}

export function createJob(
  db: PrismaClient,
  user: AuthenticatedUser,
  input: CreateJobInput,
) {
  if (!user.company) {
    throw forbidden();
  }
  return db.job.create({
    data: { ...input, companyId: user.company.id },
    select: {
      id: true,
      companyId: true,
      title: true,
      location: true,
      salary: true,
      jobType: true,
      description: true,
      createdAt: true,
    },
  });
}
