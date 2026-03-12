import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Tipos de voto soportados por el sistema de foro.
 */
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

export interface VoteScoreResponse {
  score: number;
}

/**
 * Servicio de votos de publicaciones.
 *
 * Permite consultar el voto del usuario, crear/actualizar voto y retirarlo.
 */
@Injectable({
  providedIn: 'root'
})
export class VotesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/forums`;

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
   * @param forumId ID del foro
   * @param postId ID del post
   * @returns Observable con el voto del usuario o null si no ha votado
   *
   * @example
   * ```ts
   * this.votesService.getUserVote(forumId, postId).subscribe((vote) => {
   *   this.userVote = vote?.type ?? null;
   * });
   * ```
   */
  getUserVote(forumId: number, postId: number): Observable<Vote | null> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Vote | null>(`${this.apiUrl}/${forumId}/posts/${postId}/votes`, { headers }).pipe(
          catchError(err => {
            if (err.status === 404) {
              return of(null);
            }
            return of(null);
          })
        )
      )
    );
  }

  /**
   * @param forumId ID del foro
   * @param postId ID del post
   * @param voteType Tipo de voto (UP o DOWN)
   * @returns Observable con el nuevo score del post
   *
   * @example
   * ```ts
   * this.votesService.upsertVote(forumId, postId, 'UP').subscribe(({ score }) => {
   *   this.score = score;
   * });
   * ```
   */
  upsertVote(forumId: number, postId: number, voteType: VoteType): Observable<VoteScoreResponse> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: CreateVoteDto = {
          type: voteType
        };
        const payload = { body };

        return this.http.post<VoteScoreResponse>(`${this.apiUrl}/${forumId}/posts/${postId}/votes`, payload, { headers });
      })
    );
  }

  /**
   * @param forumId ID del foro
   * @param postId ID del post
   * @returns Observable con el nuevo score del post
   */
  deleteVote(forumId: number, postId: number): Observable<VoteScoreResponse> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<VoteScoreResponse>(`${this.apiUrl}/${forumId}/posts/${postId}/votes`, { headers })
      )
    );
  }
}

