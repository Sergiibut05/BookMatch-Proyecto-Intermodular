// src/utils/email-templates.ts

// --- 1. UTILIDADES Y ESTILOS COMUNES ---

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

const styles = {
    container: 'max-width: 600px; margin: 0 auto; font-family: sans-serif; color: #333;',
    header: 'text-align: center; padding: 20px 0;',
    logoHeader: 'text-allign:center; padding: 20px 0;',
    card: 'background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #eee;',
    body: 'padding: 30px;',
    footer: 'text-align: center; font-size: 12px; color: #999; margin-top: 20px;',
    button: 'display: inline-block; background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;',
    h1: 'color: #333; margin-top: 0; font-size: 22px;',
    text: 'line-height: 1.6; color: #555;',
    itemRow: 'border-bottom: 1px solid #eee; padding: 10px 0;',
    totalRow: 'font-weight: bold; font-size: 18px; color: #4A90E2; text-align: right; padding-top: 15px;'
};

/**
 * Plantilla Base: Envuelve el contenido en la estructura visual de BookMatch
 */
const baseEmailLayout = (contentHtml: string): string => `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; background-color: #f4f4f7;">
        <div style="${styles.container}">
        
        <div style="${styles.header}">
            <a href="https://bookmatch-app.com" target="_blank">
            <img src="https://collection.cloudinary.com/dicxwevnm/c7b9750b73bf01decec9ab24314607d4" 
                alt="BookMatch Logo" 
                style="width: 150px; height: auto; border: 0;">
            </a>
        </div>

        <div style="${styles.card}">
            <div style="${styles.body}">
            ${contentHtml}
            </div>
        </div>

        <div style="${styles.footer}">
            <p>© ${new Date().getFullYear()} BookMatch. Todos los derechos reservados.</p>
            <p>¿No solicitaste este correo? Puedes ignorarlo tranquilamente.</p>
        </div>

        </div>
    </body>
    </html>
    `;

    // --- 2. PLANTILLAS ESPECÍFICAS ---

    export const generateWelcomeEmail = (name: string): string => {
    const content = `
        <h1 style="${styles.h1}">¡Bienvenido, ${name}! 👋</h1>
        <p style="${styles.text}">Gracias por unirte a la comunidad de BookMatch. Estamos emocionados de tenerte con nosotros en esta aventura literaria.</p>
        <p style="${styles.text}">Miles de libros te esperan. ¿Estás listo para encontrar tu próxima lectura favorita o darle una segunda vida a los libros de tu estantería?</p>
        <div style="text-align: center;">
        <a href="https://bookmatch-app.com/catalog" style="${styles.button}">Explorar Catálogo</a>
        </div>
    `;
    return baseEmailLayout(content);
    };

    export const generatePasswordResetEmail = (resetLink: string): string => {
    const content = `
        <h1 style="${styles.h1}">Restablecer Contraseña 🔒</h1>
        <p style="${styles.text}">Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en BookMatch.</p>
        <p style="${styles.text}">Si has sido tú, pulsa el botón de abajo para crear una nueva:</p>
        <div style="text-align: center;">
        <a href="${resetLink}" style="${styles.button}">Cambiar mi Contraseña</a>
        </div>
        <p style="${styles.text}; font-size: 12px; margin-top: 20px;">Este enlace caducará en 1 hora por seguridad.</p>
    `;
    return baseEmailLayout(content);
};

// He adaptado tu función simple para que use la estructura bonita
// (Aunque recuerda que tienes la versión "Super Pro" con fotos que hicimos antes si prefieres usar esa)
export const generateOrderConfirmationEmail = (
    orderId: string, 
    total: number, // Cambiado a number para formatear bien
    items: Array<{ title: string; quantity: number; price: number }>
    ): string => {
    
    const itemsHtml = items.map(item => `
        <div style="${styles.itemRow}">
        <div style="float: left;">${item.title} <span style="color: #999; font-size: 0.9em;">(x${item.quantity})</span></div>
        <div style="float: right;">${formatCurrency(item.price)}</div>
        <div style="clear: both;"></div>
        </div>
    `).join('');

    const content = `
        <h1 style="${styles.h1}">Pedido Confirmado ✅</h1>
        <p style="${styles.text}">¡Gracias por tu compra! Tu pedido <strong>#${orderId}</strong> ha sido recibido y lo estamos preparando con cuidado.</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Resumen del pedido</h3>
        
        <div style="margin-bottom: 20px;">
        ${itemsHtml}
        </div>

        <div style="${styles.totalRow}">
        Total: ${formatCurrency(total)}
        </div>

        <p style="${styles.text}; margin-top: 30px;">Te avisaremos en cuanto tus libros salgan del almacén.</p>
    `;
    return baseEmailLayout(content);
};