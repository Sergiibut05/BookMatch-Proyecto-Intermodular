import { Component, inject, OnInit, signal } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '@core/services/catalog.service'; 
import { Header } from '@shared/components/header/header';
import { Carousel } from '@shared/components/carousel/carousel';
import { Footer } from '@shared/components/footer/footer';
import { BookCarousel3dComponent, BookData } from '@shared/components/book-carousel-3d/book-carousel-3d.component';
import { TranslateModule } from '@ngx-translate/core';
import { Category } from '@shared/models';

/**
 * Pantalla principal autenticada.
 *
 * Muestra categorias, accesos rapidos al catalogo/foro/chat y un carrusel
 * destacado de libros para navegacion inicial.
 */
@Component({
  selector: 'app-home',
  imports: [Header, Carousel, Footer, TranslateModule, BookCarousel3dComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  catalogService = inject(CatalogService); 
  private router = inject(Router);

  // Señal para guardar las categorías que vienen del backend
  categories = signal<Category[]>([]);

  // Datos para el carrusel 3D
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

  ngOnInit() {
    this.loadCategories();
  }

  /**
   * Carga categorias principales desde backend para renderizado en home.
   */
  loadCategories() {
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        const mainCategories = cats.filter(c => c.type === 'MAIN');
        this.categories.set(mainCategories);
        console.log('Categorías principales cargadas:', mainCategories); 
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
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

  /**
   * Navega al indice del foro.
   */
  navigateToForum() {
    this.router.navigate(['/foro']);
  }

  /**
   * Navega a la vista global de catalogo por categorias.
   */
  navigateToCatalog() {
    this.router.navigate(['/categories']);
  }

  /**
   * Navega a la funcionalidad de chat con IA.
   */
  goToChat() {
    this.router.navigate(['/ai-chat']);
  }

  /**
   * Hace scroll suave hasta el contenido principal.
   */
  scrollToContent() {
    const el = document.getElementById('home-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}