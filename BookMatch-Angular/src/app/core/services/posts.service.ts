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
   * @param forumId ID del foro
   * @param page Número de página
   * @param limit Cantidad de resultados por página
   * @param sort Criterio de ordenación
   * @returns Observable con la lista paginada de posts
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
   * @param forumId ID del foro
   * @param postId ID del post
   * @returns Observable con los detalles del post
   */
  getPostById(forumId: number, postId: number): Observable<Post> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<Post>(`${this.apiUrl}/${forumId}/posts/${postId}`, { headers })
      )
    );
  }

  /**
   * @param forumId ID del foro
   * @param data Datos del post a crear
   * @returns Observable con el post creado
   */
  createPost(forumId: number, data: CreatePostDto): Observable<Post> {
    return this.authHeaders().pipe(
      switchMap(headers => {
        const body: any = {
          title: data.title,
          content: data.content
        };
        if (data.images && data.images.length > 0) {
          body.images = data.images;
        }
        const payload = { body };

        return this.http.post<Post>(`${this.apiUrl}/${forumId}/posts`, payload, { headers });
      })
    );
  }

  /**
   * @param forumId ID del foro
   * @param postId ID del post
   * @param data Datos a actualizar
   * @returns Observable con el post actualizado
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
   * @param forumId ID del foro
   * @param postId ID del post a eliminar
   * @returns Observable vacío cuando se completa la eliminación
   */
  deletePost(forumId: number, postId: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${forumId}/posts/${postId}`, { headers })
      )
    );
  }
}

