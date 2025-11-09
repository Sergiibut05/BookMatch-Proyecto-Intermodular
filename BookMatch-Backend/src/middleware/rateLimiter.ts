import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

