import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '@core/services/catalog.service';
import { Header } from '@shared/components/header/header';
import { CatalogBook } from '@shared/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  imports: [Header, CommonModule],
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

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const categoriaParam = params.get('categoria');
      if (categoriaParam) {
        this.category.set(categoriaParam);
        this.loadbooks();
      }
    });
  }

  private loadbooks() {
    if(this.category()) {
      this.catalogService.getBooksByCategoryName(this.category().toString(), this.page(), this.limit()).subscribe({
        next: (res: any) => {
          const items = res?.items ?? [];
          this.books.set(items);
          this.total.set(res?.total ?? 0);
        },
        error: (error) => console.error('Error al obtener los libros:', error),
      });
    }
  }

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
      this.loadbooks();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    this.loadbooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleView() {
    this.onGrid.set(!this.onGrid());
  }

  getDiscountedPrice(price: number): number {
    return price * 1.05;
  }

  onBuyClick() {
    // Placeholder para futura funcionalidad
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
      // Si hay 7 o menos páginas, mostrar todas
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Si hay más de 7 páginas, mostrar con elipsis
      if (currentPage <= 3) {
        // Al inicio: 1, 2, 3, 4, ..., total
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      } else if (currentPage >= total - 2) {
        // Al final: 1, ..., total-3, total-2, total-1, total
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // En el medio: 1, ..., current-1, current, current+1, ..., total
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total);
      }
    }

    return pages;
  }
}
