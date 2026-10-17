import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import request from 'supertest';

import { setupIntegration } from '../helpers/testDatabase.js';
import { createApplication } from '../helpers/testFactory.js';

void describe('authorization HTTP integration', () => {
  const { db, app, fixtures, auth } = setupIntegration();

  void test('role restrictions and strict validation reject unauthorized fields and bad data', async () => {
    const { seeker, owner, company, job } = fixtures;
    await request(app).post('/api/jobs').set(auth(seeker)).send({}).expect(403);
    await request(app)
      .get(`/api/jobs/${job}/applications`)
      .set(auth(seeker))
      .expect(403);
    await request(app)
      .patch('/api/applications/missing/status')
      .set(auth(seeker))
      .send({ status: 'Accepted' })
      .expect(403);
    await request(app)
      .post(`/api/jobs/${job}/applications`)
      .set(auth(owner))
      .expect(403);
    await request(app).get('/api/applications/me').set(auth(owner)).expect(403);
    await request(app).get('/api/jobs?mine=true').set(auth(seeker)).expect(403);
    await request(app)
      .get('/api/jobs?mine=invalid')
      .set(auth(owner))
      .expect(400);
    const invalid = await request(app)
      .post('/api/jobs')
      .set(auth(owner))
      .send({ title: ' ', salary: -1, jobType: 'OTHER', companyId: company })
      .expect(400);
    assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
    await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
  });

  void test('own application filtering and company ownership prevent information leaks and mutations', async () => {
    const { seeker, otherSeeker, owner, outsider, job, prefix } = fixtures;
    await createApplication(db, fixtures);
    await createApplication(db, {
      ...fixtures,
      seeker: otherSeeker,
      job: fixtures.otherJob,
    });
    const mine = await request(app)
      .get('/api/applications/me')
      .set(auth(seeker))
      .expect(200);
    assert.equal(mine.body.data.length, 1);
    const other = await request(app)
      .get('/api/applications/me')
      .set(auth(otherSeeker))
      .expect(200);
    assert.equal(other.body.data.length, 1);
    assert.equal(other.body.data[0].job.id, fixtures.otherJob);
    assert.equal(mine.body.data[0].job.id, job);
    assert.notEqual(mine.body.data[0].id, other.body.data[0].id);
    await request(app)
      .get(`/api/jobs/${job}/applications`)
      .set(auth(outsider))
      .expect(403);
    const owned = await request(app)
      .get(`/api/jobs/${job}/applications`)
      .set(auth(owner))
      .expect(200);
    assert.equal(
      owned.body.data[0].jobSeeker.email,
      `${prefix}-seeker@example.com`,
    );
    assert.equal(owned.body.data[0].jobSeeker.passwordHash, undefined);
    const id = mine.body.data[0].id;
    await request(app)
      .patch(`/api/applications/${id}/status`)
      .set(auth(outsider))
      .send({ status: 'Accepted' })
      .expect(403);
    assert.equal(
      (await db.application.findUniqueOrThrow({ where: { id } })).status,
      'Applied',
    );
    assert.equal(
      await db.applicationHistory.count({ where: { applicationId: id } }),
      1,
    );
  });
});
