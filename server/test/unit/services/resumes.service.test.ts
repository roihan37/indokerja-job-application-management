import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { ResumeStorage } from '../../../src/lib/supabase.js';
import {
  uploadResume,
  validatePdf,
} from '../../../src/services/resumes.service.js';
import { profileRequestSchema } from '../../../src/validators/profile.schema.js';
import { mockDatabase } from '../../helpers/mockDatabase.js';

const pdf = {
  originalname: '../../candidate.pdf',
  mimetype: 'application/pdf',
  size: 9,
  buffer: Buffer.from('%PDF-test'),
} as Express.Multer.File;
void describe('profile and resume business rules', () => {
  void test('validates profile fields and empty values', () => {
    assert.equal(
      profileRequestSchema.safeParse({ body: { userId: 'other' } }).success,
      false,
    );
    assert.equal(profileRequestSchema.safeParse({ body: {} }).success, false);
    assert.equal(
      profileRequestSchema.safeParse({ body: { fullName: 'x'.repeat(121) } })
        .success,
      false,
    );
    assert.equal(
      profileRequestSchema.parse({ body: { summary: '  ' } }).body.summary,
      null,
    );
    assert.throws(() => validatePdf(undefined), { code: 'INVALID_RESUME' });
  });
  void test('does not insert metadata on storage failure', async () => {
    let inserted = false;
    const db = mockDatabase({
      resume: {
        create: async () => {
          inserted = true;
        },
      },
    });
    const storage: ResumeStorage = {
      upload: async () => {
        throw new Error('offline');
      },
      remove: async () => {},
      signedUrl: async () => '',
    };
    await assert.rejects(uploadResume(db, storage, 'user', pdf), /offline/);
    assert.equal(inserted, false);
  });
  void test('cleans up only the new object on database failure', async () => {
    let uploaded = '';
    let removed = '';
    const db = mockDatabase({
      resume: {
        create: async () => {
          throw new Error('database unavailable');
        },
      },
    });
    const storage: ResumeStorage = {
      upload: async (key) => {
        uploaded = key;
      },
      remove: async (key) => {
        removed = key;
      },
      signedUrl: async () => '',
    };
    await assert.rejects(
      uploadResume(db, storage, 'user', pdf),
      /database unavailable/,
    );
    assert.ok(uploaded.startsWith('user/'));
    assert.ok(uploaded.endsWith('.pdf'));
    assert.equal(removed, uploaded);
  });
});
