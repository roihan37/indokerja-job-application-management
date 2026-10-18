import 'dotenv/config';

import { z } from 'zod';

export function readConfig() {
  return z
    .object({
      SUPABASE_URL: z.string().url().optional(),
      SUPABASE_SECRET_KEY: z.string().min(1).optional(),
      SUPABASE_STORAGE_BUCKET: z.string().min(1).default('candidate-resumes'),
      DATABASE_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
      PORT: z.coerce.number().int().min(1).max(65535).default(4000),
      CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
    })
    .parse(process.env);
}
export type Config = ReturnType<typeof readConfig>;
