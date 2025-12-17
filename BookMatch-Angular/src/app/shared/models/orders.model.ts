/**
 * Interfaces para órdenes y historial de compras
 */

export interface OrderItem {
  id: number;
  orderId: number;
  catalogBookId: number;
  quantity: number;
  price: number;
  catalogBook: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    coverUrl?: string;
    imageUrls: string[];
  };
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentIntentId: string | null;
  shippingAddress: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

