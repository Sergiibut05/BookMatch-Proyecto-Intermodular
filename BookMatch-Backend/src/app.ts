import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/error.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import catalogBooksRoutes from './modules/catalog-books/catalog-books.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import forumsRoutes from './modules/forums/forums.routes.js';
import commentsRoutes from './modules/comments/comments.routes.js';
import playlistsRoutes from './modules/playlists/playlists.routes.js';
import tradesRoutes from './modules/trades/trades.routes.js';
import aiChatRoutes from './routes/ai-chat.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import { stripeWebhookCtrl } from './modules/payments/payments.controller.js';

import hpp from 'hpp';

const app = express();

const isTest = env.NODE_ENV === 'test';
const isDev = env.NODE_ENV === 'development';
/** En local el límite global (100/15min) se agota con HMR y muchas llamadas; en prod/staging se mantiene. */
const applyRateLimit = !isTest && !isDev;

// CORS debe estar antes de todo, incluso antes del webhook
const allowedOrigins = [
  env.FRONTEND_URL || 'http://localhost:4200',
  'https://book-match-proyecto-intermodular-b8.vercel.app',
  /^https:\/\/book-match-proyecto-intermodular.*\.vercel\.app$/,
  // Orígenes de apps móviles/webview
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:4200',
  'https://localhost'
  ];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está permitido
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Accept-Language', 'Content-Language', 'x-dev-user-id'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(hpp());

// Webhook de Stripe debe estar antes de express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookCtrl);

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

if (applyRateLimit) {
  app.use(generalLimiter);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

if (applyRateLimit) {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}

app.use('/api/users', usersRoutes);
app.use('/api/catalog-books', catalogBooksRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/forums', forumsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

export default app;
