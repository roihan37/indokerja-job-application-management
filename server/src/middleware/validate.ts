import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';

export type ValidatedHandler<Schema extends z.ZodType> = RequestHandler<
  Request['params'],
  unknown,
  unknown,
  Request['query'],
  { validated: z.output<Schema> }
>;

export function validate(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    res.locals.validated = schema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });
    next();
  };
}
