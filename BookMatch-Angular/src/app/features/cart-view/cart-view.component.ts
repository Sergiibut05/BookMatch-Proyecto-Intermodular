import { Component, inject, signal } from '@angular/core';
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

    

    
    openClearCartModal() {
        this.showClearModal.set(true); 
    }

    
    cancelClearCart() {
        this.showClearModal.set(false); 
    }

    
    confirmClearCart() {
        this.cartService.clearCart(); 
        this.showClearModal.set(false);
    }

    
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