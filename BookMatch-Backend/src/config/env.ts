import 'dotenv/config';

const required = (v: string | undefined, k: string) => {
  if (!v) throw new Error(`Falta variable de entorno: ${k}`);
  return v;
};

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: required(process.env.DATABASE_URL, 'DATABASE_URL'),
  FIREBASE_PROJECT_ID: required(process.env.FIREBASE_PROJECT_ID, 'FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: required(process.env.FIREBASE_CLIENT_EMAIL, 'FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY: required(process.env.FIREBASE_PRIVATE_KEY, 'FIREBASE_PRIVATE_KEY'),
  STRIPE_SECRET_KEY: required(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:4200',
  /** URL pública del backend, usada como `callbackUrl` al disparar webhooks de n8n. */
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL?.trim() || '',
  /** URL del webhook de n8n para el chat con IA. Ej: https://tu-instancia.app.n8n.cloud/webhook/ID_REAL */
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL?.trim() || '',
  /** URL del webhook de n8n para la generación de playlists por IA (H1.3 / SCRUM-162). */
  N8N_WEBHOOK_PLAYLIST_URL: process.env.N8N_WEBHOOK_PLAYLIST_URL?.trim() || '',
  /** Secret compartido entre backend y n8n para el callback `POST /api/playlists/:id/ai-complete`. */
  N8N_CALLBACK_SECRET: process.env.N8N_CALLBACK_SECRET?.trim() || '',
  /** API Key de OpenRouter para generación de portadas IA (FLUX Schnell). Opcional: sin ella se omite la generación. */
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY?.trim() || '',
  /**
   * Demo / presentación: ms hasta auto-aceptar trueques PROPOSED cuyo receptor es usuario seed
   * (`trade_seed_*` o `seed_*`). 0 o ausente = desactivado.
   */
  TRADE_DEMO_AUTO_ACCEPT_MS: Math.max(0, Number(process.env.TRADE_DEMO_AUTO_ACCEPT_MS ?? 0) || 0),
};

