import { randomBytes } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function createFixtures(db: PrismaClient, password: string) {
  const prefix = randomBytes(8).toString('hex');
  const passwordHash = await bcrypt.hash(password, 12);
  return db.$transaction(async (tx) => {
    const createUser = (name: string, role: 'JOB_SEEKER' | 'COMPANY') =>
      tx.user.create({
        data: { email: `${prefix}-${name}@example.com`, passwordHash, role },
      });
    const seeker = await createUser('seeker', 'JOB_SEEKER');
    const otherSeeker = await createUser('seeker2', 'JOB_SEEKER');
    const owner = await createUser('owner', 'COMPANY');
    const outsider = await createUser('outsider', 'COMPANY');
    const company = await tx.company.create({
      data: { name: prefix, userId: owner.id },
    });
    const otherCompany = await tx.company.create({
      data: { name: `${prefix}-other`, userId: outsider.id },
    });
    const job = await tx.job.create({
      data: {
        companyId: company.id,
        title: 'Developer',
        location: 'Jakarta',
        salary: 8000000,
        jobType: 'FULL_TIME',
      },
    });
    const otherJob = await tx.job.create({
      data: {
        companyId: otherCompany.id,
        title: 'Designer',
        location: 'Bandung',
        salary: 6000000,
        jobType: 'CONTRACT',
      },
    });
    return {
      prefix,
      seeker: seeker.id,
      otherSeeker: otherSeeker.id,
      owner: owner.id,
      outsider: outsider.id,
      company: company.id,
      job: job.id,
      otherJob: otherJob.id,
    };
  });
}

export type Fixtures = Awaited<ReturnType<typeof createFixtures>>;

export function createApplication(db: PrismaClient, fixtures: Fixtures) {
  return db.application.create({
    data: {
      jobId: fixtures.job,
      jobSeekerId: fixtures.seeker,
      history: {
        create: { newStatus: 'Applied', changedById: fixtures.seeker },
      },
    },
  });
}
