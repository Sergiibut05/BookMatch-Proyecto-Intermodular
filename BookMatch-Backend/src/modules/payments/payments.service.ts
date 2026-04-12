import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { findCatalogBookById } from '../catalog-books/catalog-books.service.js';
import type { CreateCheckoutSessionInput, CreateCheckoutSessionCartInput } from './payments.schema.js';
import { mailService } from '../../services/mail.service.js';
import { generateOrderConfirmationEmail } from '../../utils/email-templates.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

/**
 * Crea una sesión de checkout de Stripe para un solo libro
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  userId: number
) {
  const book = await findCatalogBookById(input.bookId);
  if (!book) throw new Error('Libro no encontrado');

  if (book.stock < input.quantity) {
    throw new Error(`Stock insuficiente. Disponible: ${book.stock}, Solicitado: ${input.quantity}`);
  }

  const bookImage = book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null);

  const priceValue = book.price as unknown;
  const priceNumber = typeof priceValue === 'object' && priceValue !== null && 'toNumber' in priceValue
    ? (priceValue as { toNumber: () => number }).toNumber()
    : Number(priceValue);

  if (isNaN(priceNumber) || priceNumber <= 0) {
    throw new Error('Precio del libro inválido');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'link', 'paypal'],
    line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: book.title,
            description: `${book.author}`,
            ...(bookImage ? { images: [bookImage] } : {}),
          },
          unit_amount: Math.round(priceNumber * 100),
        },
        quantity: input.quantity,
    }],
    mode: 'payment',
    shipping_address_collection: { allowed_countries: ['ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE'] },
    success_url:
      input.successUrl || `${env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelUrl || `${env.FRONTEND_URL}/book-details/${book.id}`,
    metadata: {
      userId: userId.toString(),
      bookId: book.id.toString(),
      quantity: input.quantity.toString(),
      type: 'single',
    },
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Crea una sesión de checkout de Stripe para múltiples libros (carrito)
 */
export async function createCheckoutSessionCart(
  input: CreateCheckoutSessionCartInput,
  userId: number
) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const bookIds: number[] = [];

  for (const item of input.items) {
    const book = await findCatalogBookById(item.bookId);
    if (!book) {
      throw new Error(`Libro con ID ${item.bookId} no encontrado`);
    }

    if (book.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${book.title}". Disponible: ${book.stock}, Solicitado: ${item.quantity}`
      );
    }

    const bookImage = book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null);

    const priceValue = book.price as unknown;
    const priceNumber = typeof priceValue === 'object' && priceValue !== null && 'toNumber' in priceValue
      ? (priceValue as { toNumber: () => number }).toNumber()
      : Number(priceValue);

    if (isNaN(priceNumber) || priceNumber <= 0) {
      throw new Error(`Precio inválido para el libro "${book.title}"`);
    }

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: book.title,
          ...(bookImage ? { images: [bookImage] } : {}),
        },
        unit_amount: Math.round(priceNumber * 100),
      },
      quantity: item.quantity,
    });
    bookIds.push(book.id);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'link', 'paypal'],
    line_items: lineItems,
    mode: 'payment',
    shipping_address_collection: { allowed_countries: ['ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE'] },
    success_url: input.successUrl || `${env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelUrl || `${env.FRONTEND_URL}/home`,
    metadata: { userId: userId.toString(), bookIds: JSON.stringify(bookIds), items: JSON.stringify(input.items), type: 'cart' },
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Maneja el webhook de Stripe
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      console.warn(`Pago no completado para sesión ${session.id}`);
      return;
    }

    const metadata = session.metadata;
    if (!metadata) throw new Error('Metadata no encontrada');

    const userIdStr = metadata.userId;
    if (!userIdStr) throw new Error('userId no encontrado en metadata');
    const userId = parseInt(userIdStr, 10);
    const type = metadata.type || 'single';

    // Obtener dirección común
    let shippingAddress: string | null = null;
    const sessionWithShipping = session as Stripe.Checkout.Session & { shipping?: { address?: Stripe.Address } };
    if (sessionWithShipping.shipping?.address) {
        const addr = sessionWithShipping.shipping.address;
        shippingAddress = [
          addr.line1, addr.line2, addr.city, addr.postal_code, addr.state, addr.country
        ].filter(Boolean).join(', ');
    }

    if (type === 'single') {
      const bookIdStr = metadata.bookId;
      const quantityStr = metadata.quantity;
      if (!bookIdStr || !quantityStr) throw new Error('bookId o quantity no encontrados en metadata');
      const bookId = parseInt(bookIdStr, 10);
      const quantity = parseInt(quantityStr, 10);

      const book = await findCatalogBookById(bookId);
      if (!book) throw new Error(`Libro no encontrado`);

      const priceValue = book.price as unknown;
      const priceNumber = typeof priceValue === 'object' && priceValue !== null && 'toNumber' in priceValue
        ? (priceValue as { toNumber: () => number }).toNumber()
        : Number(priceValue);
      
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: priceNumber * quantity,
          status: 'PAID',
          paymentIntentId: (session.payment_intent && typeof session.payment_intent === 'string' ? session.payment_intent : session.id),
          shippingAddress,
          items: { create: { catalogBookId: bookId, quantity, price: book.price } },
        },
        include: { items: { include: { catalogBook: true } } },
      });

      await prisma.catalogBook.update({
        where: { id: bookId },
        data: { stock: { decrement: quantity } },
      });

      // EMAIL SINGLE
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          const emailItems = [{
            title: book.title,
            quantity: quantity,
            price: priceNumber * quantity,
            coverUrl: book.coverUrl,
          }];
          const emailHtml = generateOrderConfirmationEmail(order.id.toString(), Number(order.totalAmount), emailItems);
          await mailService.sendEmail({ to: user.email, subject: `Pedido #${order.id} confirmado`, html: emailHtml });
        }
      } catch (e) { console.error('Error email webhook single:', e); }

      return order;

    } else if (type === 'cart') {
      const itemsStr = metadata.items;
      if (!itemsStr) throw new Error('items no encontrados en metadata');
      const items = JSON.parse(itemsStr) as Array<{ bookId: number; quantity: number }>;
      const orderItems = [];

      for (const item of items) {
        const book = await findCatalogBookById(item.bookId);
        if (!book) continue;
        orderItems.push({ catalogBookId: item.bookId, quantity: item.quantity, price: book.price });
        await prisma.catalogBook.update({ where: { id: item.bookId }, data: { stock: { decrement: item.quantity } } });
      }

      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: session.amount_total ? session.amount_total / 100 : 0,
          status: 'PAID',
          paymentIntentId: (session.payment_intent && typeof session.payment_intent === 'string' ? session.payment_intent : session.id),
          shippingAddress,
          items: { create: orderItems },
        },
        include: { items: { include: { catalogBook: true } } },
      });

      // EMAIL CART
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          const emailItems = order.items.map((item: any) => {
            const priceValue = item.price as unknown;
            const priceNumber = typeof priceValue === 'object' && priceValue !== null && 'toNumber' in priceValue
              ? (priceValue as { toNumber: () => number }).toNumber()
              : Number(priceValue);
            return {
              title: item.catalogBook.title,
              quantity: item.quantity,
              price: priceNumber * item.quantity,
              coverUrl: item.catalogBook.coverUrl
            };
          });
          const emailHtml = generateOrderConfirmationEmail(order.id.toString(), Number(order.totalAmount), emailItems);
          await mailService.sendEmail({ to: user.email, subject: `Pedido #${order.id} confirmado`, html: emailHtml });
        }
      } catch (e) { console.error('Error email webhook cart:', e); }

      return order;
    }
  }
}

export async function getCheckoutSession(sessionId: string) {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

export async function createOrderFromSession(sessionId: string, userId: number) {
  // 1. Verificar si ya existe
  const existingOrder = await prisma.order.findFirst({
    where: { paymentIntentId: sessionId },
  });

  if (existingOrder) {
    console.log(`Order ya existe para sesión ${sessionId}`);
    return existingOrder;
  }

  // 2. Recuperar sesión
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error(`Pago no completado. Status: ${session.payment_status}`);
  }

  const metadata = session.metadata;
  if (!metadata) throw new Error('Metadata no encontrada');

  const type = metadata.type || 'single';

  let shippingAddress: string | null = null;
  const sessionWithShipping = session as Stripe.Checkout.Session & { shipping?: { address?: Stripe.Address } };
  if (sessionWithShipping.shipping?.address) {
      const addr = sessionWithShipping.shipping.address;
      shippingAddress = [addr.line1, addr.line2, addr.city, addr.postal_code, addr.state, addr.country].filter(Boolean).join(', ');
  }

  // --- CASO A: FALLBACK SINGLE ---
  if (type === 'single') {
    const bookIdStr = metadata.bookId;
    const quantityStr = metadata.quantity;
    if (!bookIdStr || !quantityStr) throw new Error('bookId o quantity no encontrados en metadata');
    const bookId = parseInt(bookIdStr, 10);
    const quantity = parseInt(quantityStr, 10);

    const book = await findCatalogBookById(bookId);
    if (!book) throw new Error('Libro no encontrado');

    const priceValue = book.price as unknown;
    const priceNumber = typeof priceValue === 'object' && priceValue !== null && 'toNumber' in priceValue
      ? (priceValue as { toNumber: () => number }).toNumber()
      : Number(priceValue);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: priceNumber * quantity,
        status: 'PAID',
        paymentIntentId: (session.payment_intent && typeof session.payment_intent === 'string' ? session.payment_intent : session.id),
        shippingAddress,
        items: { create: { catalogBookId: bookId, quantity, price: book.price } },
      },
      include: { items: { include: { catalogBook: true } } },
    });

    await prisma.catalogBook.update({ where: { id: bookId }, data: { stock: { decrement: quantity } } });

    // Email Single Fallback
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user?.email) {
        const emailItems = [{
          title: book.title,
          quantity: quantity,
          price: priceNumber * quantity,
          coverUrl: book.coverUrl,
        }];
        const emailHtml = generateOrderConfirmationEmail(order.id.toString(), Number(order.totalAmount), emailItems);
        await mailService.sendEmail({ to: user.email, subject: `Pedido #${order.id} confirmado`, html: emailHtml });
      }
    } catch (e) { console.error('Error email fallback single:', e); }

    return order;

  // --- CASO B: FALLBACK CART ---
  } else if (type === 'cart') {
    const itemsStr = metadata.items;
    if (!itemsStr) throw new Error('items no encontrados en metadata');
    const items = JSON.parse(itemsStr) as Array<{ bookId: number; quantity: number }>;
    const orderItems = [];

    for (const item of items) {
      const book = await findCatalogBookById(item.bookId);
      if (!book) continue;
      orderItems.push({ catalogBookId: item.bookId, quantity: item.quantity, price: book.price });
      await prisma.catalogBook.update({ where: { id: item.bookId }, data: { stock: { decrement: item.quantity } } });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
        status: 'PAID',
        paymentIntentId: (session.payment_intent && typeof session.payment_intent === 'string' ? session.payment_intent : session.id),
        shippingAddress,
        items: { create: orderItems },
      },
      include: { items: { include: { catalogBook: true } } },
    });

    // Email Carrito Fallback
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user?.email) {
        const emailItems = order.items.map((item: any) => ({
          title: item.catalogBook.title,
          quantity: item.quantity,
          price: (typeof item.price === 'object' && 'toNumber' in item.price 
            ? item.price.toNumber() 
            : Number(item.price)) * item.quantity,
          coverUrl: item.catalogBook.coverUrl
        }));

        const emailHtml = generateOrderConfirmationEmail(
          order.id.toString(), 
          Number(order.totalAmount), 
          emailItems
        );
        
        await mailService.sendEmail({ 
          to: user.email, 
          subject: `Pedido #${order.id} confirmado`, 
          html: emailHtml 
        });
      }
    } catch (e) { console.error('Error email fallback cart:', e); }

    return order;
  } else {
    throw new Error('Tipo de compra desconocido');
  }
}