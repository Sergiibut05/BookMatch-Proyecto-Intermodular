import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CheckoutSessionItem {
  bookId: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/payments`;

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
   * @param bookId ID del libro
   * @param quantity Cantidad
   * @returns Observable con la sesión de checkout
   */
  createCheckoutSession(bookId: number, quantity: number = 1): Observable<CheckoutSessionResponse> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.post<CheckoutSessionResponse>(
          `${this.apiUrl}/create-checkout-session`,
          { bookId, quantity },
          { headers }
        )
      )
    );
  }

  /**
   * @param items Array de items del carrito
   * @returns Observable con la sesión de checkout
   */
  createCheckoutSessionCart(items: CheckoutSessionItem[]): Observable<CheckoutSessionResponse> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.post<CheckoutSessionResponse>(
          `${this.apiUrl}/create-checkout-session-cart`,
          { items },
          { headers }
        )
      )
    );
  }

  /**
   * @param url URL de checkout de Stripe
   */
  redirectToCheckout(url: string): void {
    if (!url) {
      throw new Error('URL de checkout no válida');
    }
    window.location.href = url;
  }

  /**
   * @param sessionId ID de la sesión
   * @returns Observable con los detalles de la sesión
   */
  getCheckoutSession(sessionId: string): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/session/${sessionId}`, { headers })
      )
    );
  }

  /**
   * @param sessionId ID de la sesión de pago
   * @returns Observable con el resultado de la verificación
   */
  verifyPaymentSuccess(sessionId: string): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/success?session_id=${sessionId}`, { headers })
      )
    );
  }
}
