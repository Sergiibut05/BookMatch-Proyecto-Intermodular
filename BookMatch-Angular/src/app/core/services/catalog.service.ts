import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CatalogBook, CreateCatalogBookDto, Review, Category } from '@shared/models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Servicio de acceso al catalogo de libros y resenas.
 *
 * Centraliza consultas paginadas, filtros, CRUD de libros y operaciones de
 * valoracion sobre el backend protegido por token.
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/catalog-books`;

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      map(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      })
    );
  }

  /**
   * @returns Observable con la lista de todas las categorías
   *
   * @example
   * ```ts
   * this.catalogService.getCategories().subscribe((categories) => {
   *   this.categories.set(categories);
   * });
   * ```
   */
  getCategories(): Observable<Category[]> {
    return this.authHeaders().pipe(
      switchMap(headers => 
        this.http.get<Category[]>(`${this.apiUrl}/categories`, { headers })
      )
    );
  }

  /**
   * @param id ID del libro a actualizar
   * @param book Datos parciales del libro
   * @returns Observable con el libro actualizado
   *
   * @example
   * ```ts
   * this.catalogService.updateBook(12, { price: 19.99, stock: 7 }).subscribe();
   * ```
   */
  updateBook(id: number, book: Partial<CreateCatalogBookDto>): Observable<CatalogBook> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.patch<CatalogBook>(`${this.apiUrl}/${id}`, book, { headers }))
    );
  }

  /**
   * @param id ID del libro a eliminar
   * @returns Observable vacío cuando se completa la eliminación
   */
  deleteBook(id: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  /**
   * @param categoryId ID de la categoría
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @param minPrice Precio mínimo
   * @param maxPrice Precio máximo
   * @param sortBy Criterio de ordenación
   * @param minRating Valoración mínima
   * @param inStock Solo productos en stock
   * @returns Observable con la lista paginada de libros
   *
   * @example
   * ```ts
   * this.catalogService.getBooksByCategoryId(4, 1, 12, 10, 30, 'price_asc')
   *   .subscribe((result) => this.items.set(result.items));
   * ```
   */
  getBooksByCategoryId(
    categoryId: number, 
    page = 1, 
    limit = 10,
    minPrice?: number | null,
    maxPrice?: number | null,
    sortBy?: string,
    minRating?: number | null,
    inStock?: boolean
  ) {
    return this.authHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams()
          .set('categoryId', categoryId.toString())
          .set('page', page.toString())
          .set('limit', limit.toString());

        if (minPrice) params = params.set('minPrice', minPrice.toString());
        if (maxPrice) params = params.set('maxPrice', maxPrice.toString());
        if (sortBy) params = params.set('sortBy', sortBy);
        if (minRating) params = params.set('minRating', minRating.toString());
        if (inStock) params = params.set('inStock', 'true');

        return this.http.get<{ total: number; page: number; limit: number; items: CatalogBook[] }>(
          this.apiUrl,
          { headers, params }
        );
      })
    );
  }

  /**
   * @param limit Cantidad de novedades a obtener
   * @returns Observable con las novedades ordenadas por fecha
   *
   * @example
   * ```ts
   * this.catalogService.getNewArrivals(8).subscribe(({ items }) => {
   *   this.newArrivals = items;
   * });
   * ```
   */
  getNewArrivals(limit = 10) {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const params = new HttpParams()
          .set('sortBy', 'newest')
          .set('limit', limit.toString());

        return this.http.get<{ total: number; items: CatalogBook[] }>(
          this.apiUrl, 
          { headers, params }
        );
      })
    );
  }

  /**
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @returns Observable con la lista paginada de todos los libros
   */
  getAllBooks(page = 1, limit = 10) {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<{
          total: number;
          page: number;
          limit: number;
          previousPage: number | null;
          nextPage: number | null;
          items: CatalogBook[];
        }>(`${this.apiUrl}?page=${page}&limit=${limit}`, { headers })
      )
    );
  }

  /**
   * @param searchTerm Término de búsqueda
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @returns Observable con los libros que coinciden con la búsqueda
   */
  searchBooks(searchTerm: string, page = 1, limit = 20) {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const params = new HttpParams()
          .set('search', searchTerm)
          .set('page', page.toString())
          .set('limit', limit.toString());

        return this.http.get<{
          total: number;
          page: number;
          limit: number;
          previousPage: number | null;
          nextPage: number | null;
          items: CatalogBook[];
        }>(this.apiUrl, { headers, params });
      })
    );
  }

  /**
   * @param id ID del libro
   * @returns Observable con los detalles del libro
   *
   * @example
   * ```ts
   * this.catalogService.getBookById(822).subscribe((book) => this.book.set(book));
   * ```
   */
  getBookById(id: number): Observable<CatalogBook> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.get<CatalogBook>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  /**
   * @param book Datos del libro a crear
   * @returns Observable con el libro creado
   *
   * @example
   * ```ts
   * this.catalogService.createBook(formValue).subscribe();
   * ```
   */
  createBook(book: CreateCatalogBookDto): Observable<CatalogBook> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.post<CatalogBook>(this.apiUrl, book, { headers }))
    );
  }

  /**
   * @param name Nombre de la categoría
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @param minPrice Precio mínimo
   * @param maxPrice Precio máximo
   * @param sortBy Criterio de ordenación
   * @param minRating Valoración mínima
   * @param inStock Solo productos en stock
   * @returns Observable con la lista paginada de libros de la categoría
   *
   * @example
   * ```ts
   * this.catalogService.getBooksByCategoryName('fantasia', 1, 10, null, 25, 'newest')
   *   .subscribe();
   * ```
   */
  getBooksByCategoryName(
    name: string, 
    page = 1, 
    limit = 10, 
    minPrice?: number | null, 
    maxPrice?: number | null, 
    sortBy?: string,
    minRating?: number | null,
    inStock?: boolean
  ) {
    return this.authHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams()
          .set('categoryNames', name)
          .set('page', page.toString())
          .set('limit', limit.toString());

        if (minPrice) params = params.set('minPrice', minPrice.toString());
        if (maxPrice) params = params.set('maxPrice', maxPrice.toString());
        if (sortBy) params = params.set('sortBy', sortBy);
        
        if (minRating) params = params.set('minRating', minRating.toString());
        if (inStock) params = params.set('inStock', 'true');

        return this.http.get<{ total: number; page: number; limit: number; items: CatalogBook[] }>(
          this.apiUrl,
          { headers, params }
        );
      })
    );
  }

  /**
   * @param bookId ID del libro
   * @param data Datos de la reseña (rating y comentario opcional)
   * @returns Observable con la reseña creada
   *
   * @example
   * ```ts
   * this.catalogService.addReview(822, { rating: 5, comment: 'Muy recomendado' }).subscribe();
   * ```
   */
  addReview(bookId: number, data: { rating: number; comment?: string }): Observable<Review> {
    return this.authHeaders().pipe(
      switchMap(headers => 
        this.http.post<Review>(`${this.apiUrl}/${bookId}/reviews`, data, { headers })
      )
    );
  }

  /**
   * @param reviewId ID de la reseña a eliminar
   * @returns Observable cuando se completa la eliminación
   */
  deleteReview(reviewId: number): Observable<any> {
    return this.authHeaders().pipe(
      switchMap(headers => 
        this.http.delete(`${this.apiUrl}/reviews/${reviewId}`, { headers })
      )
    );
  }
}