import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        });
    }

    async sendEmail(options: MailOptions): Promise<boolean> {
        try {
        const info = await this.transporter.sendMail({
            from: `"BookMatch" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        console.log(`📧 ID del mensaje: ${info.messageId}`);
        return true;
        } catch (error) {
        console.error('❌ Error en MailService:', error);
        return false;
        }
    }

    async verifyConnection(): Promise<void> {
        try {
        await this.transporter.verify();
        console.log('✅ SMTP Conectado correctamente');
        } catch (error) {
        console.error('❌ Fallo en conexión SMTP:', error);
        throw error;
        }
    }
}

// --- ESTA LÍNEA ES LA MÁS IMPORTANTE ---
// Exportamos una instancia ya creada para usarla directamente
export const mailService = new MailService();