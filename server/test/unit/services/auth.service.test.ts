import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { before, describe, test } from 'node:test';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { loginUser } from '../../../src/services/auth.service.js';
import { mockDatabase } from '../../helpers/mockDatabase.js';

void describe('loginUser', () => {
  const password = randomBytes(18).toString('hex');
  const secret = randomBytes(48).toString('hex');
  let passwordHash: string;
  before(async () => {
    passwordHash = await bcrypt.hash(password, 12);
  });

  void test('verifies the password and returns a signed identity without the hash', async () => {
    const user = {
      id: 'seeker',
      email: 'seeker@example.com',
      role: 'JOB_SEEKER',
      passwordHash,
    };
    const db = mockDatabase({ user: { findUnique: async () => user } });
    const result = await loginUser(db, secret, { email: user.email, password });
    assert.deepEqual(result.user, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    assert.equal(result.tokenType, 'Bearer');
    const claims = jwt.verify(result.accessToken, secret, {
      algorithms: ['HS256'],
      issuer: 'indokerja',
      audience: 'indokerja-api',
    });
    assert.ok(typeof claims !== 'string');
    assert.equal(claims.sub, user.id);
    assert.equal(claims.exp! - claims.iat!, 3600);
    assert.equal(
      jwt.decode(result.accessToken, { complete: true })?.header.alg,
      'HS256',
    );
    assert.equal('passwordHash' in result.user, false);
  });

  for (const nonexistent of [false, true]) {
    void test(
      nonexistent
        ? 'rejects nonexistent users with the same safe credential error'
        : 'rejects an incorrect password',
      async () => {
        const db = mockDatabase({
          user: {
            findUnique: async () =>
              nonexistent ? null : { id: 'seeker', passwordHash },
          },
        });
        await assert.rejects(
          loginUser(db, secret, {
            email: 'seeker@example.com',
            password: 'wrong',
          }),
          {
            status: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        );
      },
    );
  }
});
