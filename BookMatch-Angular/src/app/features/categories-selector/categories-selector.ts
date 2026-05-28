import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '@core/services/catalog.service';
import { Header } from '@shared/components/header/header';
import { Category } from '@shared/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Selector de categorías: carga categorías (MAIN primero), búsqueda y navegación a /categories.
 */
@Component({
  selector: 'app-categories-selector',
  imports: [Header, CommonModule, TranslateModule],
  templateUrl: './categories-selector.html',
  styleUrl: './categories-selector.scss',
})
export class CategoriesSelector implements OnInit {
  private catalogService = inject(CatalogService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  /** Lista de categorías (MAIN primero, luego orden por nombre). */
  categories = signal<Category[]>([]);
  /** Texto de búsqueda para filtrar categorías. */
  searchQuery = signal<string>('');

  /** Carga categorías al iniciar. */
  ngOnInit() {
    this.loadCategories();
  }

  /** Obtiene categorías y las ordena. */
  loadCategories() {
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        
        const sorted = [...cats].sort((a, b) => {
          if (a.type === 'MAIN' && b.type !== 'MAIN') return -1;
          if (a.type !== 'MAIN' && b.type === 'MAIN') return 1;
          return a.name.localeCompare(b.name);
        });
        this.categories.set(sorted);
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  /** Categorías filtradas por searchQuery. */
  get filteredCategories(): Category[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.categories();
    
    return this.categories().filter(cat => 
      cat.name.toLowerCase().includes(query) || 
      cat.slug.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
  }

  /** Categorías de tipo MAIN. */
  get mainCategories(): Category[] {
    return this.filteredCategories.filter(c => c.type === 'MAIN');
  }

  /** Categorías de tipo SPECIAL. */
  get specialCategories(): Category[] {
    return this.filteredCategories.filter(c => c.type === 'SPECIAL');
  }

  /** Nombre de la categoría padre si tiene parentId. */
  getParentCategoryName(subcategory: Category): string | null {
    if (!subcategory.parentId) return null;
    const parent = this.categories().find(c => c.id === subcategory.parentId);
    return parent ? parent.name : null;
  }

  /** Nombre de la categoría padre traducido si tiene parentId. */
  getParentCategoryDisplayName(subcategory: Category): string | null {
    if (!subcategory.parentId) return null;
    const parent = this.categories().find(c => c.id === subcategory.parentId);
    if (!parent) return null;
    return this.getCategoryDisplayName(parent);
  }

  /** Navega a la ruta de la categoría. */
  navigateToCategory(category: Category) {
    this.router.navigate(['/categories', category.slug]);
  }

  /** Devuelve el nombre de la categoría traducido al idioma actual. */
  getCategoryDisplayName(category: Category): string {
    const key = 'CATEGORY_NAMES.' + category.slug;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : category.name;
  }

  /** Actualiza searchQuery con el valor del input. */
  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}
