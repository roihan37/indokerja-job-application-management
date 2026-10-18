import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import request from 'supertest';

import type { ResumeStorage } from '../../src/lib/supabase.js';
import { setupIntegration } from '../helpers/testDatabase.js';

void describe('candidate profiles and private resume integration', () => {
  const signed: string[] = [];
  const storage: ResumeStorage = {
    upload: async () => {},
    remove: async () => {},
    signedUrl: async (key) => {
      signed.push(key);
      return 'https://storage.example/signed';
    },
  };
  const { app, db, fixtures, auth } = setupIntegration(storage);
  async function upload(userId: string) {
    return request(app)
      .post('/api/profile/me/resume')
      .set(auth(userId))
      .attach('file', Buffer.from('%PDF-1.7 test'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
  }
  void test('profiles are validated and scoped to authenticated seekers', async () => {
    await request(app)
      .patch('/api/profile/me')
      .send({ fullName: 'No' })
      .expect(401);
    await request(app)
      .patch('/api/profile/me')
      .set(auth(fixtures.owner))
      .send({ fullName: 'No' })
      .expect(403);
    await request(app)
      .patch('/api/profile/me')
      .set(auth(fixtures.seeker))
      .send({ userId: fixtures.otherSeeker })
      .expect(400);
    await request(app)
      .patch('/api/profile/me')
      .set(auth(fixtures.seeker))
      .send({ fullName: '  Sari  ' })
      .expect(200);
    const updated = await request(app)
      .patch('/api/profile/me')
      .set(auth(fixtures.seeker))
      .send({ phone: '0812', summary: '' })
      .expect(200);
    assert.equal(updated.body.data.profile.fullName, 'Sari');
    assert.equal(updated.body.data.profile.summary, null);
    const other = await request(app)
      .get('/api/profile/me')
      .set(auth(fixtures.otherSeeker))
      .expect(200);
    assert.equal(other.body.data.profile, null);
  });
  void test('rejects non-PDF, oversized uploads and company uploads', async () => {
    await request(app)
      .post('/api/profile/me/resume')
      .set(auth(fixtures.owner))
      .expect(403);
    for (const [buffer, contentType] of [
      [Buffer.from('fake'), 'application/pdf'],
      [Buffer.from('%PDF-'), 'text/plain'],
      [Buffer.alloc(5 * 1024 * 1024 + 1), 'application/pdf'],
    ] as const) {
      await request(app)
        .post('/api/profile/me/resume')
        .set(auth(fixtures.seeker))
        .attach('file', buffer, { filename: 'cv.pdf', contentType })
        .expect(400);
    }
    assert.equal(
      await db.resume.count({ where: { userId: fixtures.seeker } }),
      0,
    );
  });
  void test('preserves the selected CV and authorizes profile and CV access', async () => {
    const first = (await upload(fixtures.seeker)).body.data;
    assert.equal(first.storageKey, undefined);
    await request(app)
      .post(`/api/jobs/${fixtures.job}/applications`)
      .set(auth(fixtures.otherSeeker))
      .send({ resumeId: first.id })
      .expect(400);
    const applied = await request(app)
      .post(`/api/jobs/${fixtures.job}/applications`)
      .set(auth(fixtures.seeker))
      .send({ resumeId: first.id })
      .expect(201);
    const second = (await upload(fixtures.seeker)).body.data;
    const application = await db.application.findUniqueOrThrow({
      where: { id: applied.body.data.id },
      include: { resume: true, history: true },
    });
    assert.equal(application.resumeId, first.id);
    assert.equal(application.history.length, 1);
    const current = await request(app)
      .get('/api/profile/me')
      .set(auth(fixtures.seeker))
      .expect(200);
    assert.equal(current.body.data.currentResume.id, second.id);
    const candidatePath = `/api/applications/${application.id}/candidate`;
    await request(app)
      .get(candidatePath)
      .set(auth(fixtures.outsider))
      .expect(403);
    await request(app)
      .get(candidatePath)
      .set(auth(fixtures.seeker))
      .expect(403);
    const candidate = await request(app)
      .get(candidatePath)
      .set(auth(fixtures.owner))
      .expect(200);
    assert.equal(candidate.body.data.resume.id, first.id);
    assert.equal(candidate.body.data.jobSeeker.passwordHash, undefined);
    const urlPath = `/api/applications/${application.id}/resume-url`;
    const before = signed.length;
    await request(app).get(urlPath).set(auth(fixtures.outsider)).expect(403);
    assert.equal(signed.length, before);
    const result = await request(app)
      .get(urlPath)
      .set(auth(fixtures.owner))
      .expect(200);
    assert.equal(result.headers['cache-control'], 'no-store');
    assert.equal(result.body.data.expiresIn, 60);
    assert.equal(signed.at(-1), application.resume?.storageKey);
    await request(app)
      .get(`/api/profile/me/resumes/${first.id}/url`)
      .set(auth(fixtures.otherSeeker))
      .expect(404);
    await request(app)
      .get(`/api/profile/me/resumes/${first.id}/url`)
      .set(auth(fixtures.seeker))
      .expect(200);
  });
  void test('legacy applications without resumes remain valid', async () => {
    const response = await request(app)
      .post(`/api/jobs/${fixtures.job}/applications`)
      .set(auth(fixtures.seeker))
      .expect(201);
    await request(app)
      .get(`/api/applications/${response.body.data.id}/resume-url`)
      .set(auth(fixtures.owner))
      .expect(404);
    const detail = await request(app)
      .get(`/api/applications/${response.body.data.id}/candidate`)
      .set(auth(fixtures.owner))
      .expect(200);
    assert.equal(detail.body.data.resume, null);
  });
});
