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
    
    const itemsHtml = items.map(item => {
        let imageSrc = item.coverUrl || 'https://placehold.co/50x75/png?text=Sin+Foto';

        // --- SOLUCIÓN MAESTRA PARA CLOUDINARY ---
        // Inyectamos parámetros de transformación en la URL.
        // Esto obliga a Cloudinary a generar una imagen nueva, pequeña y en JPG puro.
        if (imageSrc.includes('cloudinary.com') && imageSrc.includes('/upload/')) {
            // Buscamos '/upload/' y le añadimos las instrucciones justo después:
            // w_100: Ancho 100px (carga instantánea)
            // f_jpg: Forzar formato JPG (Vital para Outlook/Gmail)
            // c_pad: Ajustar sin cortar
            // b_white: Fondo blanco si la imagen no llena el espacio
            imageSrc = imageSrc.replace('/upload/', '/upload/w_100,f_jpg,c_pad,b_white/');
        }

        return `
        <tr>
            <td width="60" style="padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: top;">
                <img src="${imageSrc}" 
                        alt="${item.title}" 
                        width="50" 
                        height="75"
                        border="0"
                        style="display: block; width: 50px; height: 75px; object-fit: cover; border-radius: 4px;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: middle;">
                <p style="margin: 0; font-family: sans-serif; font-weight: bold; color: #333; font-size: 14px; line-height: 1.4;">
                    ${item.title}
                </p>
                <p style="margin: 4px 0 0; font-family: sans-serif; color: #888; font-size: 12px;">
                    Cantidad: ${item.quantity}
                </p>
            </td>
            <td width="80" style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: middle; color: #333; font-family: sans-serif; font-weight: bold;">
                ${formatCurrency(item.price)}
            </td>
        </tr>
        `;
    }).join('');

    // ... (El resto del código con 'const content = ...' sigue igual)
    const content = `
        <h1 style="${styles.h1}">Pedido Confirmado ✅</h1>
        <p style="${styles.text}">¡Gracias por tu compra! Tu pedido <strong>#${orderId}</strong> ha sido recibido correctamente.</p>
        
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