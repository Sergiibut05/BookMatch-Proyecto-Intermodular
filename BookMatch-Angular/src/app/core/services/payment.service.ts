import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Respuesta de backend al crear una sesion de Stripe Checkout.
 */
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/** Ítem para crear una sesión de checkout desde el carrito: libro y cantidad. */
export interface CheckoutSessionItem {
  bookId: number;
  quantity: number;
}

/**
 * Servicio de pagos y checkout con Stripe.
 *
 * Crea sesiones para compra directa o carrito, consulta sesiones y gestiona
 * la redireccion segura al checkout alojado.
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/payments`;

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
   *
   * @example
   * ```ts
   * this.paymentService.createCheckoutSession(822, 1).subscribe((session) => {
   *   this.paymentService.redirectToCheckout(session.url);
   * });
   * ```
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
   *
   * @example
   * ```ts
   * this.paymentService.createCheckoutSessionCart([{ bookId: 12, quantity: 2 }]).subscribe();
   * ```
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
   *
   * @example
   * ```ts
   * this.paymentService.redirectToCheckout(session.url);
   * ```
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
   *
   * @example
   * ```ts
   * this.paymentService.getCheckoutSession(sessionId).subscribe();
   * ```
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
   *
   * @example
   * ```ts
   * this.paymentService.verifyPaymentSuccess(sessionId).subscribe();
   * ```
   */
  verifyPaymentSuccess(sessionId: string): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/success?session_id=${sessionId}`, { headers })
      )
    );
  }
}
