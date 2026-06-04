import { Component, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { markNavBack } from '../../../app.config';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { IsAdminDirective } from '@core/directives/is-admin.directive';

import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../language-selector/language-selector';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * Cabecera global de la aplicacion.
 *
 * Gestiona navegacion principal, buscador contextual (libros/foro),
 * estado de menu movil y accesos a perfil, carrito y cierre de sesion.
 *
 * @example
 * ```html
 * <app-header />
 * ```
 */
@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, LanguageSelectorComponent, TranslateModule, FormsModule, IsAdminDirective],
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
  searchTypeFromParams = signal<'book' | 'forum' | 'trade' | null>(null);
  
  isHeaderHidden = signal(false);
  isAtTop = signal(true);
  private lastScroll = 0;
  private readonly desktopMediaQuery = window.matchMedia('(min-width: 768px)');

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;

    this.isAtTop.set(currentScroll <= 50);

    if (this.desktopMediaQuery.matches) {
      if (currentScroll <= 50) {
        this.isHeaderHidden.set(false);
      } else if (currentScroll > this.lastScroll && currentScroll > 80) {
        this.isHeaderHidden.set(true);
      } else if (currentScroll < this.lastScroll) {
        this.isHeaderHidden.set(false);
      }
    } else {
      this.isHeaderHidden.set(false);
    }

    this.lastScroll = currentScroll;
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    if (!this.desktopMediaQuery.matches) {
      this.isHeaderHidden.set(false);
    }
  }

  /**
   * Desplaza la página al inicio con suavidad y hace foco en el buscador móvil.
   */
  scrollToTopAndFocusSearch(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 350);
  }

  isForumRoute = computed(() => {
    const url = this.currentUrl();
    const searchType = this.searchTypeFromParams();
    
    if (url.startsWith('/search-results')) {
      return searchType === 'forum';
    }
    
    return url.startsWith('/foro');
  });

  isTradeRoute = computed(() => {
    const url = this.currentUrl();
    const searchType = this.searchTypeFromParams();

    if (url.startsWith('/search-results')) {
      return searchType === 'trade';
    }

    return url.startsWith('/trueque');
  });

  searchPlaceholder = computed(() => {
    if (this.isForumRoute()) return 'HEADER.SEARCH_FORUMS_PLACEHOLDER';
    if (this.isTradeRoute()) return 'HEADER.SEARCH_TRADES_PLACEHOLDER';
    return 'HEADER.SEARCH_BOOKS_PLACEHOLDER';
  });

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentUrl.set(event.url);
        this.updateSearchTypeFromUrl();
      });
    
    this.currentUrl.set(this.router.url);
    this.updateSearchTypeFromUrl();

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

  /**
   * Lee la URL actual y ajusta el tipo de busqueda contextual.
   */
  private updateSearchTypeFromUrl(): void {
    const url = this.router.url;
    if (url.startsWith('/search-results')) {
      const urlTree = this.router.parseUrl(url);
      const type = urlTree.queryParams['type'];
      if (type === 'forum') {
        this.searchTypeFromParams.set('forum');
        return;
      }
      if (type === 'trade') {
        this.searchTypeFromParams.set('trade');
        return;
      }
      this.searchTypeFromParams.set('book');
    } else {
      this.searchTypeFromParams.set(null);
    }
  }

  /**
   * Alterna apertura/cierre del menu movil.
   */
  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  /**
   * Cierra menu movil.
   */
  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  /**
   * Cierra sesion y redirige a login.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Navega al perfil del usuario.
   */
  goProfile() {
    this.router.navigate(['/profile'])
  }

  /**
   * Navega a home.
   */
  goHome() {
    markNavBack();
    this.router.navigate(['/home']);
  }

  /**
   * Navega al carrito.
   */
  goCart() {
    this.router.navigate(['/cart'])
  }

  /**
   * Navega al foro principal.
   */
  goForum() {
    this.router.navigate(['/foro']);
    this.closeMenu();
  }

  /**
   * Lanza busqueda segun contexto (libros o foro).
   */
  onSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    const searchType = this.isForumRoute() ? 'forum' : this.isTradeRoute() ? 'trade' : 'book';
    this.router.navigate(['/search-results'], {
      queryParams: { q: query, type: searchType }
    });
    this.searchQuery.set('');
  }

  /**
   * Ejecuta busqueda al pulsar Enter.
   */
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

}