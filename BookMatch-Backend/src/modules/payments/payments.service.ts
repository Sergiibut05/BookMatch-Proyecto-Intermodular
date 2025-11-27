import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';
import { findCatalogBookById } from '../catalog-books/catalog-books.service.js';
import type { CreateCheckoutSessionInput, CreateCheckoutSessionCartInput } from './payments.schema.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Crea una sesión de checkout de Stripe para un solo libro
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  userId: number
) {
  // Buscar el libro en la BD
  const book = await findCatalogBookById(input.bookId);
  if (!book) {
    throw new Error('Libro no encontrado');
  }

  // Verificar stock
  if (book.stock < input.quantity) {
    throw new Error(`Stock insuficiente. Disponible: ${book.stock}, Solicitado: ${input.quantity}`);
  }

  // Obtener imagen del libro (coverUrl o primera imagen)
  const bookImage = book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null);

  // Convertir precio de Decimal a número
  const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
    ? book.price.toNumber()
    : Number(book.price);

  // Validar que el precio sea válido
  if (isNaN(priceNumber) || priceNumber <= 0) {
    throw new Error('Precio del libro inválido');
  }

  // Crear sesión de checkout en Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'link', 'paypal'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: book.title,
            description: `${book.author}${book.description ? ` - ${book.description.substring(0, 100)}` : ''}`,
            images: bookImage ? [bookImage] : undefined,
          },
          unit_amount: Math.round(priceNumber * 100), // Convertir a centavos
        },
        quantity: input.quantity,
      },
    ],
    mode: 'payment',
    shipping_address_collection: {
      allowed_countries: ['ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE'],
    },
    success_url: `${env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/book-details/${book.id}`,
    metadata: {
      userId: userId.toString(),
      bookId: book.id.toString(),
      quantity: input.quantity.toString(),
      // Preparado para carrito: si en el futuro se usa, añadir items como JSON
      type: 'single', // 'single' para compra directa, 'cart' para carrito
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Crea una sesión de checkout de Stripe para múltiples libros (carrito)
 * Preparado para cuando se implemente el carrito
 */
export async function createCheckoutSessionCart(
  input: CreateCheckoutSessionCartInput,
  userId: number
) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const bookIds: number[] = [];

  // Procesar cada item del carrito
  for (const item of input.items) {
    const book = await findCatalogBookById(item.bookId);
    if (!book) {
      throw new Error(`Libro con ID ${item.bookId} no encontrado`);
    }

    // Verificar stock
    if (book.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${book.title}". Disponible: ${book.stock}, Solicitado: ${item.quantity}`
      );
    }

    const bookImage = book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null);

    // Convertir precio de Decimal a número
    const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
      ? book.price.toNumber()
      : Number(book.price);

    if (isNaN(priceNumber) || priceNumber <= 0) {
      throw new Error(`Precio inválido para el libro "${book.title}"`);
    }

    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: book.title,
          description: `${book.author}${book.description ? ` - ${book.description.substring(0, 100)}` : ''}`,
          images: bookImage ? [bookImage] : undefined,
        },
        unit_amount: Math.round(priceNumber * 100),
      },
      quantity: item.quantity,
    });

    bookIds.push(book.id);
  }

  // Crear sesión de checkout
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'link', 'paypal'],
    line_items: lineItems,
    mode: 'payment',
    shipping_address_collection: {
      allowed_countries: ['ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE'],
    },
    success_url: `${env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/home`,
    metadata: {
      userId: userId.toString(),
      bookIds: JSON.stringify(bookIds),
      items: JSON.stringify(input.items),
      type: 'cart',
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Maneja el webhook de Stripe cuando se completa un pago
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Verificar que el pago fue exitoso
    if (session.payment_status !== 'paid') {
      console.warn(`Pago no completado para sesión ${session.id}`);
      return;
    }

    const metadata = session.metadata;
    if (!metadata) {
      throw new Error('Metadata no encontrada en la sesión de Stripe');
    }

    const userId = parseInt(metadata.userId, 10);
    const type = metadata.type || 'single';

    if (type === 'single') {
      // Compra directa de un libro
      const bookId = parseInt(metadata.bookId, 10);
      const quantity = parseInt(metadata.quantity, 10);

      // Buscar el libro para obtener el precio actual
      const book = await findCatalogBookById(bookId);
      if (!book) {
        throw new Error(`Libro con ID ${bookId} no encontrado`);
      }

      // Calcular total (convertir Decimal a número)
      const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
        ? book.price.toNumber()
        : Number(book.price);
      const totalAmount = priceNumber * quantity;

      // Obtener dirección de envío de la sesión
      let shippingAddress: string | null = null;
      if (session.shipping_details?.address) {
        const addr = session.shipping_details.address;
        shippingAddress = [
          addr.line1,
          addr.line2,
          addr.city,
          addr.postal_code,
          addr.state,
          addr.country
        ].filter(Boolean).join(', ');
      }

      // Crear la orden en la BD
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PAID',
          paymentIntentId: session.payment_intent as string,
          shippingAddress,
          items: {
            create: {
              catalogBookId: bookId,
              quantity,
              price: book.price,
            },
          },
        },
        include: {
          items: {
            include: {
              catalogBook: true,
            },
          },
        },
      });

      // Actualizar stock del libro
      await prisma.catalogBook.update({
        where: { id: bookId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      return order;
    } else if (type === 'cart') {
      // Compra desde carrito
      const bookIds = JSON.parse(metadata.bookIds) as number[];
      const items = JSON.parse(metadata.items) as Array<{ bookId: number; quantity: number }>;

      // Calcular total y crear items de la orden
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const book = await findCatalogBookById(item.bookId);
        if (!book) {
          throw new Error(`Libro con ID ${item.bookId} no encontrado`);
        }

        // Convertir precio de Decimal a número
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

        // Actualizar stock
        await prisma.catalogBook.update({
          where: { id: item.bookId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Obtener dirección de envío de la sesión
      let shippingAddress: string | null = null;
      if (session.shipping_details?.address) {
        const addr = session.shipping_details.address;
        shippingAddress = [
          addr.line1,
          addr.line2,
          addr.city,
          addr.postal_code,
          addr.state,
          addr.country
        ].filter(Boolean).join(', ');
      }

      // Crear la orden
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
              catalogBook: true,
            },
          },
        },
      });

      return order;
    }
  }
}

/**
 * Obtiene los detalles de una sesión de checkout
 */
export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

/**
 * Crea la Order desde una sesión de checkout (fallback si el webhook no se ejecutó)
 */
export async function createOrderFromSession(sessionId: string, userId: number) {
  // Verificar si la Order ya existe
  const existingOrder = await prisma.order.findFirst({
    where: {
      paymentIntentId: sessionId,
    },
  });

  if (existingOrder) {
    console.log(`Order ya existe para sesión ${sessionId}`);
    return existingOrder;
  }

  // Obtener la sesión de Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // Verificar que el pago fue exitoso
  if (session.payment_status !== 'paid') {
    throw new Error(`Pago no completado. Status: ${session.payment_status}`);
  }

  const metadata = session.metadata;
  if (!metadata) {
    throw new Error('Metadata no encontrada en la sesión de Stripe');
  }

  const type = metadata.type || 'single';

  if (type === 'single') {
    // Compra directa de un libro
    const bookId = parseInt(metadata.bookId, 10);
    const quantity = parseInt(metadata.quantity, 10);

    // Buscar el libro para obtener el precio actual
    const book = await findCatalogBookById(bookId);
    if (!book) {
      throw new Error(`Libro con ID ${bookId} no encontrado`);
    }

    // Calcular total (convertir Decimal a número)
    const priceNumber = typeof book.price === 'object' && 'toNumber' in book.price
      ? book.price.toNumber()
      : Number(book.price);
    const totalAmount = priceNumber * quantity;

    // Obtener dirección de envío de la sesión
    let shippingAddress: string | null = null;
    if (session.shipping_details?.address) {
      const addr = session.shipping_details.address;
      shippingAddress = [
        addr.line1,
        addr.line2,
        addr.city,
        addr.postal_code,
        addr.state,
        addr.country
      ].filter(Boolean).join(', ');
    }

    // Crear la orden en la BD
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PAID',
        paymentIntentId: session.payment_intent as string || session.id,
        shippingAddress,
        items: {
          create: {
            catalogBookId: bookId,
            quantity,
            price: book.price,
          },
        },
      },
      include: {
        items: {
          include: {
            catalogBook: true,
          },
        },
      },
    });

    // Actualizar stock del libro
    await prisma.catalogBook.update({
      where: { id: bookId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    console.log(`Order creada desde sesión ${sessionId} para usuario ${userId}`);
    return order;
  } else {
    throw new Error('Tipo de compra no soportado en fallback');
  }
}

