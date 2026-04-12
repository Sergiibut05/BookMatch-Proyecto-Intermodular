import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/env.js';
import {
  createCheckoutSession,
  createCheckoutSessionCart,
  handleStripeWebhook,
  getCheckoutSession,
  createOrderFromSession,
} from './payments.service.js';
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionCartInput,
} from './payments.schema.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

/**
 * Crea una sesión de checkout para un solo libro
 */
export async function createCheckoutSessionCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const input: CreateCheckoutSessionInput = {
      bookId: req.body.bookId,
      quantity: req.body.quantity ?? 1,
      successUrl: req.body.successUrl,
      cancelUrl: req.body.cancelUrl,
    };

    const result = await createCheckoutSession(input, req.user.id);
    res.json(result);
  } catch (error: any) {
    console.error('Error en createCheckoutSessionCtrl:', error);
    if (error.message === 'Libro no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Precio')) {
      return res.status(400).json({ message: error.message });
    }
    // Log del error completo para debugging
    console.error('Error completo:', error);
    res.status(500).json({ 
      message: error.message || 'Error al crear sesión de pago',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Crea una sesión de checkout para múltiples libros (carrito)
 * Preparado para cuando se implemente el carrito
 */
export async function createCheckoutSessionCartCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const input: CreateCheckoutSessionCartInput = {
      items: req.body.items,
      successUrl: req.body.successUrl,
      cancelUrl: req.body.cancelUrl,
    };

    const result = await createCheckoutSessionCart(input, req.user.id);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Error al crear sesión de pago' });
  }
}

/**
 * Webhook de Stripe para recibir eventos de pago
 * IMPORTANTE: Este endpoint NO debe tener autenticación porque Stripe lo llama directamente
 */
export async function stripeWebhookCtrl(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ message: 'Falta firma de Stripe' });
  }

  let event: Stripe.Event;

  try {
    // Verificar la firma del webhook
    if (env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // En desarrollo, si no hay webhook secret, parsear directamente (no recomendado para producción)
      event = req.body as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Error verificando webhook de Stripe:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ message: error.message || 'Error procesando webhook' });
  }
}

/**
 * Obtiene los detalles de una sesión de checkout
 */
export async function getCheckoutSessionCtrl(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId es requerido' });
    }
    const session = await getCheckoutSession(sessionId);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener sesión' });
  }
}

/**
 * Página de éxito después del pago
 * También crea la Order si no existe (fallback si el webhook no se ejecutó)
 */
export async function paymentSuccessCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { session_id } = req.query;
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ message: 'session_id es requerido' });
    }

    const session = await getCheckoutSession(session_id);

    // Si el pago fue exitoso, intentar crear la Order si no existe
    if (session.payment_status === 'paid') {
      try {
        await createOrderFromSession(session_id, req.user.id);
      } catch (orderError: any) {
        // Si la Order ya existe o hay otro error, solo loguear (no fallar)
        console.log('Info al crear Order desde success:', orderError.message);
      }
    }

    res.json({
      success: true,
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });
  } catch (error: any) {
    console.error('Error en paymentSuccessCtrl:', error);
    res.status(500).json({ message: error.message || 'Error al verificar pago' });
  }
}

