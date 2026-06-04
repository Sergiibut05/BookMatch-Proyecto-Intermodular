import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { filter, map, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import {
  AddPlaylistItemDto,
  CreatePlaylistDto,
  GeneratePlaylistResponse,
  GeneratePlaylistWithAiDto,
  Playlist,
  PlaylistExportFormat,
  PlaylistItem,
  PlaylistListQuery,
  PlaylistListResponse,
  PublicPlaylist,
  ReorderPlaylistItemsDto,
  ReorderPlaylistItemsResponse,
  SharePlaylistResponse,
  UnsharePlaylistResponse,
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
   * Dispara la generación IA (H1.3 · SCRUM-162). Devuelve inmediatamente
   * la playlist en estado borrador (`title = 'Generando...'`); el frontend
   * debe llamar a `pollGeneration(id)` para esperar la respuesta del
   * callback n8n.
   */
  generateWithAi(dto: GeneratePlaylistWithAiDto): Observable<GeneratePlaylistResponse> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<GeneratePlaylistResponse>(
          `${this.apiUrl}/generate`,
          dto,
          { headers },
        ),
      ),
      tap(({ playlist }) => {
        this.playlistsSignal.update((list) => [playlist, ...list]);
        this.selectedPlaylistSignal.set(playlist);
      }),
    );
  }

  /**
   * Poll cada `intervalMs` a `getById(id)` hasta que la playlist termine
   * de generarse. Emite cada lectura intermedia y se completa cuando:
   *   - La playlist tiene items (éxito), o
   *   - `description` empieza por `[AI_FAILED]` (fallo), o
   *   - Transcurre `timeoutMs` (emite el último estado y un error).
   */
  pollGeneration(
    id: number,
    opts: { intervalMs?: number; timeoutMs?: number } = {},
  ): Observable<Playlist> {
    const intervalMs = opts.intervalMs ?? 3000;
    const timeoutMs = opts.timeoutMs ?? 60000;
    const maxAttempts = Math.max(1, Math.ceil(timeoutMs / intervalMs));

    return timer(0, intervalMs).pipe(
      takeWhile((i) => i < maxAttempts),
      switchMap((attempt) =>
        this.getById(id).pipe(
          map((playlist) => ({ playlist, attempt })),
        ),
      ),
      // Emitimos sólo cuando la playlist está resuelta o es el último intento.
      filter(({ playlist, attempt }) => {
        const failed = playlist.description?.startsWith('[AI_FAILED]') ?? false;
        const completed = playlist.items.length > 0 || failed;
        return completed || attempt + 1 >= maxAttempts;
      }),
      take(1),
      switchMap(({ playlist }) => {
        const failed = playlist.description?.startsWith('[AI_FAILED]') ?? false;
        const completed = playlist.items.length > 0 || failed;
        if (completed) return of(playlist);
        return throwError(
          () => Object.assign(new Error('AI_GENERATION_TIMEOUT'), { playlist }),
        );
      }),
    );
  }

  /**
   * Genera (o rota) el `shareToken` público para la playlist (H1.4 · SCRUM-163).
   * El backend marca la visibility=PUBLIC y devuelve token + URL pública.
   */
  share(id: number): Observable<SharePlaylistResponse> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<SharePlaylistResponse>(
          `${this.apiUrl}/${id}/share`,
          {},
          { headers },
        ),
      ),
      tap(({ playlist }) => this.patchCache(playlist)),
    );
  }

  /** Revoca el `shareToken`. No cambia `visibility` (eso lo decide el usuario). */
  revokeShare(id: number): Observable<UnsharePlaylistResponse> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<UnsharePlaylistResponse>(`${this.apiUrl}/${id}/share`, { headers }),
      ),
      tap(({ playlist }) => this.patchCache(playlist)),
    );
  }

  /**
   * Recupera una playlist por su shareToken (vista pública, sin auth).
   * NO incluye cabecera `Authorization` para no activar CORS preflight innecesario.
   */
  getByShareToken(token: string): Observable<PublicPlaylist> {
    return this.http.get<PublicPlaylist>(
      `${this.apiUrl}/share/${encodeURIComponent(token)}`,
    );
  }

  /**
   * Dispara la generación de portada IA para la playlist (OpenRouter FLUX Schnell).
   * El servidor responde 202 y genera en background; la portada aparecerá al
   * recargar la playlist. No bloquea al usuario.
   */
  generateCover(id: number): Observable<{ message: string; playlistId: number }> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<{ message: string; playlistId: number }>(
          `${this.apiUrl}/${id}/generate-cover`,
          {},
          { headers },
        ),
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
