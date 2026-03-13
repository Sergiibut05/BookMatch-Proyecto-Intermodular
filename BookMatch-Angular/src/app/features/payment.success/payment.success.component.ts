import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '@core/services/payment.service';
import { CartService } from '@core/services/cart.service';
import { Header } from '@shared/components/header/header';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Página de éxito de pago: recibe session_id por query, verifica con el backend,
 * limpia el carrito y permite ir a inicio o al perfil (pedidos).
 */
@Component({
  selector: 'app-payment-success',
  imports: [Header, TranslateModule],
  templateUrl: './payment.success.component.html',
  styleUrl: './payment.success.component.scss',
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);

  /** ID de sesión Stripe (query session_id). */
  sessionId: string | null = null;
  /** Verificando pago. */
  isLoading = true;
  /** Estado del pago tras verificar. */
  paymentStatus: string | null = null;
  /** Mensaje de error. */
  error: string | null = null;

  /** Lee session_id y llama a verifyPayment. */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || null;
      
      if (this.sessionId) {
        this.verifyPayment();
      } else {
        this.error = 'No se encontró el ID de sesión';
        this.isLoading = false;
      }
    });
  }

  /** Verifica el pago con el backend y limpia el carrito. */
  verifyPayment(): void {
    if (!this.sessionId) {
      this.error = 'ID de sesión no válido';
      this.isLoading = false;
      return;
    }

    this.paymentService.verifyPaymentSuccess(this.sessionId).subscribe({
      next: (response) => {
        this.paymentStatus = response.paymentStatus;
        this.isLoading = false;
        


        this.cartService.clearCart(); 
      },
      error: (err) => {
        console.error('Error verificando pago:', err);
        this.error = err.error?.message || 'Error al verificar el pago';
        this.isLoading = false;
      }
    });
  }

  /** Navega a inicio. */
  goToHome(): void {
    this.router.navigate(['/home']);
  }

  /** Navega al perfil (historial de pedidos). */
  goToOrders(): void {
    this.router.navigate(['/profile']); 
  }
}