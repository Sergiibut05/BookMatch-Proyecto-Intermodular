import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Comment, CreateCommentDto, UpdateCommentDto } from '@shared/models/comments.model';

/**
 * Servicio para comentarios jerarquicos en posts del foro.
 */
@Injectable({
  providedIn: 'root'
})
export class CommentsService {
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
   * @returns Observable con el árbol jerárquico de comentarios
   *
   * @example
   * ```ts
   * this.commentsService.getCommentsByPostId(forumId, postId).subscribe();
   * ```
   */
  getCommentsByPostId(forumId: number, postId: number): Observable<Comment[]> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Comment[]>(`${this.apiUrl}/${forumId}/posts/${postId}/comments`, { headers })
      )
    );
  }

  /**
   * @param forumId ID del foro
   * @param postId ID del post
   * @param data Datos del comentario
   * @returns Observable con el comentario creado
   *
   * @example
   * ```ts
   * this.commentsService.createComment(forumId, postId, { content: 'Totalmente de acuerdo' }).subscribe();
   * ```
   */
  createComment(forumId: number, postId: number, data: CreateCommentDto): Observable<Comment> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: any = {
          content: data.content
        };
        if (data.parentId) {
          body.parentId = data.parentId;
        }
        const payload = { body };

        return this.http.post<Comment>(`${this.apiUrl}/${forumId}/posts/${postId}/comments`, payload, { headers });
      })
    );
  }

  /**
   * @param commentId ID del comentario
   * @param data Datos a actualizar
   * @returns Observable con el comentario actualizado
   */
  updateComment(commentId: number, data: UpdateCommentDto): Observable<Comment> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: any = {};
        if (data.content !== undefined) {
          body.content = data.content;
        }
        const payload = { body };

        return this.http.patch<Comment>(`${environment.apiUrl}/comments/${commentId}`, payload, { headers });
      })
    );
  }

  /**
   * @param commentId ID del comentario a eliminar
   * @returns Observable vacío cuando se completa la eliminación
   */
  deleteComment(commentId: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${environment.apiUrl}/comments/${commentId}`, { headers })
      )
    );
  }
}

