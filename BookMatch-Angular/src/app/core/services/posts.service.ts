import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Post, PostsListResponse, CreatePostDto, UpdatePostDto } from '@shared/models/posts.model';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
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
   * Obtiene una lista paginada de posts de un foro específico
   */
  getPostsByForumId(forumId: number, page: number = 1, limit: number = 10, sort: 'newest' | 'score' | 'comments' = 'newest'): Observable<PostsListResponse> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        let params = new HttpParams()
          .set('page', page.toString())
          .set('limit', limit.toString())
          .set('sort', sort);

        return this.http.get<PostsListResponse>(`${this.apiUrl}/${forumId}/posts`, { headers, params });
      })
    );
  }

  /**
   * Obtiene un post específico por ID (requiere forumId)
   */
  getPostById(forumId: number, postId: number): Observable<Post> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Post>(`${this.apiUrl}/${forumId}/posts/${postId}`, { headers })
      )
    );
  }

  /**
   * Crea un nuevo post en un foro
   */
  createPost(forumId: number, data: CreatePostDto): Observable<Post> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        // El backend espera { body: { title: "...", content: "..." } }
        const body: any = {
          title: data.title,
          content: data.content
        };
        const payload = { body };

        return this.http.post<Post>(`${this.apiUrl}/${forumId}/posts`, payload, { headers });
      })
    );
  }

  /**
   * Actualiza un post existente (requiere forumId)
   */
  updatePost(forumId: number, postId: number, data: UpdatePostDto): Observable<Post> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: any = {};
        if (data.title !== undefined) {
          body.title = data.title;
        }
        if (data.content !== undefined) {
          body.content = data.content;
        }
        const payload = { body };

        return this.http.patch<Post>(`${this.apiUrl}/${forumId}/posts/${postId}`, payload, { headers });
      })
    );
  }

  /**
   * Elimina un post (requiere forumId)
   */
  deletePost(forumId: number, postId: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${forumId}/posts/${postId}`, { headers })
      )
    );
  }
}

