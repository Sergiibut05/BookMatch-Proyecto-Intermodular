import { Component, ElementRef, Input, ViewChild, inject, signal, OnInit } from '@angular/core';

import { CatalogService } from '@core/services/catalog.service';
import { CatalogBook } from '@shared/models';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Carrusel horizontal reutilizable de libros.
 *
 * Soporta modo por categoria o modo novedades y encapsula navegacion a
 * detalle y vista ampliada de catalogo.
 *
 * @example
 * ```html
 * <app-carousel
 *   [categoryTitle]="'Fantasia'"
 *   [categoryId]="4"
 * />
 * ```
 */
@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel implements OnInit {
  @Input() categoryTitle: string = 'Libros';
  
  
  @Input() categoryId?: number;
  @Input() isNewArrivals: boolean = false;
  
  
  @Input() categoryUrl: string = '';
  @Input() categoryName: string = '';

  @ViewChild('carousel', { static: false }) carouselRef!: ElementRef<HTMLDivElement>;

  private catalogService = inject(CatalogService);
  private router = inject(Router);
  books = signal<CatalogBook[]>([]);

  constructor() {}

  ngOnInit() {
    this.loadBooks();
  }

  /**
   * Carga libros segun el modo configurado.
   */
  loadBooks() {
    
    if (this.isNewArrivals) {
      this.catalogService.getNewArrivals(10).subscribe({
        next: (res) => this.books.set(res.items || []),
        error: (err) => console.error('Error cargando novedades:', err)
      });
    } 
    
    else if (this.categoryId) {
      this.catalogService.getBooksByCategoryId(this.categoryId, 1, 10).subscribe({
        next: (res) => this.books.set(res.items || []),
        error: (err) => console.error(`Error cargando categoría ${this.categoryId}:`, err)
      });
    } 
    
    else if (this.categoryName) {
      this.catalogService.getBooksByCategoryName(this.categoryName, 1, 10).subscribe({
        next: (res: any) => this.books.set(res?.items ?? []),
        error: (error) => console.error('Error legacy:', error),
      });
    }
  }

  
  private getStep(): number {
    const el = this.carouselRef?.nativeElement;
    if (!el) return 0;
    const firstCard = el.querySelector<HTMLElement>('.book-card');
    const gap = 16; 
    const cardWidth = firstCard ? firstCard.offsetWidth : 200;
    return cardWidth + gap;
  }

  private snapToNearest() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    const step = this.getStep();
    if (step <= 0) return;
    const nearest = Math.round(el.scrollLeft / step) * step;
    el.scrollTo({ left: nearest, behavior: 'smooth' });
  }

  /**
   * Desplaza el carrusel una tarjeta hacia atras.
   */
  prev() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: -this.getStep(), behavior: 'smooth' });
    setTimeout(() => this.snapToNearest(), 220);
  }

  /**
   * Desplaza el carrusel una tarjeta hacia delante.
   */
  next() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: this.getStep(), behavior: 'smooth' });
    setTimeout(() => this.snapToNearest(), 220);
  }

  /**
   * Navega a la vista de categoria completa.
   */
  onSeeMore(): void {
    if (this.isNewArrivals) {
      this.router.navigate(['/categories', 'novedades'], { queryParams: { sortBy: 'newest' } });
    } 
    
    else if (this.categoryName || this.categoryUrl) {
      const slug = this.categoryName || this.categoryUrl;
      this.router.navigate(['/categories', slug]);
    }
    
    else if (this.categoryId) {
      this.router.navigate(['/catalog'], { queryParams: { categoryId: this.categoryId } });
    }
  }

  /**
   * Navega al detalle del libro seleccionado.
   */
  onBookClick(book: CatalogBook): void {
    this.router.navigate(['/book-details', book.id]);
  }
}