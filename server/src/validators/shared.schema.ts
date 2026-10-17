import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
});

export const idRequestSchema = z.object({ params: idParamsSchema });
