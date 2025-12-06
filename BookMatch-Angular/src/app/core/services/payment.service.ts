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
   * Crea una sesión de checkout para un solo libro
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
   * Crea una sesión de checkout para múltiples libros (carrito)
   * Preparado para cuando se implemente el carrito
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
   * Redirige al usuario a Stripe Checkout usando la URL proporcionada
   * Nota: Stripe eliminó redirectToCheckout, ahora usamos directamente la URL
   */
  redirectToCheckout(url: string): void {
    if (!url) {
      throw new Error('URL de checkout no válida');
    }
    window.location.href = url;
  }

  /**
   * Obtiene los detalles de una sesión de checkout
   */
  getCheckoutSession(sessionId: string): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/session/${sessionId}`, { headers })
      )
    );
  }

  /**
   * Verifica el estado de un pago exitoso y crea la Order si no existe
   */
  verifyPaymentSuccess(sessionId: string): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/success?session_id=${sessionId}`, { headers })
      )
    );
  }
}
