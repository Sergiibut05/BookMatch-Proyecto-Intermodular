import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  viewChild,
  afterNextRender,
  EffectRef,
  effect,
  Injector,
  runInInjectionContext,
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogQueryService } from '@core/services/catalog-query.service';
import { Header } from '@shared/components/header/header';
import { Carousel } from '@shared/components/carousel/carousel';
import { Footer } from '@shared/components/footer/footer';
import { BookCarousel3dComponent, BookData } from '@shared/components/book-carousel-3d/book-carousel-3d.component';
import { TranslateModule } from '@ngx-translate/core';
import { Category } from '@shared/models';
import lottie, { type AnimationItem } from 'lottie-web';

/**
 * Pantalla principal autenticada.
 *
 * Muestra categorias, accesos rapidos al catalogo/foro/chat y un carrusel
 * destacado de libros para navegacion inicial.
 *
 * Las categorías se cargan con @ngneat/query (CatalogQueryService):
 *  - La query de categorías se activa al llegar al #home-content (IntersectionObserver).
 *  - Si el usuario ya visitó el home, las categorías se sirven desde caché (sin request de red).
 */
@Component({
  selector: 'app-home',
  imports: [Header, Carousel, Footer, TranslateModule, BookCarousel3dComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private catalogQueryService = inject(CatalogQueryService);
  private router = inject(Router);
  private injector = inject(Injector);

  private lottieContainer = viewChild<ElementRef<HTMLDivElement>>('lottieChat');
  private lottieAnim: AnimationItem | null = null;
  private isHovering = false;

  private categoriesObserver: IntersectionObserver | null = null;
  private categoriesEffectRef: EffectRef | null = null;

  private categoriesQuery: ReturnType<CatalogQueryService['getCategories']> | null = null;

  /**
   * Categorías principales — se actualizan vía effect() cuando la query resuelve.
   * Excluye los slugs que no deben aparecer como secciones principales en el home.
   */
  categories = signal<Category[]>([]);

  /**
   * Saludo dependiente de la hora del dia.
   * Se calcula una sola vez al construir el componente — el usuario no va a
   * estar en el home cuando cambien las horas, no merece la pena reactividad.
   */
  readonly timeGreetingKey = (() => {
    const h = new Date().getHours();
    if (h < 6)  return 'HOME.GREETING.NIGHT';
    if (h < 13) return 'HOME.GREETING.MORNING';
    if (h < 20) return 'HOME.GREETING.AFTERNOON';
    return 'HOME.GREETING.NIGHT';
  })();

  /** Primer nombre del usuario para el saludo (ej. "Sergii Butrii" -> "Sergii"). */
  firstName(): string {
    const full = this.authService.currentUser()?.fullName ?? '';
    return full.trim().split(/\s+/)[0] || '';
  }

  featuredBooks: BookData[] = [
    {
      title: "A Winter's Embrace",
      author: "Deen Peer",
      coverImage: "assets/book-covers/book1.jpg",
      url: '/book-details/822'
    },
    {
      title: "The Frightened Phantom",
      author: "Dan Lockes",
      coverImage: "assets/book-covers/book2.jpg",
      url: '/book-details/823'
    },
    {
      title: "The Journey of a Solo Backpacker",
      author: "Anita Pest",
      coverImage: "assets/book-covers/book3.jpg",
      url: '/book-details/824'
    },
    {
      title: "Barnaby the Bear's Big Circus Dream",
      author: "Peter Dandy",
      coverImage: "assets/book-covers/book4.jpg",
      url: '/book-details/825'
    },
    {
      title: "Autumn's Little Joy",
      author: "Diana Simmons",
      coverImage: "assets/book-covers/book5.jpg",
      url: '/book-details/826'
    }
  ];

  constructor() {
    afterNextRender(() => {
      this.initLottie();
      this.initCategoriesObserver();
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.lottieAnim?.destroy();
    this.categoriesObserver?.disconnect();
    this.categoriesObserver = null;
    this.categoriesEffectRef?.destroy();
    this.categoriesEffectRef = null;
  }

  private initLottie() {
    const container = this.lottieContainer()?.nativeElement;
    if (!container) return;

    this.lottieAnim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: 'assets/animations/chat-book.json',
    });
  }

  /**
   * Activa la query de categorías cuando el #home-content entra en el viewport.
   * Si el usuario ya visitó el home, @ngneat/query sirve la respuesta desde caché.
   */
  private initCategoriesObserver() {
    const target = document.getElementById('home-content');
    const activate = () => {
      // El IntersectionObserver corre fuera del injection context.
      // query.result() llama toSignal() internamente y debe invocarse fuera de un
      // contexto reactivo pero dentro de un injection context. El effect solo lee el signal.
      runInInjectionContext(this.injector, () => {
        this.categoriesQuery = this.catalogQueryService.getCategories();
        const resultSignal = this.categoriesQuery.result; // Signal, no llamarlo aquí
        this.categoriesEffectRef = effect(() => {
          const result = resultSignal();
          if (result.data) {
            const all = result.data as Category[];
            this.categories.set(all.filter(c => c.type === 'MAIN'));
          }
        });
      });
    };

    if (!target) {
      activate();
      return;
    }

    this.categoriesObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          activate();
          this.categoriesObserver?.disconnect();
          this.categoriesObserver = null;
        }
      },
      { rootMargin: '300px', threshold: 0.01 }
    );
    this.categoriesObserver.observe(target);
  }

  onChatHover(hovering: boolean) {
    this.isHovering = hovering;
    if (!this.lottieAnim) return;

    if (hovering) {
      this.lottieAnim.setDirection(1);
      this.lottieAnim.play();
    } else {
      this.lottieAnim.setDirection(-1);
      this.lottieAnim.play();
    }
  }

  /**
   * Obtiene el id de categoria a partir de su slug.
   */
  getCategoryId(slug: string): number | undefined {
    const category = this.categories().find(c => c.slug === slug);
    return category ? category.id : undefined;
  }

  /**
   * Devuelve categorias principales visibles en la portada.
   */
  getMainCategories(): Category[] {
    return this.categories().filter(c => c.slug !== 'novedades' && c.slug !== 'romance');
  }

  /** Navega al indice del foro. */
  navigateToForum() {
    this.router.navigate(['/foro']);
  }

  /** Navega a la vista global de catalogo por categorias. */
  navigateToCatalog() {
    this.router.navigate(['/categories']);
  }

  /** Navega a la funcionalidad de chat con IA. */
  goToChat() {
    this.router.navigate(['/ai-chat']);
  }

  /** Hace scroll suave hasta el contenido principal. */
  scrollToContent() {
    const el = document.getElementById('home-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}