import type { Role } from '@prisma/client';
import type { RequestHandler } from 'express';

import { forbidden } from '../utils/AppError.js';

export function requireRole(role: Role): RequestHandler {
  return (_req, res, next) => {
    if (res.locals.user.role !== role) {
      throw forbidden();
    }
    next();
  };
}
