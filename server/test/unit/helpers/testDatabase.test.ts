import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { readTestDatabaseUrl } from '../../setup.js';

void describe('test database safety guard', () => {
  void test('accepts an explicitly configured separate test database', () => {
    const url = 'postgresql://localhost/indokerja_test';
    assert.equal(
      readTestDatabaseUrl({
        TEST_DATABASE_URL: url,
        DATABASE_URL: 'postgresql://localhost/indokerja',
      }),
      url,
    );
  });
  void test('rejects missing configuration, non-test databases and custom schemas', () => {
    for (const url of [
      undefined,
      'postgresql://localhost/indokerja',
      'mysql://localhost/indokerja_test',
      'postgresql://localhost/indokerja_test?schema=production',
    ]) {
      assert.throws(() => readTestDatabaseUrl({ TEST_DATABASE_URL: url }));
    }
  });
  void test('rejects the application database even with different credentials or URL options', () => {
    assert.throws(
      () =>
        readTestDatabaseUrl({
          TEST_DATABASE_URL:
            'postgresql://tester@localhost:5432/indokerja_test?schema=public',
          DATABASE_URL:
            'postgresql://developer@localhost/indokerja_test?connection_limit=3',
        }),
      /must be different/,
    );
  });
});
