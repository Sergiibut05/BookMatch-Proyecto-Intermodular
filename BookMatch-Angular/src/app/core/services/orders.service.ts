import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Order } from '@shared/models/orders.model';

/**
 * Servicio de historial de pedidos del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/orders`;

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      map(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      })
    );
  }

  /**
   * @returns Observable con el historial de compras del usuario
   *
   * @example
   * ```ts
   * this.ordersService.getOrderHistory().subscribe((orders) => {
   *   this.orders = orders;
   * });
   * ```
   */
  getOrderHistory(): Observable<Order[]> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Order[]>(`${this.apiUrl}/history`, { headers })
      )
    );
  }
}

