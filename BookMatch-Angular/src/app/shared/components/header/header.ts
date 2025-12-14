import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';

import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../language-selector/language-selector';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, LanguageSelectorComponent, TranslateModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  isMenuOpen = signal(false);
  searchQuery = signal<string>('');
  currentUrl = signal<string>('');
  searchTypeFromParams = signal<'book' | 'forum' | null>(null);

  // Determina si estamos en una ruta de foro o en search-results con type=forum
  isForumRoute = computed(() => {
    const url = this.currentUrl();
    const searchType = this.searchTypeFromParams();
    
    // Si estamos en search-results, usar el tipo del query param
    if (url.startsWith('/search-results')) {
      return searchType === 'forum';
    }
    
    // Si no, usar la ruta normal
    return url.startsWith('/foro');
  });

  // Placeholder contextual
  searchPlaceholder = computed(() => {
    return this.isForumRoute() 
      ? 'HEADER.SEARCH_FORUMS_PLACEHOLDER' 
      : 'HEADER.SEARCH_BOOKS_PLACEHOLDER';
  });

  ngOnInit(): void {
    // Suscribirse a cambios de ruta
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentUrl.set(event.url);
        this.updateSearchTypeFromUrl();
      });
    
    // Inicializar con la ruta actual
    this.currentUrl.set(this.router.url);
    this.updateSearchTypeFromUrl();

    // Suscribirse a cambios en query params
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateSearchTypeFromUrl();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSearchTypeFromUrl(): void {
    const url = this.router.url;
    if (url.startsWith('/search-results')) {
      // Extraer el query param type de la URL usando el router
      const urlTree = this.router.parseUrl(url);
      const type = urlTree.queryParams['type'];
      this.searchTypeFromParams.set(type === 'forum' ? 'forum' : 'book');
    } else {
      this.searchTypeFromParams.set(null);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  goProfile() {
    this.router.navigate(['/profile'])
  }

  goHome() {
    this.router.navigate(['/home'])
  }

  goCart() {
    this.router.navigate(['/cart'])
  }

  goForum() {
    this.router.navigate(['/foro']);
    this.closeMenu();
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    // Usar el tipo determinado por el contexto (ruta o query params)
    const searchType = this.isForumRoute() ? 'forum' : 'book';
    this.router.navigate(['/search-results'], {
      queryParams: { q: query, type: searchType }
    });
    // Limpiar el input después de buscar
    this.searchQuery.set('');
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

}