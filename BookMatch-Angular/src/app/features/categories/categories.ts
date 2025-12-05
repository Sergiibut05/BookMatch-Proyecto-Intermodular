import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '@core/services/catalog.service';
import { Header } from '@shared/components/header/header';
import { CatalogBook } from '@shared/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-categories',
  imports: [Header, CommonModule, FormsModule, TranslateModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private router = inject(Router);
  
  category = signal<string>('');
  books = signal<CatalogBook[]>([]);
  
  page = signal<number>(1);
  limit = signal<number>(10);
  total = signal<number>(0);
  onGrid = signal<boolean>(true);

  // --- TODOS LOS FILTROS ---
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  sortBy = signal<string>('newest');
  minRating = signal<number | null>(null); // Nuevo
  inStock = signal<boolean>(false);        // Nuevo

  showMobileFilters = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const categoriaParam = params.get('categoria');
      if (categoriaParam) {
        this.category.set(categoriaParam);
        
        // Leemos TODOS los parámetros de la URL
        this.route.queryParamMap.subscribe((queryParams) => {
          this.page.set(Number(queryParams.get('page')) || 1);
          this.limit.set(Number(queryParams.get('limit')) || 10);
          this.minPrice.set(queryParams.get('minPrice') ? Number(queryParams.get('minPrice')) : null);
          this.maxPrice.set(queryParams.get('maxPrice') ? Number(queryParams.get('maxPrice')) : null);
          this.sortBy.set(queryParams.get('sortBy') || 'newest');
          
          // Nuevos filtros
          this.minRating.set(queryParams.get('minRating') ? Number(queryParams.get('minRating')) : null);
          this.inStock.set(queryParams.get('inStock') === 'true');
          
          this.loadbooks();
        });
      }
    });
  }

  private loadbooks() {
    if(this.category()) {
      this.catalogService.getBooksByCategoryName(
        this.category().toString(), 
        this.page(), 
        this.limit(),
        this.minPrice(),
        this.maxPrice(),
        this.sortBy(),
        this.minRating(), // Enviamos al servicio
        this.inStock()    // Enviamos al servicio
      ).subscribe({
        next: (res: any) => {
          const items = res?.items ?? [];
          this.books.set(items);
          this.total.set(res?.total ?? 0);
        },
        error: (error) => console.error('Error al obtener los libros:', error),
      });
    }
  }

  updateParams() {
    const queryParams: any = {
      page: this.page(),
      limit: this.limit(),
      sortBy: this.sortBy(),
    };

    if (this.minPrice()) queryParams.minPrice = this.minPrice();
    if (this.maxPrice()) queryParams.maxPrice = this.maxPrice();
    
    // Agregamos los nuevos a la URL
    if (this.minRating()) queryParams.minRating = this.minRating();
    if (this.inStock()) queryParams.inStock = 'true';
    else queryParams.inStock = null; // Para borrarlo de la URL si es false

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showMobileFilters.set(false);
  }

  applyFilters() {
    this.page.set(1);
    this.updateParams();
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value);
    this.page.set(1);
    this.updateParams();
  }

  // Nuevo helper para las estrellas
  setRating(stars: number) {
    if (this.minRating() === stars) {
      this.minRating.set(null); // Deseleccionar si ya estaba
    } else {
      this.minRating.set(stars);
    }
    this.applyFilters();
  }

  clearFilters() {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.sortBy.set('newest');
    this.minRating.set(null);
    this.inStock.set(false);
    this.page.set(1);
    this.updateParams();
  }

  toggleMobileFilters() {
    this.showMobileFilters.update(v => !v);
  }

  // --- GETTERS & HELPERS ---
  get totalPages(): number {
    return Math.ceil(this.total() / this.limit());
  }

  get endItem(): number {
    return Math.min(this.page() * this.limit(), this.total());
  }

  get startItem(): number {
    return this.total() > 0 ? (this.page() - 1) * this.limit() + 1 : 0;
  }

  goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.page.set(pageNumber);
      this.updateParams();
    }
  }

  previousPage() {
    if (this.page() > 1) {
      this.goToPage(this.page() - 1);
    }
  }

  nextPage() {
    if (this.page() < this.totalPages) {
      this.goToPage(this.page() + 1);
    }
  }

  onLimitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.limit.set(Number(target.value));
    this.page.set(1);
    this.updateParams();
  }

  toggleView() {
    this.onGrid.set(!this.onGrid());
  }

  getDiscountedPrice(price: number): number {
    return Number(price) * 1.05;
  }

  onBuyClick() {
    console.log('Botón de comprar clickeado');
  }
  
  onBookClick(book: CatalogBook): void {
    this.router.navigate(['/book-details', book.id]);
  }

  getPageNumbers(): (number | string)[] {
    const currentPage = this.page();
    const total = this.totalPages;
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (currentPage >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  }
}