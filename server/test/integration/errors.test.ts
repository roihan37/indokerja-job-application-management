import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import request from 'supertest';

import { createApp } from '../../src/app.js';
import { mockDatabase } from '../helpers/mockDatabase.js';
import { setupIntegration } from '../helpers/testDatabase.js';

void describe('errors HTTP integration', () => {
  const { db, app, secret, password, fixtures, auth } = setupIntegration();

  void test('validation middleware preserves field names and rejects untrusted input before services', async () => {
    const { seeker, otherSeeker, owner, job, prefix } = fixtures;
    const invalidId = await request(app)
      .get('/api/jobs/invalid.id')
      .set(auth(seeker))
      .expect(400);
    assert.equal(invalidId.body.error.code, 'VALIDATION_ERROR');
    assert.equal(invalidId.body.error.details[0].field, 'id');
    const invalidQuery = await request(app)
      .get('/api/jobs?mine=invalid')
      .set(auth(owner))
      .expect(400);
    assert.equal(invalidQuery.body.error.details[0].field, 'mine');
    const invalidSalary = await request(app)
      .post('/api/jobs')
      .set(auth(owner))
      .send({
        title: 'Developer',
        location: 'Jakarta',
        salary: -1,
        jobType: 'FULL_TIME',
      })
      .expect(400);
    assert.equal(invalidSalary.body.error.details[0].field, 'salary');
    await request(app)
      .get('/api/jobs?companyId=untrusted')
      .set(auth(owner))
      .expect(400);
    await request(app)
      .post(`/api/jobs/${job}/applications`)
      .set(auth(otherSeeker))
      .send({ jobSeekerId: seeker })
      .expect(400);
    assert.equal(
      await db.application.count({ where: { jobSeekerId: otherSeeker } }),
      0,
    );
    await request(app)
      .post('/api/auth/login')
      .send({
        email: `${prefix}-seeker@example.com`,
        password,
        role: 'COMPANY',
      })
      .expect(400);
  });

  void test('unexpected database errors return a safe 500 envelope without internal details', async () => {
    const internalMessage = 'private database connection details';
    // Keep real authentication; inject only the database failure being exercised.
    const failingApp = createApp(
      mockDatabase({
        user: db.user,
        job: {
          findMany: async () => {
            throw new Error(internalMessage);
          },
        },
      }),
      { JWT_SECRET: secret, CLIENT_ORIGIN: 'http://localhost:5173' },
    );
    const response = await request(failingApp)
      .get('/api/jobs')
      .set(auth(fixtures.seeker))
      .expect(500);
    assert.deepEqual(response.body, {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
    assert.equal(
      JSON.stringify(response.body).includes(internalMessage),
      false,
    );
    assert.equal('stack' in response.body.error, false);
  });

  void test('unmatched routes return the consistent safe 404 envelope', async () => {
    const { seeker } = fixtures;
    for (const path of ['/missing', '/api/missing']) {
      const response = await request(app)
        .get(path)
        .set(auth(seeker))
        .expect(404);
      assert.deepEqual(response.body, {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }
  });
});
