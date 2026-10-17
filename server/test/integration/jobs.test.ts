import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import request from 'supertest';

import { setupIntegration } from '../helpers/testDatabase.js';

void describe('jobs HTTP integration', () => {
  const { db, app, fixtures, auth } = setupIntegration();

  void test('missing required job fields and invalid values are rejected without persistence', async () => {
    const { owner, company } = fixtures;
    const validJob = {
      title: 'Developer',
      location: 'Jakarta',
      salary: 8000000,
      jobType: 'FULL_TIME',
    };
    const before = await db.job.count({ where: { companyId: company } });
    for (const field of Object.keys(validJob)) {
      const body = { ...validJob } as Record<string, unknown>;
      delete body[field];
      const response = await request(app)
        .post('/api/jobs')
        .set(auth(owner))
        .send(body)
        .expect(400);
      assert.equal(response.body.error.code, 'VALIDATION_ERROR');
      assert.ok(
        response.body.error.details.some(
          (detail: { field: string }) => detail.field === field,
        ),
      );
    }
    for (const body of [
      { ...validJob, salary: 1.5 },
      { ...validJob, salary: 2147483648 },
      { ...validJob, jobType: 'INVALID' },
      { ...validJob, title: ' ' },
    ]) {
      await request(app)
        .post('/api/jobs')
        .set(auth(owner))
        .send(body)
        .expect(400);
    }
    assert.equal(await db.job.count({ where: { companyId: company } }), before);
  });

  void test('seeker lists and views jobs; company creates and lists its own jobs', async () => {
    const { seeker, owner, company, job } = fixtures;
    const list = await request(app)
      .get('/api/jobs')
      .set(auth(seeker))
      .expect(200);
    assert.ok(
      list.body.data.some((listedJob: { id: string }) => listedJob.id === job),
    );
    const detail = await request(app)
      .get(`/api/jobs/${job}`)
      .set(auth(seeker))
      .expect(200);
    assert.equal(detail.body.data.company.id, company);
    await request(app).get('/api/jobs/missing').set(auth(seeker)).expect(404);
    const created = await request(app)
      .post('/api/jobs')
      .set(auth(owner))
      .send({
        title: '  Engineer  ',
        location: '  Bandung  ',
        description: '  Build APIs.  ',
        salary: 0,
        jobType: 'CONTRACT',
      })
      .expect(201);
    assert.equal(created.body.data.companyId, company);
    assert.equal(created.body.data.title, 'Engineer');
    assert.equal(created.body.data.location, 'Bandung');
    assert.equal(created.body.data.description, 'Build APIs.');
    const persisted = await db.job.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });
    assert.equal(persisted.title, 'Engineer');
    const own = await request(app)
      .get('/api/jobs?mine=true')
      .set(auth(owner))
      .expect(200);
    assert.ok(
      own.body.data.every(
        (listedJob: { company: { id: string } }) =>
          listedJob.company.id === company,
      ),
    );
  });
});
