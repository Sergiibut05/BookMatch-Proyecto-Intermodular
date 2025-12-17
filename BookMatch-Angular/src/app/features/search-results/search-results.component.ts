import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Header } from '@shared/components/header/header';
import { CatalogService } from '@core/services/catalog.service';
import { ForumsService } from '@core/services/forums.service';
import { CatalogBook } from '@shared/models';
import { Forum } from '@shared/models/forums.model';

@Component({
  selector: 'app-search-results',
  imports: [CommonModule, Header, TranslateModule],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private forumsService = inject(ForumsService);

  searchQuery = signal<string>('');
  searchType = signal<'book' | 'forum'>('book');
  
  books = signal<CatalogBook[]>([]);
  forums = signal<Forum[]>([]);
  
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalResults = signal<number>(0);
  limit = 20;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const query = params['q'] || '';
      const type = params['type'] || 'book';
      
      this.searchQuery.set(query);
      this.searchType.set(type === 'forum' ? 'forum' : 'book');
      this.currentPage.set(1);
      
      if (query) {
        this.performSearch();
      } else {
        this.isLoading.set(false);
        this.error.set('No se proporcionó un término de búsqueda');
      }
    });
  }

  performSearch(): void {
    const query = this.searchQuery();
    if (!query) return;

    this.isLoading.set(true);
    this.error.set(null);

    if (this.searchType() === 'book') {
      this.searchBooks(query);
    } else {
      this.searchForums(query);
    }
  }

  searchBooks(query: string): void {
    this.catalogService.searchBooks(query, this.currentPage(), this.limit).subscribe({
      next: (response) => {
        this.books.set(response.items || []);
        this.totalResults.set(response.total || 0);
        this.totalPages.set(Math.ceil((response.total || 0) / this.limit));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error buscando libros:', err);
        this.error.set('Error al buscar libros');
        this.isLoading.set(false);
      }
    });
  }

  searchForums(query: string): void {
    this.forumsService.getForums(this.currentPage(), this.limit, query).subscribe({
      next: (response) => {
        this.forums.set(response.items || []);
        this.totalResults.set(response.total || 0);
        this.totalPages.set(response.totalPages || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error buscando foros:', err);
        this.error.set('Error al buscar foros');
        this.isLoading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.performSearch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToBook(bookId: number): void {
    this.router.navigate(['/book-details', bookId]);
  }

  goToForum(forumId: number): void {
    this.router.navigate(['/foro', forumId]);
  }

  getCreatorName(forum: Forum): string {
    return forum.creator?.fullName || 'Usuario';
  }

  getCreatorAvatar(forum: Forum): string | null {
    return forum.creator?.avatarUrl || null;
  }

  getTotalPosts(forum: Forum): number {
    return forum._count?.posts || 0;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}

