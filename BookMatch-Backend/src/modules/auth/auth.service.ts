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
  
  const existing = await findUserByFirebaseUid(firebaseUser.uid);
  
  const user = await syncUserFromFirebase(firebaseUser);

  const isNew = !existing;

  if (isNew && user.email) {
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
    const link = await admin.auth().generatePasswordResetLink(email);

    const html = generatePasswordResetEmail(link);

    await mailService.sendEmail({
      to: email,
      subject: '🔐 Recupera tu contraseña - BookMatch',
      html: html
    });

    return { message: 'Correo de recuperación enviado' };

  } catch (error) {
    console.error('Error generando reset link:', error);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
}