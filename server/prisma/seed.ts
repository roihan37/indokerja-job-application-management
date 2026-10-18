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
    const seekers = [];
    for (const [index, email] of [
      'seeker@example.com',
      'seeker2@example.com',
    ].entries()) {
      const seeker = await tx.user.upsert({
        where: { email },
        update: { passwordHash },
        create: { email, passwordHash, role: 'JOB_SEEKER' },
      });
      seekers.push(seeker);
      await tx.jobSeekerProfile.upsert({
        where: { userId: seeker.id },
        update: {},
        create: {
          userId: seeker.id,
          fullName: index === 0 ? 'Andi Pratama' : 'Siti Rahma',
          phone: index === 0 ? '+6281200000001' : null,
          location: index === 0 ? 'Jakarta' : 'Bandung',
          headline: index === 0 ? 'Frontend Developer' : 'Backend Developer',
          summary:
            index === 0
              ? 'Pengembang frontend dengan fokus pada React, TypeScript, dan antarmuka yang mudah digunakan.'
              : null,
        },
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
      const demoJob = await tx.job.upsert({
        where: { id: `demo-job-${index + 1}` },
        update: job,
        create: { id: `demo-job-${index + 1}`, ...job },
      });
      // Preserve existing attachments, statuses, and history when reseeding.
      for (const seeker of seekers) {
        await tx.application.upsert({
          where: {
            jobId_jobSeekerId: {
              jobId: demoJob.id,
              jobSeekerId: seeker.id,
            },
          },
          update: {},
          create: {
            jobId: demoJob.id,
            jobSeekerId: seeker.id,
            status: 'Applied',
            history: {
              create: {
                previousStatus: null,
                newStatus: 'Applied',
                changedById: seeker.id,
              },
            },
          },
        });
      }
    }
  });
  console.log(
    'Seeded two companies, two jobs, two candidate profiles, and four applications. Existing profiles, attachments, and application history are preserved. Upload real PDF resumes through the Profile page. Password supplied through DEMO_PASSWORD.',
  );
} finally {
  await db.$disconnect();
}
