import type { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { type ResumeStorage, createResumeStorage } from './lib/supabase.js';
import type { Config } from './lib/config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRoutes } from './routes/index.js';
import { notFound } from './utils/AppError.js';

export function createApp(
  db: PrismaClient,
  config: Pick<Config, 'JWT_SECRET' | 'CLIENT_ORIGIN'> & Partial<Config>,
  storage: ResumeStorage = createResumeStorage(config),
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_ORIGIN }));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', apiRoutes(db, config.JWT_SECRET, storage));
  app.use((_req, _res) => {
    throw notFound();
  });
  app.use(errorHandler);
  return app;
}
