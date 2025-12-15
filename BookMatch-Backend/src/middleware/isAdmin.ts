import type { Request, Response, NextFunction } from 'express';

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
    // 1. Recuperamos al usuario (que el middleware 'auth' ya debería haber inyectado)
        const user = (req as any).user;

    // Si por lo que sea no hay usuario, es un error de autenticación (401)
        if (!user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

    // 2. VERIFICACIÓN CLAVE: ¿Es ADMIN?
    // Si su rol no es 'ADMIN', le denegamos el paso (403 Forbidden)
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de administrador' });
        }

    // 3. Si llega aquí, es Admin. ¡Adelante!
        next();
    } catch (error) {
        console.error('Error en middleware isAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};