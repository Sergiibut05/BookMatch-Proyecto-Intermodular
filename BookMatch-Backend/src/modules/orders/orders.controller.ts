import type { Request, Response } from 'express';
import { createOrder, getUserOrders } from './orders.service.js';

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

export const getOrderHistoryCtrl = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
        }

        const orders = await getUserOrders(userId);

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error al recuperar el historial' });
    }
};