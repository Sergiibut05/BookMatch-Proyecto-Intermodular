import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  
  category = signal<string>('');
  books = signal<CatalogBook[]>([]);
  page = signal<number>(1);
  limit = signal<number>(10);
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
        },
        error: (error) => console.error('Error al obtener los libros:', error),
      });
    }
  }

  onLimitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.limit.set(Number(target.value));
    this.page.set(1);
    this.loadbooks();
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
}
