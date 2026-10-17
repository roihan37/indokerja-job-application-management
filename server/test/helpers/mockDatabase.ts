import type { PrismaClient } from '@prisma/client';

// Partial doubles isolate service rules and deliberately injected failures.
export function mockDatabase(delegates: object): PrismaClient {
  return delegates as PrismaClient;
}
