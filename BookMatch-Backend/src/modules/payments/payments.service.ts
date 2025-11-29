import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { findCatalogBookById } from '../catalog-books/catalog-books.service.js';
import type { CreateCheckoutSessionInput, CreateCheckoutSessionCartInput } from './payments.schema.js';
import { mailService } from '../../services/mail.service.js';
import { generateOrderConfirmationEmail } from '../../utils/email-templates.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  userId: number
) {
  const book = await findCatalogBookById(input.bookId);
  if (!book) throw new Error('Libro no encontrado');
  if (book.stock < input.quantity) throw new Error(`Stock insuficiente.`);

  if (book.stock < input.quantity) {
    throw new Error(`Stock insuficiente. Disponible: ${book.stock}, Solicitado: ${input.quantity}`);
  }

  const bookImage = book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null);
  const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price ? book.price.toNumber() : Number(book.price);

  const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
    ? book.price.toNumber()
    : Number(book.price);

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
            images: bookImage ? [bookImage] : undefined,
          },
          unit_amount: Math.round(priceNumber * 100),
        },
        quantity: input.quantity,
    }],
    mode: 'payment',
    shipping_address_collection: { allowed_countries: ['ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'US'] },
    success_url: `${env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/book-details/${book.id}`,
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

    const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
      ? book.price.toNumber()
      : Number(book.price);

    if (isNaN(priceNumber) || priceNumber <= 0) {
      throw new Error(`Precio inválido para el libro "${book.title}"`);
    }

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: book.title, images: bookImage ? [bookImage] : undefined },
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
    shipping_address_collection: { allowed_countries: ['ES', 'FR', 'PT', 'IT', 'DE'] },
    success_url: `${env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/home`,
    metadata: { userId: userId.toString(), bookIds: JSON.stringify(bookIds), items: JSON.stringify(input.items), type: 'cart' },
  });

  return { sessionId: session.id, url: session.url };
}

export async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      console.warn(`Pago no completado para sesión ${session.id}`);
      return;
    }

    const metadata = session.metadata;
    if (!metadata) throw new Error('Metadata no encontrada');

    const userId = parseInt(metadata.userId, 10);
    const type = metadata.type || 'single';

    // Obtener dirección común
    let shippingAddress: string | null = null;
    if (session.shipping_details?.address) {
        const addr = session.shipping_details.address;
        shippingAddress = [
          addr.line1, addr.line2, addr.city, addr.postal_code, addr.state, addr.country
        ].filter(Boolean).join(', ');
    }

    if (type === 'single') {
      const bookId = parseInt(metadata.bookId, 10);
      const quantity = parseInt(metadata.quantity, 10);
      const book = await findCatalogBookById(bookId);
      if (!book) throw new Error(`Libro no encontrado`);

      const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
        ? book.price.toNumber()
        : Number(book.price);
      const totalAmount = priceNumber * quantity;

      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: priceNumber * quantity,
          status: 'PAID',
          paymentIntentId: session.payment_intent as string,
          shippingAddress,
          items: { create: { catalogBookId: bookId, quantity, price: book.price } },
        },
        include: { items: { include: { catalogBook: true } } },
      });

      await prisma.catalogBook.update({
        where: { id: bookId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      // EMAIL SINGLE
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          const emailItems = [{
            title: book.title,
            quantity: quantity,
            price: priceNumber * quantity,
            coverUrl: book.coverUrl, // <--- AÑADIDO: Foto
          }];

          const emailHtml = generateOrderConfirmationEmail(
            order.id.toString(),
            totalAmount,
            emailItems
          );

          await mailService.sendEmail({
            to: user.email,
            subject: `Confirmación de pedido #${order.id} - BookMatch`,
            html: emailHtml,
          });

          console.log(`✅ Correo enviado a ${user.email} para pedido #${order.id}`);
        }
      } catch (emailError) {
        console.error('❌ Error enviando correo:', emailError);
      }

      return order;

    } else if (type === 'cart') {
      const bookIds = JSON.parse(metadata.bookIds) as number[];
      const items = JSON.parse(metadata.items) as Array<{ bookId: number; quantity: number }>;

      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const book = await findCatalogBookById(item.bookId);
        if (!book) {
          throw new Error(`Libro con ID ${item.bookId} no encontrado`);
        }

        const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
          ? book.price.toNumber()
          : Number(book.price);
        const itemTotal = priceNumber * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          catalogBookId: item.bookId,
          quantity: item.quantity,
          price: book.price,
        });

        await prisma.catalogBook.update({
          where: { id: item.bookId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PAID',
          paymentIntentId: session.payment_intent as string,
          shippingAddress,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              catalogBook: true, // <--- Importante para la foto
            },
          },
        },
        include: { items: { include: { catalogBook: true } } }, // <--- VITAL: Incluir libro
      });

      // EMAIL CART
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          // AQUI ESTABA EL ERROR: Ahora accedemos a catalogBook gracias al include de arriba
          const emailItems = order.items.map(item => ({
            title: item.catalogBook.title,
            quantity: item.quantity,
            price: (typeof item.price === 'object' && 'toNumber' in item.price
              ? item.price.toNumber()
              : Number(item.price)) * item.quantity,
            coverUrl: item.catalogBook.coverUrl // <--- AÑADIDO: Foto
          }));

          const emailHtml = generateOrderConfirmationEmail(
            order.id.toString(),
            totalAmount,
            emailItems
          );

          await mailService.sendEmail({
            to: user.email,
            subject: `Confirmación de pedido #${order.id} - BookMatch`,
            html: emailHtml,
          });

          console.log(`✅ Correo enviado a ${user.email} para pedido #${order.id}`);
        }
      } catch (emailError) {
        console.error('❌ Error enviando correo:', emailError);
      }

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

  // 2. Recuperar sesión de Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error(`Pago no completado. Status: ${session.payment_status}`);
  }

  const metadata = session.metadata;
  if (!metadata || metadata.type !== 'single') throw new Error('Solo soportado single en fallback');

  const bookId = parseInt(metadata.bookId, 10);
  const quantity = parseInt(metadata.quantity, 10);
  const book = await findCatalogBookById(bookId);
  if (!book) throw new Error('Libro no encontrado');

  // 3. Obtener dirección
  let shippingAddress: string | null = null;
  if (session.shipping_details?.address) {
    const addr = session.shipping_details.address;
    shippingAddress = [
      addr.line1, addr.line2, addr.city, addr.postal_code, addr.state, addr.country
    ].filter(Boolean).join(', ');
  }

  // --- CASO A: COMPRA INDIVIDUAL ---
  if (type === 'single') {
    const bookId = parseInt(metadata.bookId, 10);
    const quantity = parseInt(metadata.quantity, 10);

    const book = await findCatalogBookById(bookId);
    if (!book) throw new Error(`Libro con ID ${bookId} no encontrado`);

    const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
      ? book.price.toNumber()
      : Number(book.price);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: priceNumber * quantity,
        status: 'PAID',
        paymentIntentId: session.payment_intent as string || session.id,
        shippingAddress,
        items: {
          create: { catalogBookId: bookId, quantity, price: book.price },
        },
      },
      include: { items: { include: { catalogBook: true } } },
    });

    await prisma.catalogBook.update({
      where: { id: bookId },
      data: { stock: { decrement: quantity } },
    });

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

  // --- CASO B: CARRITO (SOLUCIÓN DEL ERROR "NO SOPORTADO") ---
  } else if (type === 'cart') {
    const items = JSON.parse(metadata.items) as Array<{ bookId: number; quantity: number }>;
    
    let totalAmount = 0;
    const orderItems = [];

    // Calcular totales y preparar items
    for (const item of items) {
      const book = await findCatalogBookById(item.bookId);
      if (!book) continue;

      const price = typeof book.price === 'object' && 'toNumber' in book.price 
        ? book.price.toNumber() 
        : Number(book.price);
      
      totalAmount += price * item.quantity;

      orderItems.push({
        catalogBookId: item.bookId,
        quantity: item.quantity,
        price: book.price,
      });

      // Actualizar stock
      await prisma.catalogBook.update({
        where: { id: item.bookId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Crear orden completa
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PAID',
        paymentIntentId: session.payment_intent as string || session.id,
        shippingAddress,
        items: { create: orderItems },
      },
      include: { items: { include: { catalogBook: true } } },
    });

    // Email Carrito Fallback
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user?.email) {
        const emailItems = order.items.map(item => ({
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
        
        console.log(`✅ Correo fallback enviado a ${user.email}`);
      }
    } catch (e) { console.error('Error email fallback cart:', e); }

    return order;
  } else {
    throw new Error('Tipo de compra desconocido');
  }
}