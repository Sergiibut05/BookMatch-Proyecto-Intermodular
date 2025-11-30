import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '@core/services/orders.service';
import { Order } from '@shared/models/orders.model';

@Component({
  selector: 'app-purchase-history',
  imports: [CommonModule],
  templateUrl: './purchase-history.component.html',
  styleUrl: './purchase-history.component.scss',
})
export class PurchaseHistoryComponent implements OnInit {
  private ordersService = inject(OrdersService);

  orders = signal<Order[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrderHistory();
  }

  loadOrderHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.ordersService.getOrderHistory().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando historial de compras:', err);
        this.error.set(err.error?.message || 'Error al cargar el historial de compras');
        this.isLoading.set(false);
      }
    });
  }

  getBookImage(orderItem: Order['items'][0]): string {
    return orderItem.catalogBook.coverUrl || 
           (orderItem.catalogBook.imageUrls && orderItem.catalogBook.imageUrls.length > 0 
             ? orderItem.catalogBook.imageUrls[0] 
             : '');
  }

  formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(numPrice);
  }

  getStatusLabel(status: Order['status']): string {
    const statusMap: Record<Order['status'], string> = {
      'PENDING': 'Pendiente',
      'PAID': 'Pagado',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: Order['status']): string {
    const colorMap: Record<Order['status'], string> = {
      'PENDING': '#F59E0B',
      'PAID': '#047857', // Verde más oscuro para mejor contraste con el fondo naranja
      'SHIPPED': '#3B82F6',
      'DELIVERED': '#059669',
      'CANCELLED': '#EF4444'
    };
    return colorMap[status] || '#6B7280';
  }

  getStatusBackgroundColor(status: Order['status']): string {
    // Para "Pagado" usamos mayor opacidad para mejor visibilidad sobre el fondo naranja
    if (status === 'PAID') {
      return this.getStatusColor(status) + '40'; // 40 en hex = ~25% de opacidad
    }
    return this.getStatusColor(status) + '20'; // 20 en hex = ~12.5% de opacidad para los demás
  }
}

