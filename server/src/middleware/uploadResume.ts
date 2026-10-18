import type { RequestHandler } from 'express';
import multer from 'multer';

import { AppError } from '../utils/AppError.js';

export const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_SIZE, files: 1, fields: 0, parts: 2 },
}).single('file');
export const uploadResume: RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    if (error) {
      next(
        new AppError(
          400,
          'INVALID_RESUME',
          error instanceof multer.MulterError &&
            error.code === 'LIMIT_FILE_SIZE'
            ? 'PDF must be at most 5 MB'
            : 'Upload exactly one PDF file using the file field',
        ),
      );
      return;
    }
    next();
  });
};
