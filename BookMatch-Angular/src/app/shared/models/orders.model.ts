/**
 * Interfaces para órdenes y historial de compras
 */

/**
 * Línea de un pedido: libro, cantidad y precio en el momento de la compra.
 * Incluye datos del libro (catálogo) para mostrar en historial.
 */
export interface OrderItem {
  /** ID de la línea de pedido. */
  id: number;
  /** ID del pedido. */
  orderId: number;
  /** ID del libro en catálogo. */
  catalogBookId: number;
  /** Cantidad comprada. */
  quantity: number;
  /** Precio unitario en el momento de la compra. */
  price: number;
  /** Datos del libro para mostrar en historial. */
  catalogBook: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    coverUrl?: string;
    imageUrls: string[];
  };
}

/**
 * Pedido de un usuario: total, estado, dirección de envío e ítems.
 * Estados: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED.
 */
export interface Order {
  /** ID del pedido. */
  id: number;
  /** ID del usuario. */
  userId: number;
  /** Importe total. */
  totalAmount: number;
  /** Estado del pedido. */
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  /** ID de la sesión Stripe si existe. */
  paymentIntentId: string | null;
  /** Dirección de envío. */
  shippingAddress: string | null;
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Fecha de actualización (ISO). */
  updatedAt: string;
  /** Líneas del pedido. */
  items: OrderItem[];
}

