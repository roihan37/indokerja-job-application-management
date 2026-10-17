import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  createJob,
  getJob,
  listJobs,
} from '../../../src/services/jobs.service.js';
import type { AuthenticatedUser } from '../../../src/types/auth-user.js';
import { createJobRequestSchema } from '../../../src/validators/jobs.schema.js';
import { mockDatabase } from '../../helpers/mockDatabase.js';

void describe('job business rules', () => {
  const owner: AuthenticatedUser = {
    id: 'owner',
    email: 'owner@example.com',
    role: 'COMPANY',
    company: { id: 'company' },
  };
  const input = {
    title: 'Developer',
    location: 'Jakarta',
    salary: 0,
    jobType: 'FULL_TIME' as const,
  };

  void test('creates a job for the authenticated company', async () => {
    const db = mockDatabase({
      job: {
        create: async ({ data }: { data: object }) => ({ id: 'job', ...data }),
      },
    });
    const result = await createJob(db, owner, input);
    assert.deepEqual(result, {
      id: 'job',
      ...input,
      companyId: owner.company?.id,
    });
  });

  void test('rejects job creation without an associated company', () => {
    assert.throws(
      () => createJob(mockDatabase({}), { ...owner, company: null }, input),
      { status: 403 },
    );
  });

  void test('restricts mine=true to company accounts with a company', () => {
    for (const user of [
      { ...owner, company: null },
      { ...owner, role: 'JOB_SEEKER' as const },
    ]) {
      assert.throws(() => listJobs(mockDatabase({}), user, { mine: 'true' }), {
        status: 403,
      });
    }
  });

  void test('reports a missing job as not found', async () => {
    await assert.rejects(
      getJob(
        mockDatabase({ job: { findUnique: async () => null } }),
        'missing',
      ),
      { status: 404, code: 'NOT_FOUND' },
    );
  });

  void test('validation trims fields and rejects invalid salaries and injected ownership', () => {
    const result = createJobRequestSchema.parse({
      body: { ...input, title: ' Developer ' },
    });
    assert.equal(result.body.title, 'Developer');
    for (const salary of [-1, 0.5, 2147483648]) {
      assert.equal(
        createJobRequestSchema.safeParse({ body: { ...input, salary } })
          .success,
        false,
      );
    }
    assert.equal(
      createJobRequestSchema.safeParse({
        body: { ...input, companyId: 'other' },
      }).success,
      false,
    );
  });
});
