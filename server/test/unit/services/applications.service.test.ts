import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { Prisma } from '@prisma/client';

import {
  applyToJob,
  listJobApplicants,
  updateApplicationStatus,
} from '../../../src/services/applications.service.js';
import type { AuthenticatedUser } from '../../../src/types/auth-user.js';
import { updateStatusRequestSchema } from '../../../src/validators/applications.schema.js';
import { mockDatabase } from '../../helpers/mockDatabase.js';

void describe('application business rules', () => {
  const owner: AuthenticatedUser = {
    id: 'owner',
    email: 'owner@example.com',
    role: 'COMPANY',
    company: { id: 'company' },
  };
  const conflict = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('Database conflict', {
      code,
      clientVersion: Prisma.prismaVersion.client,
    });

  void test('a successful application records its initial state with the authenticated seeker', async () => {
    const expected = {
      id: 'application',
      jobId: 'job',
      jobSeekerId: 'seeker',
      status: 'Applied',
    };
    let recordedHistory: unknown;
    const transaction = {
      application: { create: async () => expected },
      applicationHistory: {
        create: async ({ data }: { data: unknown }) => {
          recordedHistory = data;
        },
      },
    };
    const db = mockDatabase({
      job: { findUnique: async () => ({ id: 'job' }) },
      application: { findUnique: async () => null },
      $transaction: async (
        execute: (tx: typeof transaction) => Promise<unknown>,
      ) => execute(transaction),
    });
    assert.deepEqual(await applyToJob(db, 'job', 'seeker'), expected);
    assert.deepEqual(recordedHistory, {
      applicationId: 'application',
      newStatus: 'Applied',
      changedById: 'seeker',
    });
  });

  void test('a status transition records the prior status and authenticated company actor', async () => {
    const expected = { id: 'application', status: 'Rejected' };
    let recordedHistory: unknown;
    const transaction = {
      application: {
        findUnique: async () => ({
          id: 'application',
          status: 'Accepted',
          job: { companyId: 'company' },
        }),
        update: async () => expected,
      },
      applicationHistory: {
        create: async ({ data }: { data: unknown }) => {
          recordedHistory = data;
        },
      },
    };
    const db = mockDatabase({
      $transaction: async (
        execute: (tx: typeof transaction) => Promise<unknown>,
      ) => execute(transaction),
    });
    assert.deepEqual(
      await updateApplicationStatus(db, 'application', 'Rejected', owner),
      expected,
    );
    assert.deepEqual(recordedHistory, {
      applicationId: 'application',
      previousStatus: 'Accepted',
      newStatus: 'Rejected',
      changedById: owner.id,
    });
  });

  void test('status changes reject another company before any mutation', async () => {
    const transaction = {
      application: {
        findUnique: async () => ({ job: { companyId: 'other-company' } }),
      },
    };
    const db = mockDatabase({
      $transaction: async (
        execute: (tx: typeof transaction) => Promise<unknown>,
      ) => execute(transaction),
    });
    await assert.rejects(
      updateApplicationStatus(db, 'application', 'Accepted', owner),
      { status: 403 },
    );
  });

  void test('rejects applications for nonexistent jobs', async () => {
    await assert.rejects(
      applyToJob(
        mockDatabase({ job: { findUnique: async () => null } }),
        'missing',
        'seeker',
      ),
      { status: 404 },
    );
  });

  void test('rejects an existing application before attempting another insert', async () => {
    const db = mockDatabase({
      job: { findUnique: async () => ({ id: 'job' }) },
      application: { findUnique: async () => ({ id: 'existing' }) },
    });
    await assert.rejects(applyToJob(db, 'job', 'seeker'), {
      status: 409,
      code: 'ALREADY_APPLIED',
    });
  });

  void test('translates a racing unique constraint failure to the documented conflict', async () => {
    const db = mockDatabase({
      job: { findUnique: async () => ({ id: 'job' }) },
      application: { findUnique: async () => null },
      $transaction: async () => {
        throw conflict('P2002');
      },
    });
    await assert.rejects(applyToJob(db, 'job', 'seeker'), {
      status: 409,
      code: 'ALREADY_APPLIED',
    });
  });

  void test('does not hide unexpected database failures', async () => {
    const error = new Error('Database unavailable');
    const db = mockDatabase({
      job: { findUnique: async () => ({ id: 'job' }) },
      application: { findUnique: async () => null },
      $transaction: async () => {
        throw error;
      },
    });
    await assert.rejects(
      applyToJob(db, 'job', 'seeker'),
      (actual) => actual === error,
    );
  });

  void test('does not return applicants belonging to another company', async () => {
    const db = mockDatabase({
      job: { findUnique: async () => ({ companyId: 'other-company' }) },
    });
    await assert.rejects(listJobApplicants(db, 'job', owner), { status: 403 });
  });

  void test('reports a nonexistent applicant job as not found', async () => {
    const db = mockDatabase({ job: { findUnique: async () => null } });
    await assert.rejects(listJobApplicants(db, 'missing', owner), {
      status: 404,
    });
  });

  void test('retries serialization conflicts and returns the successful result', async () => {
    let attempts = 0;
    const expected = { id: 'application', status: 'Reviewing' };
    const db = mockDatabase({
      $transaction: async () => {
        if (++attempts < 4) {
          throw conflict('P2034');
        }
        return expected;
      },
    });
    assert.deepEqual(
      await updateApplicationStatus(db, 'application', 'Reviewing', owner),
      expected,
    );
    assert.equal(attempts, 4);
  });

  void test('stops after the initial attempt and three serialization retries', async () => {
    let attempts = 0;
    const db = mockDatabase({
      $transaction: async () => {
        attempts++;
        throw conflict('P2034');
      },
    });
    await assert.rejects(
      updateApplicationStatus(db, 'application', 'Reviewing', owner),
      { code: 'P2034' },
    );
    assert.equal(attempts, 4);
  });

  void test('rejects unsupported status values and attempts to change application ownership', () => {
    for (const body of [
      { status: 'reviewing' },
      { status: 'Interview' },
      { status: 'Accepted', jobId: 'other' },
    ]) {
      assert.equal(
        updateStatusRequestSchema.safeParse({
          params: { id: 'application' },
          body,
        }).success,
        false,
      );
    }
  });
});
