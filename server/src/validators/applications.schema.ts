import { ApplicationStatus } from '@prisma/client';
import { z } from 'zod';

import { idParamsSchema } from './shared.schema.js';

export const applyRequestSchema = z.object({
  params: idParamsSchema,
  body: z.object({}).strict().default({}),
});

export const updateStatusRequestSchema = z.object({
  params: idParamsSchema,
  body: z.object({ status: z.nativeEnum(ApplicationStatus) }).strict(),
});
