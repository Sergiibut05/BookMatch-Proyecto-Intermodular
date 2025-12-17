import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Forum, ForumsListResponse, CreateForumDto, UpdateForumDto } from '@shared/models/forums.model';

@Injectable({
  providedIn: 'root'
})
export class ForumsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/forums`;

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
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @param search Término de búsqueda opcional
   * @returns Observable con la lista paginada de foros
   */
  getForums(page: number = 1, limit: number = 10, search?: string): Observable<ForumsListResponse> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams()
          .set('page', page.toString())
          .set('limit', limit.toString());
        
        if (search) {
          params = params.set('search', search);
        }

        return this.http.get<ForumsListResponse>(this.apiUrl, { headers, params });
      })
    );
  }

  /**
   * @param id ID del foro
   * @returns Observable con los detalles del foro
   */
  getForumById(id: number): Observable<Forum> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Forum>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }

  /**
   * @param data Datos del foro a crear
   * @returns Observable con el foro creado
   */
  createForum(data: CreateForumDto): Observable<Forum> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: any = {
          title: data.title
        };
        if (data.description && data.description.trim()) {
          body.description = data.description.trim();
        }
        
        const payload = { body };
        
        return this.http.post<Forum>(this.apiUrl, payload, { headers });
      })
    );
  }

  /**
   * @param id ID del foro
   * @param data Datos a actualizar
   * @returns Observable con el foro actualizado
   */
  updateForum(id: number, data: UpdateForumDto): Observable<Forum> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: any = {};
        if (data.title !== undefined) {
          body.title = data.title;
        }
        if (data.description !== undefined) {
          body.description = data.description;
        }
        const payload = { body };
        
        return this.http.patch<Forum>(`${this.apiUrl}/${id}`, payload, { headers });
      })
    );
  }

  /**
   * @param id ID del foro a eliminar
   * @returns Observable vacío cuando se completa la eliminación
   */
  deleteForum(id: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }
}

