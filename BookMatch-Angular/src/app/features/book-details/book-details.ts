import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servicios
import { CatalogService } from '@core/services/catalog.service';
import { PaymentService } from '@core/services/payment.service';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';

// Componentes y Modelos
import { Header } from '@shared/components/header/header';
import { CatalogBook, Review } from '@shared/models'; // User ya no hace falta importarlo aquí explícitamente

// Módulo de traducción
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [Header, CommonModule, FormsModule, TranslateModule],
  templateUrl: './book-details.html',
  styleUrl: './book-details.scss',
})
export class BookDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);
  
  // Hacemos el servicio público para poder usarlo en el HTML si fuera necesario, 
  // pero sobre todo para acceder a sus señales
  public authService = inject(AuthService); 

  // Señales de datos
  bookId = signal<string>('');
  book = signal<CatalogBook | null>(null);
  selectedImageUrl = signal<string | null>(null);
  reviews = signal<Review[] | null>(null);

  // --- CORRECCIÓN CLAVE AQUÍ ---
  // Usamos computed() para "escuchar" automáticamente a la señal del servicio.
  // Cuando authService.currentUser cambie (al cargar el perfil del backend), esto se actualizará solo.
  currentUserId = computed(() => {
    const user = this.authService.currentUser();
    return user ? user.id : null;
  });
  // -----------------------------

  // Señales de estado
  isProcessingPayment = signal<boolean>(false);
  isAddedToCart = signal<boolean>(false);
  isSubmittingReview = signal<boolean>(false);
  isDeletingReview = signal<boolean>(false);

  // Señales para el formulario
  newReviewRating = signal<number>(0);
  newReviewComment = signal<string>('');
  hoverRating = signal<number>(0);

  // --- COMPUTED SIGNALS ---
  averageRating = computed(() => {
    const currentReviews = this.reviews();
    if (!currentReviews || currentReviews.length === 0) return 0;
    const sum = currentReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / currentReviews.length;
  });

  starDistribution = computed(() => {
    const currentReviews = this.reviews() || [];
    const total = currentReviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (total === 0) return distribution;

    currentReviews.forEach(r => {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return {
      5: (distribution[5] / total) * 100,
      4: (distribution[4] / total) * 100,
      3: (distribution[3] / total) * 100,
      2: (distribution[2] / total) * 100,
      1: (distribution[1] / total) * 100
    };
  });

  ngOnInit(): void {
    // YA NO NECESITAMOS SUSCRIBIRNOS MANUALMENTE AL USUARIO AQUÍ
    // La señal 'currentUserId' de arriba ya lo hace automáticamente.

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.bookId.set(idParam);
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
          const sortedReviews = [...book.reviews].sort((a, b) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
          this.reviews.set(sortedReviews);
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
    const currentBook = this.book();
    if (currentBook) {
      this.cartService.addToCart(currentBook);
      this.isAddedToCart.set(true);
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

  setRating(stars: number) {
    this.newReviewRating.set(stars);
  }

  setHoverRating(stars: number) {
    this.hoverRating.set(stars);
  }

  getUserInitial(userId: number): string {
    return 'U';
  }

  getStarPercent(star: number): number {
    const dist = this.starDistribution();
    // @ts-ignore
    return dist[star] || 0;
  }

  isStarFilled(star: number, rating: number): boolean {
    return star <= Math.round(rating);
  }

  submitReview() {
    if (this.newReviewRating() === 0) {
      alert('Por favor, selecciona una puntuación de estrellas.');
      return;
    }

    this.isSubmittingReview.set(true);

    const payload = {
      rating: this.newReviewRating(),
      comment: this.newReviewComment()
    };

    this.catalogService.addReview(Number(this.bookId()), payload).subscribe({
      next: (review) => {
        this.newReviewRating.set(0);
        this.newReviewComment.set('');
        this.isSubmittingReview.set(false);
        this.loadBook();
      },
      error: (err) => {
        console.error('Error al enviar reseña:', err);
        this.isSubmittingReview.set(false);
        
        if (err.status === 401) {
          alert('Debes iniciar sesión para dejar una reseña.');
          this.router.navigate(['/auth/login']);
        } else {
          const serverMessage = err.error?.message || 'Ocurrió un error al guardar tu reseña.';
          alert(serverMessage);
        }
      }
    });
  }

  onDeleteReview(reviewId: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar tu reseña? Esta acción no se puede deshacer.')) {
      return;
    }

    this.isDeletingReview.set(true);

    this.catalogService.deleteReview(reviewId).subscribe({
      next: () => {
        const updatedReviews = this.reviews()?.filter(r => r.id !== reviewId) || [];
        this.reviews.set(updatedReviews);
        this.isDeletingReview.set(false);
      },
      error: (err) => {
        console.error('Error al borrar reseña:', err);
        this.isDeletingReview.set(false);
        alert(err.error?.message || 'Error al eliminar la reseña');
      }
    });
  }
}