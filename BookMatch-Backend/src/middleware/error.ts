import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);
  logger.error(err.stack);
  
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error interno' });
}

