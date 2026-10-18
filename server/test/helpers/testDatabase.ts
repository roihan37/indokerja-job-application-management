import { randomBytes } from 'node:crypto';
import { after, afterEach, before, beforeEach } from 'node:test';

import { PrismaClient } from '@prisma/client';

import type { ResumeStorage } from '../../src/lib/supabase.js';
import { createApp } from '../../src/app.js';
import { migrateTestDatabase, readTestDatabaseUrl } from '../setup.js';
import { authorization } from './authHelper.js';
import { type Fixtures, createFixtures } from './testFactory.js';

export function setupIntegration(storage?: ResumeStorage) {
  const db = new PrismaClient({ datasourceUrl: readTestDatabaseUrl() });
  const secret = randomBytes(48).toString('hex');
  const password = randomBytes(18).toString('hex');
  const app = createApp(
    db,
    {
      JWT_SECRET: secret,
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
    storage,
  );
  // Keep the object stable so each test sees its own newly created fixtures.
  const fixtures = {} as Fixtures;
  before(async () => {
    migrateTestDatabase();
    await db.$connect();
  });
  beforeEach(async () => {
    Object.assign(fixtures, await createFixtures(db, password));
  });
  afterEach(async () => {
    readTestDatabaseUrl();
    const users = [
      fixtures.seeker,
      fixtures.otherSeeker,
      fixtures.owner,
      fixtures.outsider,
    ].filter(Boolean);
    if (users.length === 0) {
      return;
    }
    await db.$transaction(async (tx) => {
      const jobs = { company: { userId: { in: users } } };
      await tx.applicationHistory.deleteMany({
        where: { application: { job: jobs } },
      });
      await tx.application.deleteMany({ where: { job: jobs } });
      await tx.job.deleteMany({ where: jobs });
      await tx.company.deleteMany({ where: { userId: { in: users } } });
      await tx.resume.deleteMany({ where: { userId: { in: users } } });
      await tx.jobSeekerProfile.deleteMany({
        where: { userId: { in: users } },
      });
      await tx.user.deleteMany({ where: { id: { in: users } } });
    });
  });
  after(async () => {
    await db.$disconnect();
  });
  return {
    db,
    app,
    secret,
    password,
    fixtures,
    auth: (userId: string) => authorization(secret, userId),
  };
}
