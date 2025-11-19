import { Component, ElementRef, Input, ViewChild, inject, signal } from '@angular/core';
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
export class Carousel {
  @Input() categoryTitle: string = 'Libros';
  @Input() categoryUrl: string = '';
  @Input() categoryName: string = '';

  @ViewChild('carousel', { static: false }) carouselRef!: ElementRef<HTMLDivElement>;

  private catalogService = inject(CatalogService);
  private router = inject(Router);
  books = signal<CatalogBook[]>([]);

  constructor() {
    // delayed fetching until inputs are set (ngOnInit)
  }

  ngOnInit() {
    if (this.categoryName && this.categoryName.trim().length > 0) {
      this.catalogService.getBooksByCategoryName(this.categoryName, 1, 10).subscribe({
        next: (res: any) => {
          const items = res?.items ?? [];
          this.books.set(items);
        },
        error: (error) => console.error('Error al obtener los libros:', error),
      });
    } else {
      this.catalogService.getBooksByCategoryName(this.categoryName, 1, 10).subscribe({
        next: (res: any) => {
          const items = res?.items ?? res ?? [];
          this.books.set(items);
        },
        error: (error) => console.error('Error al obtener los libros:', error),
      });
    }
  }

  private getStep(): number {
    const el = this.carouselRef?.nativeElement;
    if (!el) return 0;
    const firstCard = el.querySelector<HTMLElement>('.book-card');
    const styles = getComputedStyle(el);
    const gap = parseFloat((styles as any).columnGap || styles.gap || '0');
    const cardWidth = firstCard ? firstCard.offsetWidth : Math.floor(el.clientWidth * 0.5);
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
    const step = this.getStep();
    el.scrollBy({ left: -step, behavior: 'smooth' });
    if (el.scrollLeft <= 1) {
      setTimeout(() => {
        const max = el.scrollWidth - el.clientWidth;
        const stepSize = this.getStep();
        const steps = stepSize > 0 ? Math.floor(max / stepSize) : 0;
        el.scrollLeft = steps * stepSize;
      }, 200);
    }
    setTimeout(() => this.snapToNearest(), 220);
  }

  next() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    const step = this.getStep();
    el.scrollBy({ left: step, behavior: 'smooth' });
    if (Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 1) {
      setTimeout(() => {
        el.scrollLeft = 0;
      }, 200);
    }
    setTimeout(() => this.snapToNearest(), 220);
  }
  onSeeMore(): void {
    this.router.navigate(['/categories', this.categoryName]);
  }
  onBookClick(book: CatalogBook): void {
    this.router.navigate(['/book-details', book.id]);
  }
}

