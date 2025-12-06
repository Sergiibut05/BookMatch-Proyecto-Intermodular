import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Comment, CreateCommentDto, UpdateCommentDto } from '@shared/models/comments.model';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
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
   * Obtiene todos los comentarios de un post (devuelve árbol jerárquico)
   */
  getCommentsByPostId(forumId: number, postId: number): Observable<Comment[]> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Comment[]>(`${this.apiUrl}/${forumId}/posts/${postId}/comments`, { headers })
      )
    );
  }

  /**
   * Crea un nuevo comentario
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
        // El backend espera { body: { content: "...", parentId: ... } }
        const payload = { body };

        return this.http.post<Comment>(`${this.apiUrl}/${forumId}/posts/${postId}/comments`, payload, { headers });
      })
    );
  }

  /**
   * Actualiza un comentario existente
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
   * Elimina un comentario
   */
  deleteComment(commentId: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${environment.apiUrl}/comments/${commentId}`, { headers })
      )
    );
  }
}

