import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '@core/services/catalog.service';
import { PaymentService } from '@core/services/payment.service';
import { CartService } from '@core/services/cart.service'; // Importamos el carrito
import { Header } from '@shared/components/header/header';
import { CatalogBook, Review } from '@shared/models';

@Component({
  selector: 'app-book-details',
  imports: [Header, CommonModule],
  templateUrl: './book-details.html',
  styleUrl: './book-details.scss',
})
export class BookDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService); // Inyectamos el carrito

  bookId = signal<string>('');
  book = signal<CatalogBook | null>(null);
  selectedImageUrl = signal<string | null>(null);
  reviews = signal<Review[] | null>(null);
  isProcessingPayment = signal<boolean>(false);
  
  // Nueva señal para la animación del botón
  isAddedToCart = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const categoriaParam = params.get('id');
      if (categoriaParam) {
        this.bookId.set(categoriaParam);
        this.loadBook();
      }
    });
  }
  
  loadBook(): void {
    this.catalogService.getBookById(Number(this.bookId())).subscribe((book) => {
      this.book.set(book);
      if (book) {
        this.selectedImageUrl.set(book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null));
        if (book.reviews && book.reviews.length > 0) {
          this.reviews.set(book.reviews);
        } else {
          this.reviews.set([]);
        }
      }
    });
  }

  selectImage(imageUrl: string): void {
    this.selectedImageUrl.set(imageUrl);
  }

  getMainImageUrl(): string | null {
    const currentBook = this.book();
    if (!currentBook) return null;
    return this.selectedImageUrl() || currentBook.coverUrl || (currentBook.imageUrls && currentBook.imageUrls.length > 0 ? currentBook.imageUrls[0] : null);
  }

  // --- LÓGICA PROFESIONAL SIN POPUP ---
  onAddToCart(): void {
    const currentBook = this.book();
    if (currentBook) {
      // 1. Añadir al servicio
      this.cartService.addToCart(currentBook);
      
      // 2. Activar estado visual (botón verde)
      this.isAddedToCart.set(true);

      // 3. Volver al estado normal tras 2 segundos
      setTimeout(() => {
        this.isAddedToCart.set(false);
      }, 2000);
    }
  }

  onBuyNow(): void {
    const currentBook = this.book();
    if (currentBook) {
      this.cartService.addToCart(currentBook);
      this.router.navigate(['/cart']);
    }
  }

  onBuyWithStripe(): void {
    const book = this.book();
    if (!book || book.stock === 0) return;

    this.isProcessingPayment.set(true);

    this.paymentService.createCheckoutSession(book.id, 1).subscribe({
      next: (response) => {
        try {
          this.paymentService.redirectToCheckout(response.url);
        } catch (error) {
          console.error('Error al redirigir a Stripe:', error);
          alert('Error al procesar el pago. Por favor, intenta de nuevo.');
          this.isProcessingPayment.set(false);
        }
      },
      error: (error) => {
        console.error('Error al crear sesión de pago:', error);
        const errorMessage = error.error?.message || 'Error al procesar el pago. Por favor, intenta de nuevo.';
        alert(errorMessage);
        this.isProcessingPayment.set(false);
      }
    });
  }
}