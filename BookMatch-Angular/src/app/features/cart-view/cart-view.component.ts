import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Vista del carrito: lista de ítems, cantidades, total y botón de checkout (Stripe).
 * Permite vaciar carrito con modal de confirmación.
 */
@Component({
    selector: 'app-cart-view',
    standalone: true,
    imports: [CommonModule, RouterLink, Header, Footer, TranslateModule],
    templateUrl: './cart-view.component.html',
    styleUrl: './cart-view.component.scss'
})
export class CartViewComponent {
    private cartService = inject(CartService);
    private paymentService = inject(PaymentService);

    /** Ítems del carrito (readonly desde el servicio). */
    cartItems = this.cartService.cartItems;
    /** Precio total (readonly). */
    totalPrice = this.cartService.totalPrice;
    /** Número total de ítems (readonly). */
    totalItems = this.cartService.totalItems;

    /** En proceso de checkout. */
    isLoading = false;

    /** Modal de vaciar carrito visible. */
    showClearModal = signal(false);

    /** Aumenta la cantidad del libro en 1. */
    increaseQuantity(bookId: number, currentQty: number) {
        this.cartService.updateQuantity(bookId, currentQty + 1);
    }

    /** Disminuye la cantidad o elimina si es 1. */
    decreaseQuantity(bookId: number, currentQty: number) {
        if (currentQty > 1) {
            this.cartService.updateQuantity(bookId, currentQty - 1);
        } else {
            this.removeItem(bookId);
        }
    }

    /** Quita el libro del carrito. */
    removeItem(bookId: number) {
        this.cartService.removeFromCart(bookId);
    }

    /** Abre el modal de vaciar carrito. */
    openClearCartModal() {
        this.showClearModal.set(true); 
    }

    /** Cierra el modal sin vaciar. */
    cancelClearCart() {
        this.showClearModal.set(false); 
    }

    /** Vacía el carrito y cierra el modal. */
    confirmClearCart() {
        this.cartService.clearCart(); 
        this.showClearModal.set(false);
    }

    /** Crea sesión Stripe con el carrito y redirige al checkout. */
    onCheckout() {
        if (this.cartItems().length === 0) return;

        this.isLoading = true;
        const itemsForBackend = this.cartService.getItemsForCheckout();

        this.paymentService.createCheckoutSessionCart(itemsForBackend).subscribe({
            next: (response) => {
                if (response.url) {
                    window.location.href = response.url;
                } else {
                    this.isLoading = false;
                }
            },
            error: (err) => {
                console.error(err);
                alert('Error al iniciar el pago.');
                this.isLoading = false;
            }
        });
    }
}