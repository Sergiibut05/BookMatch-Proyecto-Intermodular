import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlaylistService } from '@core/services/playlist.service';
import { Header } from '@shared/components/header/header';
import { Playlist, PlaylistSource } from '@shared/models';
import { PlaylistGenerateDialogComponent } from './playlist-generate-dialog.component';

type PlaylistFilter = 'all' | 'ai' | 'manual';

/**
 * Listado de playlists del usuario autenticado.
 *
 * Muestra tarjetas con portada, contador de items y badge de origen (IA / manual),
 * con filtros rápidos y accesos directos a creación manual o generación por IA.
 */
@Component({
  selector: 'app-playlists-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    Header,
    PlaylistGenerateDialogComponent,
  ],
  templateUrl: './playlists-list.component.html',
  styleUrl: './playlists-list.component.scss',
})
export class PlaylistsListComponent implements OnInit {
  private playlistService = inject(PlaylistService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly errorKey = signal<string | null>(null);
  readonly playlists = signal<Playlist[]>([]);
  readonly activeFilter = signal<PlaylistFilter>('all');

  readonly filteredPlaylists = computed(() => {
    const filter = this.activeFilter();
    const list = this.playlists();
    if (filter === 'ai') {
      return list.filter((p) => p.source === 'AI' || p.source === 'HYBRID');
    }
    if (filter === 'manual') {
      return list.filter((p) => p.source === 'MANUAL');
    }
    return list;
  });

  readonly isEmpty = computed(
    () => !this.loading() && this.playlists().length === 0,
  );

  readonly skeletonItems = Array.from({ length: 6 });

  /** Controla la visibilidad del modal «Generar con IA» (H1.9). */
  readonly showGenerateDialog = signal<boolean>(false);

  /**
   * Playlist que el usuario está a punto de eliminar. Al setearse abre el
   * modal de confirmación (sustituto del `window.confirm` nativo, que
   * rompía la estética cálida del resto de la app).
   */
  readonly playlistToDelete = signal<Playlist | null>(null);
  readonly deleting = signal<boolean>(false);

  // ------------------------------------------------------------------
  // Stats del hero. Evitan queries extra: solo contamos sobre el array
  // en memoria, que ya trae `itemsCount` por playlist.
  // ------------------------------------------------------------------
  readonly totalCount = computed(() => this.playlists().length);
  readonly aiCount = computed(() =>
    this.playlists().filter((p) => p.source === 'AI' || p.source === 'HYBRID')
      .length,
  );
  readonly manualCount = computed(() =>
    this.playlists().filter((p) => p.source === 'MANUAL').length,
  );
  readonly booksCount = computed(() =>
    this.playlists().reduce((acc, p) => acc + (p.itemsCount ?? 0), 0),
  );

  ngOnInit(): void {
    this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.loading.set(true);
    this.errorKey.set(null);

    this.playlistService
      .list({ sortBy: 'updated', limit: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.playlists.set(response.items);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[playlists-list] error cargando playlists', err);
          this.errorKey.set('PLAYLISTS.ERROR_LOAD');
          this.loading.set(false);
        },
      });
  }

  setFilter(filter: PlaylistFilter): void {
    this.activeFilter.set(filter);
  }

  trackById(_: number, playlist: Playlist): number {
    return playlist.id;
  }

  openPlaylist(playlist: Playlist): void {
    this.router.navigate(['/playlists', playlist.id]);
  }

  /**
   * Punto de entrada del flujo de eliminación. En vez de mostrar un
   * `window.confirm()` nativo, abre el modal custom (bottom-sheet en
   * móvil, centrado en desktop). La eliminación real la ejecuta
   * `confirmDeletePlaylist()` cuando el usuario acepta.
   */
  deletePlaylist(event: Event, playlist: Playlist): void {
    event.stopPropagation();
    if (this.deleting()) return;
    this.playlistToDelete.set(playlist);
  }

  cancelDeletePlaylist(): void {
    if (this.deleting()) return;
    this.playlistToDelete.set(null);
  }

  confirmDeletePlaylist(): void {
    const playlist = this.playlistToDelete();
    if (!playlist || this.deleting()) return;

    this.deleting.set(true);
    this.playlistService
      .delete(playlist.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.playlists.update((list) =>
            list.filter((p) => p.id !== playlist.id),
          );
          this.deleting.set(false);
          this.playlistToDelete.set(null);
        },
        error: (err) => {
          console.error('[playlists-list] error eliminando playlist', err);
          this.errorKey.set('PLAYLISTS.ERROR_DELETE');
          this.deleting.set(false);
          this.playlistToDelete.set(null);
        },
      });
  }

  goToNew(): void {
    this.router.navigate(['/playlists/new']);
  }

  goToGenerate(): void {
    this.showGenerateDialog.set(true);
  }

  onGenerateDialogClose(): void {
    this.showGenerateDialog.set(false);
    // Recargamos para reflejar cambios en caché tras cancelaciones.
    this.loadPlaylists();
  }

  sourceBadgeKey(source: PlaylistSource): string {
    switch (source) {
      case 'AI':
        return 'PLAYLISTS.BADGE_AI';
      case 'HYBRID':
        return 'PLAYLISTS.BADGE_HYBRID';
      default:
        return 'PLAYLISTS.BADGE_MANUAL';
    }
  }
}
