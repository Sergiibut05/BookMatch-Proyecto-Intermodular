import type { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../utils/firebaseAdmin.js';
import { syncUserFromFirebase } from '../modules/users/users.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        uid: string;
        email: string;
        role?: string;
      };
    }
  }
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const token = header.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);
    const firebaseUser = await admin.auth().getUser(decoded.uid);
    const user = await syncUserFromFirebase(firebaseUser);

    req.user = {
      id: user.id,
      uid: user.firebaseUid,
      email: user.email,
      role: user.role || 'USER',
    };

    next();
  } catch (error: any) {
    if (error?.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expirado' });
    }

    return res.status(401).json({ message: 'Token inválido' });
  }
}

import bcrypt from 'bcryptjs';

// Para guardar una contraseña
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Para comparar en el login
const isMatch = await bcrypt.compare(password, user.password);