import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Servicios
import { CatalogService } from '@core/services/catalog.service';
import { PaymentService } from '@core/services/payment.service';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';

// Componentes y Modelos
import { Header } from '@shared/components/header/header';
import { StarRatingComponent } from '@shared/components/star-rating/star-rating.component';
import { CatalogBook, Review } from '@shared/models';

// Módulo de traducción
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [Header, CommonModule, ReactiveFormsModule, StarRatingComponent, TranslateModule, RouterLink],
  templateUrl: './book-details.html',
  styleUrl: './book-details.scss',
})
export class BookDetails implements OnInit {
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);
  private fb = inject(FormBuilder);
  public authService = inject(AuthService); 
  isAdmin = this.authService.isAdmin;

  // Señales de datos
  bookId = signal<string>('');
  book = signal<CatalogBook | null>(null);
  selectedImageUrl = signal<string | null>(null);
  reviews = signal<Review[] | null>(null);

  // Es la Computed Signal encargada de mirar el id del usuario logueado.
  currentUserId = computed(() => {
    const user = this.authService.currentUser();
    return user ? user.id : null;
  });

  // Señales de estado
  isProcessingPayment = signal<boolean>(false);
  isAddedToCart = signal<boolean>(false);
  isSubmittingReview = signal<boolean>(false);
  isDeletingReview = signal<boolean>(false);

  // Formulario reactivo para reseñas
  reviewForm!: FormGroup;

  // Es la Computed Signal encargada de calcular la media de las reviews.
  averageRating = computed(() => {
    const currentReviews = this.reviews();
    if (!currentReviews || currentReviews.length === 0) return 0;
    const sum = currentReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / currentReviews.length;
  });

  // Es la Computed Signal encargada de calcular el porcentaje de estrellas por cada review basicamente.
  starDistribution = computed(() => {
    const currentReviews = this.reviews() || [];
    const total = currentReviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (total === 0) return distribution;

    currentReviews.forEach(r => {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = distribution[rating] + 1;
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
    // Inicializar el formulario reactivo
    // rating: requerido, mínimo 1, máximo 5
    // comment: opcional
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['']
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.bookId.set(idParam);
        this.loadBook();
      }
    });
  }
  
  /** Esta función es encargada de cargar el libro y las reviews. */
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

  /** Esta función elige la imagen principal del libro. */
  selectImage(imageUrl: string): void {
    this.selectedImageUrl.set(imageUrl);
  }

  /** Esta función obtiene la URL de la imagen principal del libro. */
  getMainImageUrl(): string | null {
    const currentBook = this.book();
    if (!currentBook) return null;
    return this.selectedImageUrl() || currentBook.coverUrl || (currentBook.imageUrls && currentBook.imageUrls.length > 0 ? currentBook.imageUrls[0] : null);
  }

  /** Esta función es encargada de añadir el libro al carrito,
   *  y pone un timeout de 2 segundos para que se vea el mensaje de exito. */
  onAddToCart(): void {
    const currentBook = this.book();
    if (currentBook && currentBook.stock > 0 && !this.isAddedToCart()) {
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

  /** Esta función es encargada de crear la sesión de pago con Stripe, directamente sin pasar por el carrito. */
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
          alert(this.translate.instant('BOOK_DETAILS.ERRORS.PAYMENT_PROCESS_ERROR'));
          this.isProcessingPayment.set(false);
        }
      },
      error: (error) => {
        console.error('Error al crear sesión de pago:', error);
        const errorMessage = error.error?.message || this.translate.instant('BOOK_DETAILS.ERRORS.PAYMENT_PROCESS_ERROR');
        alert(errorMessage);
        this.isProcessingPayment.set(false);
      }
    });
  }

  /** Esta función es encargada de obtener la inicial/iniciales del usuario que realizó la review. 
   * y si no devuelve un 'U' pa asegurar que no haya error.*/
  getUserInitial(review: Review): string {
    if (review.user?.fullName) {
      const names = review.user.fullName.trim().split(/\s+/);
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      } else {
        return names[0][0].toUpperCase();
      }
    }
    return 'U';
  }

  /** La función obtiene el nombre del usuario que realizó la review, 
   * si no hay devuelve 'Usuario de BookMatch' o su traduccion en el idioma seleccionado. */
  getUserName(review: Review): string {
    if (review.userId === this.currentUserId()) {
      return this.translate.instant('BOOK_DETAILS.YOU');
    }
    return review.user?.fullName || this.translate.instant('BOOK_DETAILS.BOOKMATCH_USER') || 'Usuario de BookMatch' ;
  }

  /** Esta función obtiene la URL del avatar del usuario que realizó la review, si no hay devuelve null
   * y ya se utilizaría la función de getUserInitial para mostrar la inicial/iniciales del usuario.
  */
  getUserAvatar(review: Review): string | null {
    return review.user?.avatarUrl || null;
  }

  /** Esta función es encargada de obtener el porcentaje de estrellas por cada review. */
  getStarPercent(star: number): number {
    const dist = this.starDistribution();
    // @ts-ignore
    return dist[star] || 0;
  }

  /** Esta función es encargada de verificar si la estrella debe estar rellena o no. */
  isStarFilled(star: number, rating: number): boolean {
    return star <= Math.round(rating);
  }

  /** Esta función es encargada de enviar la review al backend. */
  submitReview() {
    if (this.reviewForm.valid) {
      this.isSubmittingReview.set(true);

      
      const formValue = this.reviewForm.value;
      const payload = {
        rating: formValue.rating,
        comment: formValue.comment?.trim() || ''
      };

      this.catalogService.addReview(Number(this.bookId()), payload).subscribe({
        next: (review) => {
          // Resetea el formulario después de enviar
          this.reviewForm.reset({
            rating: 0,
            comment: ''
          });
          this.isSubmittingReview.set(false);
          this.loadBook();
        },
        error: (err) => {
          console.error('Error al enviar reseña:', err);
          this.isSubmittingReview.set(false);
          
          if (err.status === 401) {
            alert(this.translate.instant('BOOK_DETAILS.ERRORS.LOGIN_REQUIRED'));
            this.router.navigate(['/auth/login']);
          } else {
            const serverMessage = err.error?.message || this.translate.instant('BOOK_DETAILS.ERRORS.SAVE_ERROR');
            alert(serverMessage);
          }
        }
      });
    }
  }

  /**
   * Obtener errores de validación del formulario
   */
  getError(control: string): string {
    switch (control) {
      case 'rating':
        if (this.reviewForm.controls['rating'].errors != null &&
          Object.keys(this.reviewForm.controls['rating'].errors).includes('required'))
          return this.translate.instant('BOOK_DETAILS.ERRORS.RATING_REQUIRED');
        else if (this.reviewForm.controls['rating'].errors != null &&
          Object.keys(this.reviewForm.controls['rating'].errors).includes('min'))
          return this.translate.instant('BOOK_DETAILS.ERRORS.RATING_MIN');
        else if (this.reviewForm.controls['rating'].errors != null &&
          Object.keys(this.reviewForm.controls['rating'].errors).includes('max'))
          return this.translate.instant('BOOK_DETAILS.ERRORS.RATING_MAX');
        else if (this.reviewForm.controls['rating'].value === 0)
          return this.translate.instant('BOOK_DETAILS.ERRORS.RATING_SELECT');
        break;
      case 'comment':
        // Si se quisiera añadir validaciones para el comentario, se podría hacer aquí.
        break;
      default:
        return '';
    }
    return '';
  }

  /** Esta función es encargada de eliminar la review del backend. */
  onDeleteReview(reviewId: number) {
    if (!confirm(this.translate.instant('BOOK_DETAILS.ERRORS.DELETE_CONFIRM'))) {
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
        alert(err.error?.message || this.translate.instant('BOOK_DETAILS.ERRORS.DELETE_ERROR'));
      }
    });
  }
}