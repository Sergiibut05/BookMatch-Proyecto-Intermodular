import { getFirebaseAdmin } from '../../utils/firebaseAdmin.js';
import { syncUserFromFirebase, findUserByFirebaseUid } from '../users/users.service.js';
// 1. Importamos el servicio de correo y la plantilla
import { mailService } from '../../services/mail.service.js'; 
import { generateWelcomeEmail } from '../../utils/email-templates.js';

import { generatePasswordResetEmail } from '../../utils/email-templates.js'; // Asegúrate de importar esto

export async function authenticateWithFirebase(idToken: string) {
  const admin = getFirebaseAdmin();
  const decoded = await admin.auth().verifyIdToken(idToken);
  const firebaseUser = await admin.auth().getUser(decoded.uid);
  
  // Buscamos si ya existía ANTES de sincronizar
  const existing = await findUserByFirebaseUid(firebaseUser.uid);
  
  // Sincronizamos (crea o actualiza)
  const user = await syncUserFromFirebase(firebaseUser);

  const isNew = !existing;

  // 2. LÓGICA DE CORREO DE BIENVENIDA
  // Solo si es nuevo y tiene email, enviamos el correo
  if (isNew && user.email) {
    // Usamos un bloque try-catch independiente (Fire & Forget)
    // Para que si falla el correo, NO falle el login del usuario.
    (async () => {
      try {
        console.log(`📧 Enviando bienvenida a: ${user.email}`);
        const html = generateWelcomeEmail(user.fullName || 'Lector');
        
        await mailService.sendEmail({
          to: user.email!,
          subject: '¡Bienvenido a BookMatch! 📚',
          html: html
        });
      } catch (error) {
        console.error('❌ Error enviando email de bienvenida:', error);
      }
    })();
  }

  return { user, isNew };
}
export async function sendPasswordReset(email: string) {
  const admin = getFirebaseAdmin();
  
  try {
    // 1. Pedimos a Firebase que nos genere el link secreto
    // (Esto NO envía el correo, solo nos da la URL: https://firebaseapp/__/auth/action?...)
    const link = await admin.auth().generatePasswordResetLink(email);

    // 2. Generamos nuestro HTML bonito con ese link
    const html = generatePasswordResetEmail(link);

    // 3. Enviamos el correo nosotros mismos
    await mailService.sendEmail({
      to: email,
      subject: '🔐 Recupera tu contraseña - BookMatch',
      html: html
    });

    return { message: 'Correo de recuperación enviado' };

  } catch (error) {
    console.error('Error generando reset link:', error);
    // Es buena práctica no decir si el email existe o no por seguridad, 
    // pero para desarrollo puedes devolver el error.
    throw new Error('No se pudo enviar el correo de recuperación');
  }
}