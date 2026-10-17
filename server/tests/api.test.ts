import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { updateApplicationStatus } from '../src/services/applications.service.js';

// The Node test runner manages the promises returned by test registration.
// This suite writes fixtures only to an explicitly configured test database.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'Set TEST_DATABASE_URL to a dedicated migrated PostgreSQL test database',
  );
}
const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
const secret = randomBytes(48).toString('hex');
const app = createApp(db, {
  JWT_SECRET: secret,
  CLIENT_ORIGIN: 'http://localhost:5173',
});
const prefix = randomBytes(8).toString('hex');
const password = randomBytes(18).toString('hex');
let seeker: string,
  otherSeeker: string,
  owner: string,
  outsider: string,
  company: string,
  job: string;
const token = (id: string) =>
  jwt.sign({}, secret, {
    subject: id,
    expiresIn: '1h',
    issuer: 'indokerja',
    audience: 'indokerja-api',
  });
const auth = (id: string) => ({ Authorization: `Bearer ${token(id)}` });
before(async () => {
  const passwordHash = await bcrypt.hash(password, 12);
  const create = (name: string, role: 'JOB_SEEKER' | 'COMPANY') =>
    db.user.create({
      data: { email: `${prefix}-${name}@example.com`, passwordHash, role },
    });
  seeker = (await create('seeker', 'JOB_SEEKER')).id;
  otherSeeker = (await create('seeker2', 'JOB_SEEKER')).id;
  owner = (await create('owner', 'COMPANY')).id;
  outsider = (await create('outsider', 'COMPANY')).id;
  company = (await db.company.create({ data: { name: prefix, userId: owner } }))
    .id;
  await db.company.create({
    data: { name: `${prefix}-other`, userId: outsider },
  });
  job = (
    await db.job.create({
      data: {
        companyId: company,
        title: 'Developer',
        location: 'Jakarta',
        salary: 8000000,
        jobType: 'FULL_TIME',
      },
    })
  ).id;
});
after(async () => {
  const users = [seeker, otherSeeker, owner, outsider].filter(Boolean);
  await db.applicationHistory.deleteMany({
    where: { application: { job: { company: { userId: { in: users } } } } },
  });
  await db.application.deleteMany({
    where: { job: { company: { userId: { in: users } } } },
  });
  await db.job.deleteMany({ where: { company: { userId: { in: users } } } });
  await db.company.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
void test('login accepts normalized email, rejects wrong credentials, and omits hash', async () => {
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
void test('missing, forged, expired and nonexistent-user tokens are rejected', async () => {
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
void test('seeker lists and views jobs; company creates and lists its own jobs', async () => {
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
void test('role restrictions and strict validation reject unauthorized fields and bad data', async () => {
  await request(app).post('/api/jobs').set(auth(seeker)).send({}).expect(403);
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
  await request(app).get('/api/jobs?mine=invalid').set(auth(owner)).expect(400);
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
void test('concurrent applications create one application and initial history; DB rejects direct duplicate', async () => {
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
void test('own application filtering and company ownership prevent information leaks and mutations', async () => {
  const mine = await request(app)
    .get('/api/applications/me')
    .set(auth(seeker))
    .expect(200);
  assert.equal(mine.body.data.length, 1);
  const other = await request(app)
    .get('/api/applications/me')
    .set(auth(otherSeeker))
    .expect(200);
  assert.deepEqual(other.body.data, []);
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
});
void test('status changes persist history, unchanged status is a no-op, concurrent history forms a chain', async () => {
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
      await db.application.findUniqueOrThrow({ where: { id: application.id } })
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
void test('failed history insertion rolls back status mutation in PostgreSQL', async () => {
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
    (await db.application.findUniqueOrThrow({ where: { id: application.id } }))
      .status,
    application.status,
  );
  assert.equal(
    await db.applicationHistory.count({
      where: { applicationId: application.id },
    }),
    count,
  );
});

void test('validation middleware preserves field names and rejects untrusted input before services', async () => {
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
    .send({ email: `${prefix}-seeker@example.com`, password, role: 'COMPANY' })
    .expect(400);
});

void test('JWT verification rejects wrong signing settings and missing expiration', async () => {
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

void test('unmatched routes return the consistent safe 404 envelope', async () => {
  for (const path of ['/missing', '/api/missing']) {
    const response = await request(app).get(path).set(auth(seeker)).expect(404);
    assert.deepEqual(response.body, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  }
});
