import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
} from 'rxjs/operators';
import { CatalogService } from '@core/services/catalog.service';
import { PlaylistService } from '@core/services/playlist.service';
import { StorageService } from '@core/services/storage';
import { Header } from '@shared/components/header/header';
import {
  CatalogBook,
  Playlist,
  PlaylistExportFormat,
  PlaylistItem,
  PlaylistItemStatus,
} from '@shared/models';

/**
 * Vista detalle / edición de una playlist (`/playlists/:id`).
 *
 * Incluye edición inline de metadatos, reordenación drag&drop de items
 * (Angular CDK), cambio de estado por ítem con actualización optimista y
 * buscador del catálogo para añadir libros.
 */
@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    CdkDropList,
    CdkDrag,
    Header,
  ],
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.scss',
})
export class PlaylistDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  private playlistService = inject(PlaylistService);
  private catalogService = inject(CatalogService);
  private storageService = inject(StorageService);

  readonly playlist = signal<Playlist | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorKey = signal<string | null>(null);

  readonly editingTitle = signal<boolean>(false);
  readonly titleDraft = signal<string>('');
  readonly editingDescription = signal<boolean>(false);
  readonly descriptionDraft = signal<string>('');
  readonly savingMeta = signal<boolean>(false);
  readonly uploadingCover = signal<boolean>(false);

  // H1.11 · Compartir / exportar
  readonly shareOpen = signal<boolean>(false);
  readonly sharing = signal<boolean>(false);
  readonly sharePublicUrl = signal<string | null>(null);
  readonly shareCopied = signal<boolean>(false);
  readonly exporting = signal<boolean>(false);

  readonly searchOpen = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly searchResults = signal<CatalogBook[]>([]);
  readonly searchLoading = signal<boolean>(false);

  readonly itemStatuses: PlaylistItemStatus[] = ['PENDING', 'READING', 'READ'];

  readonly items = computed<PlaylistItem[]>(
    () => this.playlist()?.items ?? [],
  );

  readonly isEmpty = computed(
    () => !this.loading() && this.items().length === 0,
  );

  private readonly searchInput$ = new Subject<string>();
  private reorderTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = Number(params.get('id'));
        if (!Number.isFinite(id) || id <= 0) {
          this.errorKey.set('PLAYLIST_DETAIL.ERROR_NOT_FOUND');
          this.loading.set(false);
          return;
        }
        this.loadPlaylist(id);
      });

    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((term) => term.trim().length >= 2),
        switchMap((term) => {
          this.searchLoading.set(true);
          return this.catalogService.searchBooks(term.trim(), 1, 10).pipe(
            catchError((err) => {
              console.error('[playlist-detail] error en búsqueda', err);
              return of({
                items: [] as CatalogBook[],
                total: 0,
                page: 1,
                limit: 10,
                previousPage: null,
                nextPage: null,
              });
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.searchResults.set(res.items ?? []);
        this.searchLoading.set(false);
      });
  }

  loadPlaylist(id: number): void {
    this.loading.set(true);
    this.errorKey.set(null);

    this.playlistService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (playlist) => {
          this.playlist.set(playlist);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[playlist-detail] error cargando playlist', err);
          const status = (err?.status ?? 0) as number;
          this.errorKey.set(
            status === 404 || status === 403
              ? 'PLAYLIST_DETAIL.ERROR_NOT_FOUND'
              : 'PLAYLIST_DETAIL.ERROR_LOAD',
          );
          this.loading.set(false);
        },
      });
  }

  // ---- Edición inline de metadatos ----

  startEditTitle(): void {
    const p = this.playlist();
    if (!p) return;
    this.titleDraft.set(p.title);
    this.editingTitle.set(true);
  }

  cancelEditTitle(): void {
    this.editingTitle.set(false);
  }

  async saveTitle(): Promise<void> {
    const p = this.playlist();
    const draft = this.titleDraft().trim();
    if (!p || !draft || draft.length < 3 || draft.length > 80 || draft === p.title) {
      this.editingTitle.set(false);
      return;
    }
    this.savingMeta.set(true);
    try {
      const updated = await firstValueFrom(
        this.playlistService.update(p.id, { title: draft }),
      );
      this.playlist.set({ ...p, ...updated, items: p.items });
    } catch (err) {
      console.error('[playlist-detail] error guardando título', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SAVE');
    } finally {
      this.savingMeta.set(false);
      this.editingTitle.set(false);
    }
  }

  startEditDescription(): void {
    const p = this.playlist();
    if (!p) return;
    this.descriptionDraft.set(p.description ?? '');
    this.editingDescription.set(true);
  }

  cancelEditDescription(): void {
    this.editingDescription.set(false);
  }

  async saveDescription(): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const draft = this.descriptionDraft().trim();
    if ((p.description ?? '') === draft) {
      this.editingDescription.set(false);
      return;
    }
    this.savingMeta.set(true);
    try {
      const updated = await firstValueFrom(
        this.playlistService.update(p.id, {
          description: draft === '' ? null : draft,
        }),
      );
      this.playlist.set({ ...p, ...updated, items: p.items });
    } catch (err) {
      console.error('[playlist-detail] error guardando descripción', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SAVE');
    } finally {
      this.savingMeta.set(false);
      this.editingDescription.set(false);
    }
  }

  async toggleVisibility(): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const next = p.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE';
    const previous = p.visibility;
    this.playlist.set({ ...p, visibility: next });
    try {
      await firstValueFrom(
        this.playlistService.update(p.id, { visibility: next }),
      );
    } catch (err) {
      console.error('[playlist-detail] error cambiando visibilidad', err);
      this.playlist.set({ ...p, visibility: previous });
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SAVE');
    }
  }

  /**
   * Lanza el picker de imagen, sube la foto a Firebase Storage y actualiza
   * `coverUrl` en el backend. Aplica preview optimista y rollback en error.
   * La imagen anterior se borra desde el `StorageService` sólo si estaba
   * alojada en nuestro bucket (evita tocar URLs externas/IA).
   */
  async changeCover(): Promise<void> {
    const p = this.playlist();
    if (!p || this.uploadingCover()) return;

    const photo = await this.storageService.takePhoto();
    if (!photo) return;

    const previousCover = p.coverUrl;
    this.uploadingCover.set(true);
    this.errorKey.set(null);

    try {
      const newUrl = await this.storageService.uploadPlaylistCover(
        photo,
        p.id,
        previousCover,
      );

      this.playlist.set({ ...p, coverUrl: newUrl });

      await firstValueFrom(
        this.playlistService.update(p.id, { coverUrl: newUrl }),
      );
    } catch (err) {
      console.error('[playlist-detail] error subiendo portada', err);
      this.playlist.set({ ...p, coverUrl: previousCover });
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_COVER_UPLOAD');
    } finally {
      this.uploadingCover.set(false);
    }
  }

  /**
   * Quita la portada actual: persiste `coverUrl = null` en el backend
   * y borra el fichero de Firebase Storage si corresponde.
   */
  async removeCover(): Promise<void> {
    const p = this.playlist();
    if (!p || !p.coverUrl || this.uploadingCover()) return;

    const msg = this.translate.instant('PLAYLIST_DETAIL.COVER_REMOVE_CONFIRM');
    if (!window.confirm(msg)) return;

    const previousCover = p.coverUrl;
    this.uploadingCover.set(true);
    this.errorKey.set(null);

    try {
      this.playlist.set({ ...p, coverUrl: null });
      await firstValueFrom(
        this.playlistService.update(p.id, { coverUrl: null }),
      );
      // Intento de limpieza de Storage: fallo silencioso si no es nuestra URL.
      try {
        await this.storageService.deletePhoto(previousCover);
      } catch {
        // el StorageService ya maneja object-not-found; aquí ignoramos.
      }
    } catch (err) {
      console.error('[playlist-detail] error quitando portada', err);
      this.playlist.set({ ...p, coverUrl: previousCover });
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_COVER_REMOVE');
    } finally {
      this.uploadingCover.set(false);
    }
  }

  async deletePlaylist(): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const msg = this.translate.instant('PLAYLIST_DETAIL.DELETE_CONFIRM', {
      title: p.title,
    });
    if (!window.confirm(msg)) return;
    try {
      await firstValueFrom(this.playlistService.delete(p.id));
      this.router.navigate(['/playlists']);
    } catch (err) {
      console.error('[playlist-detail] error eliminando playlist', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_DELETE');
    }
  }

  // ---- Búsqueda catálogo y añadir ítems ----

  toggleSearch(): void {
    this.searchOpen.update((v) => !v);
    if (!this.searchOpen()) {
      this.searchTerm.set('');
      this.searchResults.set([]);
    }
  }

  onSearchInput(term: string): void {
    this.searchTerm.set(term);
    if (term.trim().length < 2) {
      this.searchResults.set([]);
      this.searchLoading.set(false);
      return;
    }
    this.searchInput$.next(term);
  }

  isBookAlreadyInPlaylist(bookId: number): boolean {
    return this.items().some((it) => it.catalogBookId === bookId);
  }

  async addBook(book: CatalogBook): Promise<void> {
    const p = this.playlist();
    if (!p || this.isBookAlreadyInPlaylist(book.id)) return;
    try {
      const item = await firstValueFrom(
        this.playlistService.addItem(p.id, { catalogBookId: book.id }),
      );
      const current = this.playlist();
      if (!current) return;
      this.playlist.set({
        ...current,
        items: [...current.items, item],
        itemsCount: current.itemsCount + 1,
      });
    } catch (err) {
      console.error('[playlist-detail] error añadiendo libro', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_ADD_ITEM');
    }
  }

  // ---- Operaciones por ítem ----

  async updateItemStatus(
    item: PlaylistItem,
    status: PlaylistItemStatus,
  ): Promise<void> {
    if (item.status === status) return;
    const p = this.playlist();
    if (!p) return;
    const previous = item.status;
    this.patchItem(item.id, { status });
    try {
      await firstValueFrom(
        this.playlistService.updateItem(p.id, item.id, { status }),
      );
    } catch (err) {
      console.error('[playlist-detail] error cambiando estado', err);
      this.patchItem(item.id, { status: previous });
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SAVE');
    }
  }

  async saveItemNote(item: PlaylistItem, note: string): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const trimmed = note.trim();
    if ((item.note ?? '') === trimmed) return;
    const previous = item.note;
    const nextNote = trimmed === '' ? null : trimmed;
    this.patchItem(item.id, { note: nextNote });
    try {
      await firstValueFrom(
        this.playlistService.updateItem(p.id, item.id, { note: nextNote }),
      );
    } catch (err) {
      console.error('[playlist-detail] error guardando nota', err);
      this.patchItem(item.id, { note: previous });
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SAVE');
    }
  }

  async removeItem(item: PlaylistItem): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const title = item.catalogBook?.title ?? '';
    const msg = this.translate.instant('PLAYLIST_DETAIL.REMOVE_CONFIRM', {
      title,
    });
    if (!window.confirm(msg)) return;
    try {
      await firstValueFrom(
        this.playlistService.removeItem(p.id, item.id),
      );
      const current = this.playlist();
      if (!current) return;
      this.playlist.set({
        ...current,
        items: current.items
          .filter((it) => it.id !== item.id)
          .map((it, idx) => ({ ...it, position: idx + 1 })),
        itemsCount: Math.max(0, current.itemsCount - 1),
      });
    } catch (err) {
      console.error('[playlist-detail] error eliminando ítem', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SAVE');
    }
  }

  // ---- Drag & drop ----

  onDrop(event: CdkDragDrop<PlaylistItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const current = this.playlist();
    if (!current) return;

    const previousSnapshot = current.items;
    const reordered = [...current.items];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    const withPositions = reordered.map((it, idx) => ({
      ...it,
      position: idx + 1,
    }));
    this.playlist.set({ ...current, items: withPositions });

    this.scheduleReorderPersist(previousSnapshot);
  }

  private scheduleReorderPersist(rollbackSnapshot: PlaylistItem[]): void {
    if (this.reorderTimer) clearTimeout(this.reorderTimer);
    this.reorderTimer = setTimeout(() => {
      this.reorderTimer = null;
      void this.persistReorder(rollbackSnapshot);
    }, 300);
  }

  private async persistReorder(
    rollbackSnapshot: PlaylistItem[],
  ): Promise<void> {
    const p = this.playlist();
    if (!p) return;
    const payload = {
      items: p.items.map((it) => ({ itemId: it.id, position: it.position })),
    };
    try {
      const res = await firstValueFrom(
        this.playlistService.reorder(p.id, payload),
      );
      const current = this.playlist();
      if (!current) return;
      this.playlist.set({ ...current, items: res.items });
    } catch (err) {
      console.error('[playlist-detail] error persistiendo orden', err);
      const current = this.playlist();
      if (current) {
        this.playlist.set({ ...current, items: rollbackSnapshot });
      }
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_REORDER');
    }
  }

  // ---- Helpers ----

  trackItemById(_: number, item: PlaylistItem): number {
    return item.id;
  }

  trackBookById(_: number, book: CatalogBook): number {
    return book.id;
  }

  statusKey(status: PlaylistItemStatus): string {
    switch (status) {
      case 'READING':
        return 'PLAYLIST_DETAIL.STATUS_READING';
      case 'READ':
        return 'PLAYLIST_DETAIL.STATUS_READ';
      default:
        return 'PLAYLIST_DETAIL.STATUS_PENDING';
    }
  }

  private patchItem(itemId: number, patch: Partial<PlaylistItem>): void {
    const current = this.playlist();
    if (!current) return;
    this.playlist.set({
      ...current,
      items: current.items.map((it) =>
        it.id === itemId ? { ...it, ...patch } : it,
      ),
    });
  }

  // ---- H1.11 · Compartir / exportar ----

  /** Abre/cierra el panel de compartir. Precalcula la URL si ya existe un token. */
  toggleSharePanel(): void {
    const next = !this.shareOpen();
    this.shareOpen.set(next);
    this.shareCopied.set(false);
    if (next) {
      const p = this.playlist();
      if (p?.shareToken) {
        this.sharePublicUrl.set(this.buildLocalPublicUrl(p.shareToken));
      } else {
        this.sharePublicUrl.set(null);
      }
    }
  }

  /**
   * Genera (o rota) el shareToken. El backend marca visibility=PUBLIC.
   * Prefiere la `publicUrl` del backend y cae a una URL local si no viene.
   */
  async share(): Promise<void> {
    const p = this.playlist();
    if (!p || this.sharing()) return;

    this.sharing.set(true);
    this.errorKey.set(null);
    this.shareCopied.set(false);
    try {
      const res = await firstValueFrom(this.playlistService.share(p.id));
      const current = this.playlist();
      if (current) {
        this.playlist.set({
          ...current,
          ...res.playlist,
          items: current.items,
        });
      }
      const url = res.publicUrl?.startsWith('http')
        ? res.publicUrl
        : this.buildLocalPublicUrl(res.token);
      this.sharePublicUrl.set(url);
      this.shareOpen.set(true);
    } catch (err) {
      console.error('[playlist-detail] error compartiendo', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SHARE');
    } finally {
      this.sharing.set(false);
    }
  }

  /** Invalida el shareToken actual. No cambia visibility. */
  async revokeShare(): Promise<void> {
    const p = this.playlist();
    if (!p || !p.shareToken || this.sharing()) return;

    const msg = this.translate.instant('PLAYLIST_DETAIL.UNSHARE_CONFIRM');
    if (!window.confirm(msg)) return;

    this.sharing.set(true);
    this.errorKey.set(null);
    try {
      const res = await firstValueFrom(this.playlistService.revokeShare(p.id));
      const current = this.playlist();
      if (current) {
        this.playlist.set({
          ...current,
          ...res.playlist,
          items: current.items,
        });
      }
      this.sharePublicUrl.set(null);
      this.shareCopied.set(false);
    } catch (err) {
      console.error('[playlist-detail] error revocando share', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_SHARE');
    } finally {
      this.sharing.set(false);
    }
  }

  /** Copia la URL pública al portapapeles con fallback si no hay Clipboard API. */
  async copyShareUrl(): Promise<void> {
    const url = this.sharePublicUrl();
    if (!url) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    } catch (err) {
      console.error('[playlist-detail] error copiando', err);
    }
  }

  /** Descarga la playlist como JSON o Markdown. */
  async exportAs(format: PlaylistExportFormat): Promise<void> {
    const p = this.playlist();
    if (!p || this.exporting()) return;

    this.exporting.set(true);
    this.errorKey.set(null);
    try {
      const blob = await firstValueFrom(this.playlistService.export(p.id, format));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playlist-${p.id}.${format === 'md' ? 'md' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('[playlist-detail] error exportando', err);
      this.errorKey.set('PLAYLIST_DETAIL.ERROR_EXPORT');
    } finally {
      this.exporting.set(false);
    }
  }

  /**
   * Construye la URL pública en el host del frontend actual.
   * Útil como fallback cuando el backend devuelve `/public/...` sin host.
   */
  private buildLocalPublicUrl(token: string): string {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
    return `${origin}/public/playlists/${token}`;
  }
}
