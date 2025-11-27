import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '@core/services/catalog.service';
import { PaymentService } from '@core/services/payment.service';
import { Header } from '@shared/components/header/header';
import { CatalogBook, Review } from '@shared/models';

@Component({
  selector: 'app-book-details',
  imports: [Header, CommonModule],
  templateUrl: './book-details.html',
  styleUrl: './book-details.scss',
})
export class BookDetails implements OnInit{
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private paymentService = inject(PaymentService);
  bookId = signal<string>('');
  book = signal<CatalogBook | null>(null);
  selectedImageUrl = signal<string | null>(null);
  reviews = signal<Review[] | null>(null);
  isProcessingPayment = signal<boolean>(false);
  
  
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
      // Establecer la imagen principal seleccionada
      if (book) {
        this.selectedImageUrl.set(book.coverUrl || (book.imageUrls && book.imageUrls.length > 0 ? book.imageUrls[0] : null));
        // Cargar reviews si vienen del backend
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

  onAddToCart(): void {
    // TODO: Implementar lógica de añadir a la cesta
    console.log('Añadir a la cesta:', this.book()?.id);
  }

  onBuyNow(): void {
    // TODO: Implementar lógica de compra inmediata
    console.log('Comprar ahora:', this.book()?.id);
  }

  onBuyWithStripe(): void {
    const book = this.book();
    if (!book || book.stock === 0) {
      return;
    }

    this.isProcessingPayment.set(true);

    this.paymentService.createCheckoutSession(book.id, 1).subscribe({
      next: (response) => {
        // Redirigir a Stripe Checkout usando la URL proporcionada
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
