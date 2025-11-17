import admin from 'firebase-admin';
import { env } from '../config/env.js';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (!firebaseApp) {
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  return admin;
}

