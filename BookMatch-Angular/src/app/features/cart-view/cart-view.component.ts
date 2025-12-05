import { Component, inject, signal } from '@angular/core'; // <--- Importamos signal
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { TranslateModule } from '@ngx-translate/core';

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

    cartItems = this.cartService.cartItems;
    totalPrice = this.cartService.totalPrice;
    totalItems = this.cartService.totalItems;

    isLoading = false;

    // 1. SEÑAL PARA EL MODAL (Inicialmente oculta)
    showClearModal = signal(false);

    increaseQuantity(bookId: number, currentQty: number) {
        this.cartService.updateQuantity(bookId, currentQty + 1);
    }

    decreaseQuantity(bookId: number, currentQty: number) {
        if (currentQty > 1) {
            this.cartService.updateQuantity(bookId, currentQty - 1);
        } else {
            this.removeItem(bookId);
        }
    }

    removeItem(bookId: number) {
        this.cartService.removeFromCart(bookId);
    }

    // --- NUEVA LÓGICA PARA EL MODAL ---

    // Esto es lo que llama el botón "Vaciar Carrito" ahora
    openClearCartModal() {
        this.showClearModal.set(true); // Muestra tu modal bonito
    }

    // Esto lo llama el botón "Cancelar" del modal
    cancelClearCart() {
        this.showClearModal.set(false); // Oculta el modal
    }

    // Esto lo llama el botón "Sí, vaciar" del modal
    confirmClearCart() {
        this.cartService.clearCart(); // Borra los datos
        this.showClearModal.set(false); // Cierra el modal
    }

    // --- Checkout ---
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