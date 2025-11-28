// src/utils/email-templates.ts

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

const styles = {
    container: 'max-width: 600px; margin: 0 auto; font-family: sans-serif; color: #333;',
    header: 'text-align: center; padding: 20px 0;',
    logoHeader: 'text-align: center; padding: 20px 0;',
    card: 'background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #eee;',
    body: 'padding: 30px;',
    footer: 'text-align: center; font-size: 12px; color: #999; margin-top: 20px;',
    button: 'display: inline-block; background-color: #D99D5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;',
    h1: 'color: #333; margin-top: 0; font-size: 22px;',
    text: 'line-height: 1.6; color: #555;',
    itemRow: 'border-bottom: 1px solid #eee; padding: 10px 0;',
    totalRow: 'font-weight: bold; font-size: 18px; color: #D99D5B; text-align: right; padding-top: 15px;'
};

const baseEmailLayout = (contentHtml: string): string => `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; background-color: #f4f4f7;">
        <div style="${styles.container}">
        
        <div style="${styles.header}">
            <a href="https://bookmatch-app.com" target="_blank">
            <img src="https://res.cloudinary.com/dicxwevnm/image/upload/v1764331988/Logo_BookMatch_l0ajzd.png" 
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

export const generateOrderConfirmationEmail = (
    orderId: string, 
    total: number, 
    items: Array<{ title: string; quantity: number; price: number; coverUrl?: string | null }>
): string => {
    
    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 60px;">
                <img src="${item.coverUrl || 'https://via.placeholder.com/50x75?text=Sin+Foto'}" 
                        alt="${item.title}" 
                        style="width: 50px; height: auto; border-radius: 4px; display: block;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: middle;">
                <div style="font-weight: bold; color: #333; font-size: 14px;">${item.title}</div>
                <div style="color: #999; font-size: 12px;">Cantidad: ${item.quantity}</div>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: middle; color: #333;">
                ${formatCurrency(item.price)}
            </td>
        </tr>
    `).join('');

    const content = `
        <h1 style="${styles.h1}">Pedido Confirmado ✅</h1>
        <p style="${styles.text}">¡Gracias por tu compra! Tu pedido <strong>#${orderId}</strong> ha sido recibido y lo estamos preparando con cuidado.</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; color: #D99D5B;">Resumen del pedido</h3>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
            ${itemsHtml}
        </table>

        <div style="${styles.totalRow}">
            Total: ${formatCurrency(total)}
        </div>

        <p style="${styles.text}; margin-top: 30px;">Te avisaremos en cuanto tus libros salgan del almacén.</p>
    `;
    return baseEmailLayout(content);
};