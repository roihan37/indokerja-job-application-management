import { z } from 'zod';

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(256),
  })
  .strict();

export const loginRequestSchema = z.object({ body: loginSchema });
export type LoginInput = z.infer<typeof loginSchema>;
