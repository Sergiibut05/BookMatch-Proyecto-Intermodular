import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogBook, CreateCatalogBookDto } from '@shared/models';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/catalog';

  getAllBooks(): Observable<CatalogBook[]> {
    return this.http.get<CatalogBook[]>(this.apiUrl);
  }

  getBookById(id: number): Observable<CatalogBook> {
    return this.http.get<CatalogBook>(`${this.apiUrl}/${id}`);
  }

  createBook(book: CreateCatalogBookDto): Observable<CatalogBook> {
    return this.http.post<CatalogBook>(this.apiUrl, book);
  }
}