import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '@core/services/payment.service';
import { CartService } from '@core/services/cart.service'; // <--- 1. IMPORTAR SERVICIO
import { Header } from '@shared/components/header/header';

@Component({
  selector: 'app-payment-success',
  imports: [CommonModule, Header],
  templateUrl: './payment.success.component.html',
  styleUrl: './payment.success.component.scss',
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService); // <--- 2. INYECTAR SERVICIO

  sessionId: string | null = null;
  isLoading = true;
  paymentStatus: string | null = null;
  error: string | null = null;

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
        
        // <--- 3. LIMPIAR EL CARRITO AQUÍ
        // Si el backend confirma que el pago está OK, borramos el carrito local
        this.cartService.clearCart(); 
      },
      error: (err) => {
        console.error('Error verificando pago:', err);
        this.error = err.error?.message || 'Error al verificar el pago';
        this.isLoading = false;
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToOrders(): void {
    // Te recomiendo redirigir a 'profile' si ya tienes esa página
    this.router.navigate(['/profile']); 
  }
}