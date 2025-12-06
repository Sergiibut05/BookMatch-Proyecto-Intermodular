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
   * Obtiene una lista paginada de foros
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

        console.log('🌐 Llamando a:', this.apiUrl);
        console.log('📋 Parámetros:', { page, limit, search });
        console.log('🔑 Headers:', headers.keys());

        return this.http.get<ForumsListResponse>(this.apiUrl, { headers, params }).pipe(
          map(response => {
            console.log('📦 Respuesta raw del backend:', response);
            console.log('📊 Total de foros:', response.total);
            console.log('📄 Página actual:', response.page);
            console.log('📑 Total de páginas:', response.totalPages);
            console.log('📚 Items recibidos:', response.items?.length || 0);
            if (response.items && response.items.length > 0) {
              console.log('🔍 Primer foro:', response.items[0]);
            }
            return response;
          })
        );
      })
    );
  }

  /**
   * Obtiene un foro específico por ID
   */
  getForumById(id: number): Observable<Forum> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Forum>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }

  /**
   * Crea un nuevo foro
   */
  createForum(data: CreateForumDto): Observable<Forum> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        console.log('📤 Creando foro con datos:', data);
        console.log('🔑 Headers:', headers.keys());
        
        // Construir el body según lo que espera el backend
        const body: any = {
          title: data.title
        };
        if (data.description && data.description.trim()) {
          body.description = data.description.trim();
        }
        
        // El backend espera { body: { title: "...", description: "..." } }
        const payload = { body };
        
        console.log('📦 Payload final:', payload);
        
        return this.http.post<Forum>(this.apiUrl, payload, { headers });
      })
    );
  }

  /**
   * Actualiza un foro existente
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
        // El backend espera { body: { title: "...", description: "..." } }
        const payload = { body };
        
        return this.http.patch<Forum>(`${this.apiUrl}/${id}`, payload, { headers });
      })
    );
  }

  /**
   * Elimina un foro
   */
  deleteForum(id: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }
}

