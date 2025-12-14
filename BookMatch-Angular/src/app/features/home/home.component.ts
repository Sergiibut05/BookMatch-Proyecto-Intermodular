import { Component, inject, OnInit, signal } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '@core/services/catalog.service'; // <--- Importado
import { Header } from '@shared/components/header/header';
import { Carousel } from '@shared/components/carousel/carousel';
import { Footer } from '@shared/components/footer/footer';
import { TranslateModule } from '@ngx-translate/core';
import { Category } from '@shared/models'; // <--- Importado

@Component({
  selector: 'app-home',
  imports: [Header, Carousel, Footer, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  catalogService = inject(CatalogService); // <--- Inyectado
  private router = inject(Router);

  // Señal para guardar las categorías que vienen del backend
  categories = signal<Category[]>([]);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        // Debug: Verifica en la consola qué IDs llegan
        console.log('Categorías cargadas del backend:', cats); 
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  // Helper para buscar el ID de una categoría por su slug (ej: "ciencia-ficcion")
  getCategoryId(slug: string): number | undefined {
    const category = this.categories().find(c => c.slug === slug);
    return category ? category.id : undefined;
  }
}