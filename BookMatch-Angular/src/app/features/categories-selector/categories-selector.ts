import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '@core/services/catalog.service';
import { Header } from '@shared/components/header/header';
import { Category } from '@shared/models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-categories-selector',
  imports: [Header, CommonModule, TranslateModule],
  templateUrl: './categories-selector.html',
  styleUrl: './categories-selector.scss',
})
export class CategoriesSelector implements OnInit {
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.loadCategories();
  }

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

  get filteredCategories(): Category[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.categories();
    
    return this.categories().filter(cat => 
      cat.name.toLowerCase().includes(query) || 
      cat.slug.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
  }

  get mainCategories(): Category[] {
    return this.filteredCategories.filter(c => c.type === 'MAIN');
  }

  get specialCategories(): Category[] {
    return this.filteredCategories.filter(c => c.type === 'SPECIAL');
  }

  
  getParentCategoryName(subcategory: Category): string | null {
    if (!subcategory.parentId) return null;
    const parent = this.categories().find(c => c.id === subcategory.parentId);
    return parent ? parent.name : null;
  }

  navigateToCategory(category: Category) {
    this.router.navigate(['/categories', category.slug]);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}
