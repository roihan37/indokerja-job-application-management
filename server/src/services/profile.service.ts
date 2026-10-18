import type { PrismaClient } from '@prisma/client';

import { resumeMetadataSelect } from './resumes.service.js';
import type { ProfileInput } from '../validators/profile.schema.js';

export const profileSelect = {
  fullName: true,
  phone: true,
  location: true,
  headline: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
} as const;
export async function getMyProfile(db: PrismaClient, userId: string) {
  const [profile, currentResume] = await Promise.all([
    db.jobSeekerProfile.findUnique({
      where: { userId },
      select: profileSelect,
    }),
    db.resume.findFirst({
      where: { userId },
      select: resumeMetadataSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
  ]);
  return { profile, currentResume };
}
export async function updateMyProfile(
  db: PrismaClient,
  userId: string,
  input: ProfileInput,
) {
  await db.jobSeekerProfile.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
  return getMyProfile(db, userId);
}
