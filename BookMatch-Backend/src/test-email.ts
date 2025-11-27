// Como ambos archivos están en 'src', la ruta es './services/...'
import { mailService } from './services/mail.service';

async function main() {
    console.log('🚀 Iniciando script de prueba...');

    try {
        // 1. Probamos conexión
        await mailService.verifyConnection();

        // 2. Enviamos correo
        console.log('📨 Intentando enviar...');
        const resultado = await mailService.sendEmail({
        to: 'bookmatch3@gmail.com', // <--- ¡PON TU EMAIL AQUÍ!
        subject: 'Prueba Definitiva BookMatch',
        html: '<h1>¡Funciona!</h1><p>Si lees esto, el código está perfecto.</p>'
        });

        if (resultado) {
        console.log('✅ ¡EXITO TOTAL! Revisa tu correo.');
        } else {
        console.log('⚠️ El envío falló (revisa logs arriba).');
        }

    } catch (error) {
        console.error('💥 Error crítico ejecutando el script:', error);
    }
}

main();