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
import { Header } from '@shared/components/header/header';
import {
  CatalogBook,
  Playlist,
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

  readonly playlist = signal<Playlist | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorKey = signal<string | null>(null);

  readonly editingTitle = signal<boolean>(false);
  readonly titleDraft = signal<string>('');
  readonly editingDescription = signal<boolean>(false);
  readonly descriptionDraft = signal<string>('');
  readonly savingMeta = signal<boolean>(false);

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
}
