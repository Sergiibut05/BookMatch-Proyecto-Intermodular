import { Component, inject, OnInit, signal } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '@core/services/catalog.service'; 
import { Header } from '@shared/components/header/header';
import { Carousel } from '@shared/components/carousel/carousel';
import { Footer } from '@shared/components/footer/footer';
import { AiChatModalComponent } from '@shared/components/ai-chat-modal/ai-chat-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { Category } from '@shared/models'; 

@Component({
  selector: 'app-home',
  imports: [Header, Carousel, Footer, AiChatModalComponent, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  catalogService = inject(CatalogService); 
  private router = inject(Router);

  // Señal para guardar las categorías que vienen del backend
  categories = signal<Category[]>([]);

  ngOnInit() {
    this.loadCategories();
  }

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

  getCategoryId(slug: string): number | undefined {
    const category = this.categories().find(c => c.slug === slug);
    return category ? category.id : undefined;
  }

  getMainCategories(): Category[] {
    return this.categories().filter(c => c.slug !== 'novedades' && c.slug !== 'romance');
  }

  navigateToForum() {
    this.router.navigate(['/foro']);
  }

  navigateToCatalog() {
    this.router.navigate(['/categories']);
  }
}