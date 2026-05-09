import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnDestroy,
  OnInit,
  inject,
  signal,
  effect,
  EffectRef,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogBook } from '@shared/models';
import { CatalogQueryService } from '@core/services/catalog-query.service';

/**
 * Carrusel horizontal reutilizable de libros.
 *
 * Usa @ngneat/query a través de CatalogQueryService para:
 *  - **Caché automática** (staleTime 5 min): volver al home es instantáneo, sin red.
 *  - **Deduplicación**: varios carruseles con igual clave comparten una sola request.
 *  - **IntersectionObserver**: la query no se activa hasta que el carrusel entra en viewport.
 *
 * @example
 * ```html
 * <app-carousel [categoryTitle]="'Fantasía'" [categoryId]="4" />
 * ```
 */
@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
})
export class Carousel implements OnInit, OnDestroy {
  @Input() categoryTitle: string = 'Libros';
  @Input() categoryId?: number;
  @Input() isNewArrivals: boolean = false;
  @Input() categoryUrl: string = '';
  @Input() categoryName: string = '';

  @ViewChild('carousel', { static: false }) carouselRef!: ElementRef<HTMLDivElement>;

  private catalogQueryService = inject(CatalogQueryService);
  private router = inject(Router);
  private hostEl = inject(ElementRef);
  private injector = inject(Injector);

  books = signal<CatalogBook[]>([]);
  isLoading = signal(true);

  private queryEffectRef: EffectRef | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {}

  ngOnInit() {
    // La query solo se activa cuando el elemento entra en el viewport (200px de margen).
    // @ngneat/query gestiona la caché: si ya fue cargado, no hay request de red.
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          this.activateQuery();
          this.intersectionObserver?.disconnect();
          this.intersectionObserver = null;
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );
    this.intersectionObserver.observe(this.hostEl.nativeElement);
  }

  ngOnDestroy() {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.queryEffectRef?.destroy();
    this.queryEffectRef = null;
  }

  /**
   * Instancia la query correcta y sincroniza el resultado con la señal `books`.
   * Se llama una sola vez cuando el carrusel entra en el viewport.
   */
  private activateQuery() {
    let query: ReturnType<CatalogQueryService['getNewArrivals']>;

    if (this.isNewArrivals) {
      query = this.catalogQueryService.getNewArrivals(10);
    } else if (this.categoryId) {
      query = this.catalogQueryService.getBooksByCategoryId(this.categoryId, 1, 10);
    } else if (this.categoryName) {
      query = this.catalogQueryService.getBooksByCategoryName(this.categoryName, 1, 10);
    } else {
      this.isLoading.set(false);
      return;
    }

    // Usar effect() dentro del injection context del componente
    this.queryEffectRef = runInInjectionContext(this.injector, () =>
      effect(() => {
        const result = query.result();
        this.isLoading.set(result.isPending);
        if (result.data) {
          // Soporte para respuestas paginadas { items: [] } y arrays directos
          const raw = result.data as any;
          const items: CatalogBook[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
          this.books.set(items);
        }
      })
    );
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

  /** Desplaza el carrusel una tarjeta hacia atrás. */
  prev() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: -this.getStep(), behavior: 'smooth' });
    setTimeout(() => this.snapToNearest(), 220);
  }

  /** Desplaza el carrusel una tarjeta hacia delante. */
  next() {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: this.getStep(), behavior: 'smooth' });
    setTimeout(() => this.snapToNearest(), 220);
  }

  /** Navega a la vista de categoría completa. */
  onSeeMore(): void {
    if (this.isNewArrivals) {
      this.router.navigate(['/categories', 'novedades'], { queryParams: { sortBy: 'newest' } });
    } else if (this.categoryName || this.categoryUrl) {
      const slug = this.categoryName || this.categoryUrl;
      this.router.navigate(['/categories', slug]);
    } else if (this.categoryId) {
      this.router.navigate(['/catalog'], { queryParams: { categoryId: this.categoryId } });
    }
  }

  /** Navega al detalle del libro seleccionado. */
  onBookClick(book: CatalogBook): void {
    this.router.navigate(['/book-details', book.id]);
  }
}