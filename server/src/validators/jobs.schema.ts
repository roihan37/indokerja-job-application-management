import { JobType } from '@prisma/client';
import { z } from 'zod';

const jobQuerySchema = z
  .object({
    mine: z.enum(['true', 'false']).optional(),
  })
  .strict();

const createJobSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    location: z.string().trim().min(1).max(200),
    salary: z.number().int().min(0).max(2147483647),
    jobType: z.nativeEnum(JobType),
    description: z.string().trim().max(10000).optional(),
  })
  .strict();

export const listJobsRequestSchema = z.object({ query: jobQuerySchema });
export const createJobRequestSchema = z.object({ body: createJobSchema });
export type JobQuery = z.infer<typeof jobQuerySchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
