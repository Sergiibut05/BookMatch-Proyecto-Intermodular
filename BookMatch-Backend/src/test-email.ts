import { mailService } from './services/mail.service';
import { 
  generateWelcomeEmail, 
  generatePasswordResetEmail, 
  generateOrderConfirmationEmail 
} from './utils/email-templates';

async function main() {
  console.log('🚀 Iniciando TEST INTEGRAL de Plantillas...');
  
  // 1. Verificamos conexión primero
  try {
    await mailService.verifyConnection();
    console.log('✅ SMTP Conectado.');
  } catch (error) {
    console.error('❌ Error de conexión SMTP. Revisa tu .env');
    return;
  }

  const miCorreo = 'bookmatch3@gmail.com'; // <--- ¡PON TU EMAIL AQUÍ!

  // ---------------------------------------------------------
  // ESCENARIO 1: Email de Bienvenida
  // ---------------------------------------------------------
  console.log('\n📨 1. Enviando Email de Bienvenida...');
  const htmlWelcome = generateWelcomeEmail('Sergio');
  
  await mailService.sendEmail({
    to: miCorreo,
    subject: '👋 ¡Bienvenido a BookMatch! (Test Visual)',
    html: htmlWelcome
  });


  // ---------------------------------------------------------
  // ESCENARIO 2: Reset de Contraseña
  // ---------------------------------------------------------
  console.log('📨 2. Enviando Reset de Contraseña...');
  const htmlReset = generatePasswordResetEmail('https://bookmatch-app.com/reset-password?token=123456');
  
  await mailService.sendEmail({
    to: miCorreo,
    subject: '🔒 Recupera tu contraseña (Test Visual)',
    html: htmlReset
  });


  // ---------------------------------------------------------
  // ESCENARIO 3: Confirmación de Pedido
  // ---------------------------------------------------------
  console.log('📨 3. Enviando Confirmación de Pedido...');
  
  // Datos falsos de un pedido
  const itemsPedido = [
    { title: 'El Nombre del Viento', quantity: 1, price: 24.90 },
    { title: '1984 (Edición Bolsillo)', quantity: 2, price: 9.50 },
    { title: 'Marcapáginas BookMatch', quantity: 1, price: 0.00 }
  ];
  const totalPedido = 43.90;
  const orderId = 'BK-7890';

  const htmlOrder = generateOrderConfirmationEmail(orderId, totalPedido, itemsPedido);

  await mailService.sendEmail({
    to: miCorreo,
    subject: '✅ Tu pedido #BK-7890 está confirmado (Test Visual)',
    html: htmlOrder
  });

  console.log('\n✨ ¡PRUEBA FINALIZADA! Revisa tu bandeja de entrada (3 correos nuevos).');
}

main().catch(console.error);