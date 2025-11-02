import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Inicializar Firebase Admin (solo una vez)
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Middleware para verificar el token de Firebase
 * Extrae el token del header Authorization y lo verifica
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extraer el token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Debes incluir un token en el header Authorization: Bearer <token>'
      });
    }

    // Extraer el token (quitar "Bearer ")
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid token format'
      });
    }

    // Verificar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Añadir la información del usuario al request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      // ... más campos si los necesitas
    };

    // Continuar al siguiente middleware/controlador
    next();
  } catch (error: any) {
    console.error('Error verificando token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      message: 'El token proporcionado no es válido'
    });
  }
};

// Extender el tipo Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        emailVerified?: boolean;
      };
    }
  }
}