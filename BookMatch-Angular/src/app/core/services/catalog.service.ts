import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CatalogBook, CreateCatalogBookDto } from '@shared/models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/catalog-books';

  private authHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getToken()).pipe(
      map(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      })
    );
  }

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

  getBookById(id: number): Observable<CatalogBook> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.get<CatalogBook>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  createBook(book: CreateCatalogBookDto): Observable<CatalogBook> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.post<CatalogBook>(this.apiUrl, book, { headers }))
    );
  }

  getBooksByCategoryName(name: string, page = 1, limit = 10) {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<{ total: number; page: number; limit: number; items: CatalogBook }>(
          `${this.apiUrl}?categoryNames=${encodeURIComponent(name)}&page=${page}&limit=${limit}`,
          { headers }
        )
      )
    );
  }
}