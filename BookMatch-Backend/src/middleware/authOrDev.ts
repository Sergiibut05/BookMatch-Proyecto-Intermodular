import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { auth } from './auth.js';

/**
 * Auth normal (Firebase) con fallback solo en desarrollo:
 * si viene `x-dev-user-id`, se inyecta `req.user` para poder iterar sin tokens.
 */
export function authOrDev(req: Request, res: Response, next: NextFunction) {
  if (env.NODE_ENV === 'development') {
    const raw = req.header('x-dev-user-id');
    const id = raw ? Number(raw) : NaN;
    if (Number.isInteger(id) && id > 0) {
      req.user = {
        id,
        uid: `dev-${id}`,
        email: `dev-${id}@local`,
        role: 'USER',
      };
      return next();
    }
  }

  return auth(req, res, next);
}

