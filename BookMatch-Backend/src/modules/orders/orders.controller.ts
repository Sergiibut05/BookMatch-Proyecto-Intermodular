import { Request, Response } from 'express';
import { createOrder } from './orders.service.js';

export const createOrderController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user_id; 

        const { items, totalAmount, shippingAddress } = req.body;

        if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El carrito no puede estar vacío' });
        }

        const order = await createOrder({
        userId,
        items,
        totalAmount,
        shippingAddress,
        });

        res.status(201).json({
        message: 'Pedido creado correctamente',
        orderId: order.id,
        });

    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ error: 'Error interno al procesar el pedido' });
    }
};