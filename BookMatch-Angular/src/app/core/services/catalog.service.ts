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

  getAllBooks(): Observable<CatalogBook[]> {
    return this.authHeaders().pipe(
      switchMap(headers => this.http.get<CatalogBook[]>(this.apiUrl, { headers }))
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
}