import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export type VoteType = 'UP' | 'DOWN';

export interface Vote {
  id: number;
  userId: number;
  postId: number;
  type: VoteType;
}

export interface CreateVoteDto {
  type: VoteType;
}

@Injectable({
  providedIn: 'root'
})
export class VotesService {
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
   * Obtiene el voto del usuario actual para un post específico
   */
  getUserVote(forumId: number, postId: number): Observable<Vote | null> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Vote | null>(`${this.apiUrl}/${forumId}/posts/${postId}/votes`, { headers }).pipe(
          catchError(err => {
            // Si es 404, significa que no hay voto (no es un error)
            if (err.status === 404) {
              return of(null);
            }
            // Para otros errores, también retornar null para no bloquear
            console.warn(`Error obteniendo voto para post ${postId}:`, err);
            return of(null);
          })
        )
      )
    );
  }

  /**
   * Crea o actualiza un voto para un post
   */
  upsertVote(forumId: number, postId: number, voteType: VoteType): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: CreateVoteDto = {
          type: voteType
        };
        const payload = { body };

        return this.http.post<void>(`${this.apiUrl}/${forumId}/posts/${postId}/votes`, payload, { headers });
      })
    );
  }

  /**
   * Elimina el voto del usuario para un post
   */
  deleteVote(forumId: number, postId: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${forumId}/posts/${postId}/votes`, { headers })
      )
    );
  }
}

