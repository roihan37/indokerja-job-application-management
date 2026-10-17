import 'dotenv/config';

import { type Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const password = z
  .string()
  .min(12)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must not exceed 72 UTF-8 bytes',
  )
  .parse(process.env.DEMO_PASSWORD);
const db = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const email of ['seeker@example.com', 'seeker2@example.com']) {
      await tx.user.upsert({
        where: { email },
        update: { passwordHash },
        create: { email, passwordHash, role: 'JOB_SEEKER' },
      });
    }
    for (const [index, name] of [
      'Example Technology',
      'Nusantara Digital',
    ].entries()) {
      const email = `company${index + 1}@example.com`;
      const user = await tx.user.upsert({
        where: { email },
        update: { passwordHash },
        create: { email, passwordHash, role: 'COMPANY' },
      });
      const company = await tx.company.upsert({
        where: { userId: user.id },
        update: { name },
        create: { name, userId: user.id },
      });
      const job = {
        companyId: company.id,
        title: index === 0 ? 'Frontend Developer' : 'Backend Developer',
        location: 'Jakarta',
        salary: 8500000,
        jobType: 'FULL_TIME' as const,
        description: 'Build and maintain web applications.',
      };
      await tx.job.upsert({
        where: { id: `demo-job-${index + 1}` },
        update: job,
        create: { id: `demo-job-${index + 1}`, ...job },
      });
    }
  });
  console.log(
    'Seeded two companies, two jobs, and two seekers. Password supplied through DEMO_PASSWORD.',
  );
} finally {
  await db.$disconnect();
}
