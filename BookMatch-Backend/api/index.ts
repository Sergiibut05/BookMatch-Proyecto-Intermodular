/**
 * Punto de entrada para Vercel Serverless.
 * Re-exporta la app Express para que el rewrite a /api funcione correctamente.
 */
import app from '../src/app.js';
export default app;
