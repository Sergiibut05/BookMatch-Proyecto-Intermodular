import { Injectable, inject } from '@angular/core';
import { injectQuery } from '@ngneat/query';
import { CatalogService } from './catalog.service';

/**
 * Servicio de consultas al catálogo con caché automática vía @ngneat/query.
 *
 * Envuelve CatalogService con injectQuery para obtener:
 *  - Deduplicación: múltiples carruseles con el mismo categoryId comparten una sola request.
 *  - Caché stale-while-revalidate: datos disponibles instantáneamente al navegar de vuelta al home.
 *  - Reintentos automáticos y estado de loading/error reactivo mediante signals.
 *
 * Las query keys siguen el patrón: ['catalog', <tipo>, ...params]
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogQueryService {
  private catalogService = inject(CatalogService);
  private query = injectQuery();

  /**
   * Query de categorías principales.
   * Clave: ['catalog', 'categories']
   */
  getCategories() {
    return this.query({
      queryKey: ['catalog', 'categories'] as const,
      queryFn: () => this.catalogService.getCategories(),
    });
  }

  /**
   * Query de novedades.
   * Clave: ['catalog', 'new-arrivals', limit]
   */
  getNewArrivals(limit = 10) {
    return this.query({
      queryKey: ['catalog', 'new-arrivals', limit] as const,
      queryFn: () => this.catalogService.getNewArrivals(limit),
    });
  }

  /**
   * Query de libros por ID de categoría.
   * Clave: ['catalog', 'category-id', categoryId, page, limit]
   */
  getBooksByCategoryId(categoryId: number, page = 1, limit = 10) {
    return this.query({
      queryKey: ['catalog', 'category-id', categoryId, page, limit] as const,
      queryFn: () => this.catalogService.getBooksByCategoryId(categoryId, page, limit),
    });
  }

  /**
   * Query de libros por nombre/slug de categoría.
   * Clave: ['catalog', 'category-name', name, page, limit]
   */
  getBooksByCategoryName(name: string, page = 1, limit = 10) {
    return this.query({
      queryKey: ['catalog', 'category-name', name, page, limit] as const,
      queryFn: () => this.catalogService.getBooksByCategoryName(name, page, limit),
    });
  }

  /**
   * Query de detalle de libro por ID.
   * Clave: ['catalog', 'book', id]
   */
  getBookById(id: number) {
    return this.query({
      queryKey: ['catalog', 'book', id] as const,
      queryFn: () => this.catalogService.getBookById(id),
    });
  }
}
