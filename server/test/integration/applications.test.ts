import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { ApplicationHistory, ApplicationStatus } from '@prisma/client';
import request from 'supertest';

import { setupIntegration } from '../helpers/testDatabase.js';
import { createApplication } from '../helpers/testFactory.js';
import { updateApplicationStatus } from '../../src/services/applications.service.js';

void describe('applications HTTP integration', () => {
  const { db, app, fixtures, auth } = setupIntegration();

  void test('concurrent applications create one application and initial history; DB rejects direct duplicate', async () => {
    const { seeker, job } = fixtures;
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app).post(`/api/jobs/${job}/applications`).set(auth(seeker)),
      ),
    );
    assert.deepEqual(
      responses.map((response) => response.status).sort(),
      [201, 409],
    );
    const application = await db.application.findUniqueOrThrow({
      where: { jobId_jobSeekerId: { jobId: job, jobSeekerId: seeker } },
      include: { history: true },
    });
    assert.equal(application.status, 'Applied');
    assert.equal(application.history.length, 1);
    assert.equal(application.history[0].applicationId, application.id);
    assert.equal(application.history[0].previousStatus, null);
    assert.equal(application.history[0].newStatus, 'Applied');
    assert.equal(application.history[0].changedById, seeker);
    await assert.rejects(
      db.application.create({ data: { jobId: job, jobSeekerId: seeker } }),
      { code: 'P2002' },
    );
    const duplicate = await request(app)
      .post(`/api/jobs/${job}/applications`)
      .set(auth(seeker))
      .send({})
      .expect(409);
    assert.deepEqual(duplicate.body, {
      success: false,
      error: {
        code: 'ALREADY_APPLIED',
        message: 'You have already applied to this job',
      },
    });
    await request(app)
      .post('/api/jobs/missing/applications')
      .set(auth(seeker))
      .expect(404);
  });

  void test('status changes persist history, unchanged status is a no-op, concurrent history forms a chain', async () => {
    const { seeker, owner, job } = fixtures;
    await createApplication(db, fixtures);
    const application = await db.application.findUniqueOrThrow({
      where: { jobId_jobSeekerId: { jobId: job, jobSeekerId: seeker } },
    });
    const path = `/api/applications/${application.id}/status`;
    await request(app)
      .patch(path)
      .set(auth(owner))
      .send({ status: 'Reviewing' })
      .expect(200);
    const before = await db.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    await request(app)
      .patch(path)
      .set(auth(owner))
      .send({ status: 'Reviewing' })
      .expect(200);
    assert.equal(
      await db.applicationHistory.count({
        where: { applicationId: application.id },
      }),
      2,
    );
    assert.equal(
      (
        await db.application.findUniqueOrThrow({
          where: { id: application.id },
        })
      ).updatedAt.toISOString(),
      before.updatedAt.toISOString(),
    );
    const results = await Promise.all(
      ['Shortlisted', 'Accepted'].map((status) =>
        request(app).patch(path).set(auth(owner)).send({ status }),
      ),
    );
    assert.deepEqual(
      results.map((response) => response.status),
      [200, 200],
    );
    const history = await db.applicationHistory.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: 'asc' },
    });
    assert.equal(history.length, 4);
    for (let i = 1; i < history.length; i++) {
      assert.equal(history[i].applicationId, application.id);
      assert.equal(history[i].previousStatus, history[i - 1].newStatus);
      assert.equal(history[i].changedById, owner);
    }
    const current = await db.application.findUniqueOrThrow({
      where: { id: application.id },
    });
    assert.equal(current.status, history.at(-1)!.newStatus);
    await request(app)
      .patch(path)
      .set(auth(owner))
      .send({ status: 'reviewing' })
      .expect(400);
    await request(app)
      .patch('/api/applications/missing/status')
      .set(auth(owner))
      .send({ status: 'Rejected' })
      .expect(404);
  });

  void test('all five supported statuses persist a matching history and current status', async () => {
    const { owner } = fixtures;
    const application = await createApplication(db, fixtures);
    let previousStatus: ApplicationStatus = 'Applied';
    for (const status of [
      'Reviewing',
      'Shortlisted',
      'Rejected',
      'Accepted',
      'Applied',
    ] as const) {
      const response = await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set(auth(owner))
        .send({ status })
        .expect(200);
      assert.equal(response.body.data.status, status);
      const persisted = await db.application.findUniqueOrThrow({
        where: { id: application.id },
      });
      assert.equal(persisted.status, status);
      const history: ApplicationHistory =
        await db.applicationHistory.findFirstOrThrow({
          where: {
            applicationId: application.id,
            previousStatus,
            newStatus: status,
            changedById: owner,
          },
        });
      assert.equal(history.applicationId, application.id);
      previousStatus = status;
    }
    assert.equal(
      await db.applicationHistory.count({
        where: { applicationId: application.id },
      }),
      6,
    );
  });

  void test('failed history insertion rolls back status mutation in PostgreSQL', async () => {
    const { seeker, company, job } = fixtures;
    await createApplication(db, fixtures);
    const application = await db.application.findUniqueOrThrow({
      where: { jobId_jobSeekerId: { jobId: job, jobSeekerId: seeker } },
    });
    const count = await db.applicationHistory.count({
      where: { applicationId: application.id },
    });
    await assert.rejects(
      updateApplicationStatus(db, application.id, 'Rejected', {
        id: 'nonexistent-user',
        email: 'missing@example.com',
        role: 'COMPANY',
        company: { id: company },
      }),
      { code: 'P2003' },
    );
    assert.equal(
      (
        await db.application.findUniqueOrThrow({
          where: { id: application.id },
        })
      ).status,
      application.status,
    );
    assert.equal(
      await db.applicationHistory.count({
        where: { applicationId: application.id },
      }),
      count,
    );
  });
});
