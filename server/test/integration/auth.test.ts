import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { describe, test } from 'node:test';

import jwt from 'jsonwebtoken';
import request from 'supertest';

import { setupIntegration } from '../helpers/testDatabase.js';

void describe('auth HTTP integration', () => {
  const { app, secret, password, fixtures, auth } = setupIntegration();

  void test('login accepts normalized email, rejects wrong credentials, and omits hash', async () => {
    const { seeker, prefix } = fixtures;
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: ` ${prefix}-SEEKER@example.com `, password })
      .expect(200);
    assert.equal(response.body.data.user.id, seeker);
    assert.equal(response.body.data.user.passwordHash, undefined);
    assert.equal(typeof response.body.data.accessToken, 'string');
    await request(app)
      .post('/api/auth/login')
      .send({ email: `${prefix}-seeker@example.com`, password: 'wrong' })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password })
      .expect(401);
  });

  void test('missing credentials return field validation errors', async () => {
    for (const body of [{}, { email: 'person@example.com' }, { password }]) {
      const response = await request(app)
        .post('/api/auth/login')
        .send(body)
        .expect(400);
      assert.equal(response.body.success, false);
      assert.equal(response.body.error.code, 'VALIDATION_ERROR');
      assert.ok(response.body.error.details.length > 0);
    }
  });

  void test('missing, forged, expired and nonexistent-user tokens are rejected', async () => {
    const { seeker } = fixtures;
    await request(app).get('/api/jobs').expect(401);
    await request(app)
      .get('/api/jobs')
      .set('Authorization', 'Bearer forged')
      .expect(401);
    const expired = jwt.sign({}, secret, {
      subject: seeker,
      expiresIn: -1,
      issuer: 'indokerja',
      audience: 'indokerja-api',
    });
    await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
    await request(app).get('/api/jobs').set(auth('missing')).expect(401);
  });

  void test('JWT verification rejects wrong signing settings and missing expiration', async () => {
    const { seeker } = fixtures;
    const options = {
      subject: seeker,
      expiresIn: '1h',
      issuer: 'indokerja',
      audience: 'indokerja-api',
    } as const;
    const invalidTokens = [
      jwt.sign({}, secret, { ...options, issuer: 'other' }),
      jwt.sign({}, secret, { ...options, audience: 'other' }),
      jwt.sign({}, secret, { ...options, algorithm: 'HS384' }),
      jwt.sign({}, secret, {
        subject: seeker,
        issuer: 'indokerja',
        audience: 'indokerja-api',
      }),
      jwt.sign({}, randomBytes(48).toString('hex'), options),
    ];
    for (const invalidToken of invalidTokens) {
      const response = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
      assert.deepEqual(response.body, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'A valid bearer token is required',
        },
      });
    }
  });
});
