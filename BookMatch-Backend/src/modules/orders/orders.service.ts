import { PrismaClient } from '@prisma/client';
import { mailService } from '../../services/mail.service.js';
import { generateOrderConfirmationEmail } from '../../utils/email-templates.js';

const prisma = new PrismaClient();

interface CreateOrderDto {
    userId: number;
    totalAmount: number;
    shippingAddress: string;
    items: Array<{
        catalogBookId: number;
        quantity: number;
        price: number;
    }>;
}

export const createOrder = async (data: CreateOrderDto) => {
    const newOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
        data: {
            userId: data.userId,
            totalAmount: data.totalAmount,
            shippingAddress: data.shippingAddress,
            status: 'PAID',
            items: {
            create: data.items.map((item) => ({
                catalogBookId: item.catalogBookId,
                quantity: item.quantity,
                price: item.price,
            })),
            },
        },
        include: {
            user: true,
            items: {
            include: {
                catalogBook: true,
            },
            },
        },
        });

        return order;
    });

    if (newOrder.user.email) {
        const itemsForEmail = newOrder.items.map((item) => ({
        title: item.catalogBook.title,
        quantity: item.quantity,
        price: Number(item.price),
        coverUrl: item.catalogBook.coverUrl,
        }));

        const htmlContent = generateOrderConfirmationEmail(
        newOrder.id.toString(),
        Number(newOrder.totalAmount),
        itemsForEmail
        );

        mailService.sendEmail({
        to: newOrder.user.email,
        subject: `✅ Pedido #${newOrder.id} confirmado - BookMatch`,
        html: htmlContent,
        }).catch(err => console.error('Error enviando email de pedido:', err));
    }

    return newOrder;
};