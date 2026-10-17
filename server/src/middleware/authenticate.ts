import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';

import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from '../utils/AppError.js';

const unauthorized = () =>
  new AppError(401, 'UNAUTHORIZED', 'A valid bearer token is required');

export function authenticate(db: PrismaClient, secret: string): RequestHandler {
  return async (req, res, next) => {
    const token = /^Bearer ([^\s]+)$/i.exec(
      req.headers.authorization ?? '',
    )?.[1];
    let subject: string;
    try {
      subject = verifyAccessToken(token ?? '', secret);
    } catch {
      throw unauthorized();
    }
    const user = await db.user.findUnique({
      where: { id: subject },
      select: {
        id: true,
        email: true,
        role: true,
        company: { select: { id: true } },
      },
    });
    if (!user) {
      throw unauthorized();
    }
    res.locals.user = user;
    next();
  };
}
