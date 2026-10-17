import type { AuthenticatedUser } from './auth-user.js';

declare global {
  namespace Express {
    interface Locals {
      user: AuthenticatedUser;
    }
  }
}
