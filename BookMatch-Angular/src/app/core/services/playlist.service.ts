import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import {
  AddPlaylistItemDto,
  CreatePlaylistDto,
  GeneratePlaylistWithAiDto,
  Playlist,
  PlaylistExportFormat,
  PlaylistItem,
  PlaylistListQuery,
  PlaylistListResponse,
  ReorderPlaylistItemsDto,
  ReorderPlaylistItemsResponse,
  UpdatePlaylistDto,
  UpdatePlaylistItemDto,
} from '@shared/models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Servicio de acceso a la API `/api/playlists`.
 *
 * Sigue el patrón de `CatalogService`: inyecta el token Firebase de `AuthService`
 * en cada request y mantiene una caché ligera con Angular signals.
 */
@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl.slice(0, -1)
    : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/playlists`;

  private readonly playlistsSignal = signal<Playlist[]>([]);
  private readonly selectedPlaylistSignal = signal<Playlist | null>(null);

  /** Listado cacheado de la última petición `list`. */
  readonly playlists = computed(() => this.playlistsSignal());
  /** Playlist actualmente seleccionada (última leída o modificada). */
  readonly selectedPlaylist = computed(() => this.selectedPlaylistSignal());

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      map((token) => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      }),
    );
  }

  private toParams(query?: PlaylistListQuery): HttpParams {
    let params = new HttpParams();
    if (!query) return params;
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.search) params = params.set('search', query.search);
    if (query.source) params = params.set('source', query.source);
    if (query.visibility) params = params.set('visibility', query.visibility);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    return params;
  }

  /** Lista paginada de playlists del usuario autenticado. */
  list(query?: PlaylistListQuery): Observable<PlaylistListResponse> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.get<PlaylistListResponse>(this.apiUrl, {
          headers,
          params: this.toParams(query),
        }),
      ),
      tap((response) => this.playlistsSignal.set(response.items)),
    );
  }

  /** Detalle de una playlist (requiere ser dueño o playlist pública). */
  getById(id: number): Observable<Playlist> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Playlist>(`${this.apiUrl}/${id}`, { headers }),
      ),
      tap((playlist) => this.selectedPlaylistSignal.set(playlist)),
    );
  }

  /** Crea una playlist (opcionalmente con items iniciales). */
  create(dto: CreatePlaylistDto): Observable<Playlist> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<Playlist>(this.apiUrl, dto, { headers }),
      ),
      tap((playlist) => {
        this.playlistsSignal.update((list) => [playlist, ...list]);
        this.selectedPlaylistSignal.set(playlist);
      }),
    );
  }

  /** Actualiza metadatos de la playlist. */
  update(id: number, dto: UpdatePlaylistDto): Observable<Playlist> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.patch<Playlist>(`${this.apiUrl}/${id}`, dto, { headers }),
      ),
      tap((playlist) => this.patchCache(playlist)),
    );
  }

  /** Elimina (soft-delete) una playlist. */
  delete(id: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }),
      ),
      tap(() => {
        this.playlistsSignal.update((list) => list.filter((p) => p.id !== id));
        if (this.selectedPlaylistSignal()?.id === id) {
          this.selectedPlaylistSignal.set(null);
        }
      }),
    );
  }

  /** Añade un libro a la playlist. */
  addItem(playlistId: number, dto: AddPlaylistItemDto): Observable<PlaylistItem> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<PlaylistItem>(
          `${this.apiUrl}/${playlistId}/items`,
          dto,
          { headers },
        ),
      ),
    );
  }

  /** Actualiza nota/estado de un item. */
  updateItem(
    playlistId: number,
    itemId: number,
    dto: UpdatePlaylistItemDto,
  ): Observable<PlaylistItem> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.patch<PlaylistItem>(
          `${this.apiUrl}/${playlistId}/items/${itemId}`,
          dto,
          { headers },
        ),
      ),
    );
  }

  /** Elimina un item de la playlist. */
  removeItem(playlistId: number, itemId: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(
          `${this.apiUrl}/${playlistId}/items/${itemId}`,
          { headers },
        ),
      ),
    );
  }

  /** Reordena los items de la playlist en una sola operación atómica. */
  reorder(
    playlistId: number,
    dto: ReorderPlaylistItemsDto,
  ): Observable<ReorderPlaylistItemsResponse> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<ReorderPlaylistItemsResponse>(
          `${this.apiUrl}/${playlistId}/items/reorder`,
          dto,
          { headers },
        ),
      ),
    );
  }

  /**
   * Genera una playlist con IA (endpoint implementado en H1.3 · SCRUM-162).
   * Mantenemos la firma estable para acoplar UI y webhook n8n.
   */
  generateWithAi(dto: GeneratePlaylistWithAiDto): Observable<Playlist> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<Playlist>(`${this.apiUrl}/generate`, dto, { headers }),
      ),
      tap((playlist) => {
        this.playlistsSignal.update((list) => [playlist, ...list]);
        this.selectedPlaylistSignal.set(playlist);
      }),
    );
  }

  /**
   * Genera un `shareToken` público para la playlist (H1.4 · SCRUM-163).
   */
  share(id: number): Observable<{ shareToken: string; url: string }> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<{ shareToken: string; url: string }>(
          `${this.apiUrl}/${id}/share`,
          {},
          { headers },
        ),
      ),
    );
  }

  /** Revoca el token público de una playlist (H1.4 · SCRUM-163). */
  revokeShare(id: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${id}/share`, { headers }),
      ),
    );
  }

  /** Exporta la playlist en JSON o Markdown (H1.4 · SCRUM-163). */
  export(id: number, format: PlaylistExportFormat = 'json'): Observable<Blob> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.get(`${this.apiUrl}/${id}/export`, {
          headers: headers.set('Accept', format === 'md' ? 'text/markdown' : 'application/json'),
          params: new HttpParams().set('format', format),
          responseType: 'blob',
        }),
      ),
    );
  }

  private patchCache(playlist: Playlist) {
    this.playlistsSignal.update((list) =>
      list.map((p) => (p.id === playlist.id ? { ...p, ...playlist } : p)),
    );
    if (this.selectedPlaylistSignal()?.id === playlist.id) {
      this.selectedPlaylistSignal.set(playlist);
    }
  }
}
