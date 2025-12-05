import { Component, ElementRef, Input, ViewChild, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '@core/services/catalog.service';
import { CatalogBook } from '@shared/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel implements OnInit {
  @Input() categoryTitle: string = 'Libros';
  
  // Nuevos inputs
  @Input() categoryId?: number;
  @Input() isNewArrivals: boolean = false;
  
  // Inputs antiguos (RESTAURADOS)
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

  loadBooks() {
    // 1. Cargar Novedades
    if (this.isNewArrivals) {
      this.catalogService.getNewArrivals(10).subscribe({
        next: (res) => this.books.set(res.items || []),
        error: (err) => console.error('Error cargando novedades:', err)
      });
    } 
    // 2. Cargar por ID (ESTO ARREGLA QUE SE VEAN LOS LIBROS CORRECTOS)
    else if (this.categoryId) {
      this.catalogService.getBooksByCategoryId(this.categoryId, 1, 10).subscribe({
        next: (res) => this.books.set(res.items || []),
        error: (err) => console.error(`Error cargando categoría ${this.categoryId}:`, err)
      });
    } 
    // 3. Fallback antiguo
    else if (this.categoryName) {
      this.catalogService.getBooksByCategoryName(this.categoryName, 1, 10).subscribe({
        next: (res: any) => this.books.set(res?.items ?? []),
        error: (error) => console.error('Error legacy:', error),
      });
    }
  }

  // Lógica de scroll (INTACTA)
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

  prev() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: -this.getStep(), behavior: 'smooth' });
    setTimeout(() => this.snapToNearest(), 220);
  }

  next() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: this.getStep(), behavior: 'smooth' });
    setTimeout(() => this.snapToNearest(), 220);
  }

  // --- MODIFICACIÓN IMPORTANTE: RESTAURAMOS LA RUTA ANTIGUA ---
  onSeeMore(): void {
    if (this.isNewArrivals) {
      this.router.navigate(['/catalog'], { queryParams: { sortBy: 'newest' } });
    } 
    // SI TENEMOS NOMBRE, USAMOS LA RUTA ANTIGUA (/categories/nombre)
    else if (this.categoryName || this.categoryUrl) {
      const slug = this.categoryName || this.categoryUrl;
      this.router.navigate(['/categories', slug]);
    }
    // Si no hay nombre pero hay ID, usamos la ruta de catálogo por defecto
    else if (this.categoryId) {
      this.router.navigate(['/catalog'], { queryParams: { categoryId: this.categoryId } });
    }
  }

  onBookClick(book: CatalogBook): void {
    this.router.navigate(['/book-details', book.id]);
  }
}