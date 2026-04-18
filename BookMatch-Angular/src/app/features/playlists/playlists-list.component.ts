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
  imports: [CommonModule, TranslateModule, Header],
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

  deletePlaylist(event: Event, playlist: Playlist): void {
    event.stopPropagation();

    const message = this.translate.instant('PLAYLISTS.DELETE_CONFIRM', {
      title: playlist.title,
    });
    if (!window.confirm(message)) return;

    this.playlistService
      .delete(playlist.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.playlists.update((list) =>
            list.filter((p) => p.id !== playlist.id),
          );
        },
        error: (err) => {
          console.error('[playlists-list] error eliminando playlist', err);
          this.errorKey.set('PLAYLISTS.ERROR_DELETE');
        },
      });
  }

  goToNew(): void {
    this.router.navigate(['/playlists/new']);
  }

  goToGenerate(): void {
    this.router.navigate(['/playlists/new'], {
      queryParams: { generate: 1 },
    });
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
