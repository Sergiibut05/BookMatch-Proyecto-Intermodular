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
};

