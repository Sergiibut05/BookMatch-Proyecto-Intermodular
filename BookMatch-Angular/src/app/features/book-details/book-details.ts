import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '@core/services/catalog.service';
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
  bookId = signal<string>('');
  book = signal<CatalogBook | null>(null);
  selectedImageUrl = signal<string | null>(null);
  reviews = signal<Review[] | null>(null);
  
  
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
    // TODO: Implementar integración con Stripe
    console.log('Comprar con Stripe:', this.book()?.id);
  }
}
