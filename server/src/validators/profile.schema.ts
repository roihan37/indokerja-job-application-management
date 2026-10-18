import { z } from 'zod';

import { idParamsSchema } from './shared.schema.js';

const field = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null)
    .nullable()
    .optional();
export const profileRequestSchema = z.object({
  body: z
    .object({
      fullName: field(120),
      phone: field(40),
      location: field(200),
      headline: field(200),
      summary: field(3000),
    })
    .strict()
    .refine(
      (body) => Object.keys(body).length > 0,
      'Provide at least one profile field',
    ),
});
export type ProfileInput = z.output<typeof profileRequestSchema>['body'];
export const resumeUrlRequestSchema = z.object({
  params: idParamsSchema,
  query: z.object({ download: z.enum(['true', 'false']).optional() }).strict(),
});
