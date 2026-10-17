import 'dotenv/config';

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function readTestDatabaseUrl(environment = process.env): string {
  const value = environment.TEST_DATABASE_URL;
  if (!value) {
    throw new Error(
      'TEST_DATABASE_URL must identify a dedicated PostgreSQL test database',
    );
  }
  const testUrl = new URL(value);
  const databaseName = decodeURIComponent(testUrl.pathname.slice(1));
  if (
    !['postgres:', 'postgresql:'].includes(testUrl.protocol) ||
    !/^[a-zA-Z0-9_]+_test$/.test(databaseName) ||
    (testUrl.searchParams.has('schema') &&
      testUrl.searchParams.get('schema') !== 'public')
  ) {
    throw new Error(
      'Test database name must end in _test and use the public schema',
    );
  }
  if (environment.DATABASE_URL) {
    const developmentUrl = new URL(environment.DATABASE_URL);
    if (
      testUrl.hostname.toLowerCase() ===
        developmentUrl.hostname.toLowerCase() &&
      (testUrl.port || '5432') === (developmentUrl.port || '5432') &&
      databaseName === decodeURIComponent(developmentUrl.pathname.slice(1))
    ) {
      throw new Error('Test and application databases must be different');
    }
  }
  return value;
}

export function migrateTestDatabase() {
  const databaseUrl = readTestDatabaseUrl();
  try {
    execFileSync(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      {
        cwd: fileURLToPath(new URL('../', import.meta.url)),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: 'pipe',
      },
    );
  } catch {
    throw new Error(
      'Test database migration failed; verify the dedicated PostgreSQL database is available',
    );
  }
}
