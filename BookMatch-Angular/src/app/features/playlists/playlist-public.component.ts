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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PlaylistService } from '@core/services/playlist.service';
import { PublicPlaylist } from '@shared/models';

/**
 * Vista pública de una playlist compartida (`/public/playlists/:token`).
 *
 * Rediseñada con la estética «editorial / librería antigua» del resto de
 * la feature de playlists: sin degradados, tipografía serif para el
 * título, portada 3:4, stats inline y tarjeta CTA al final. No requiere
 * autenticación y consume `GET /api/playlists/share/:token`.
 */
@Component({
  selector: 'app-playlist-public',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './playlist-public.component.html',
  styleUrl: './playlist-public.component.scss',
})
export class PlaylistPublicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private playlistService = inject(PlaylistService);

  readonly playlist = signal<PublicPlaylist | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorKey = signal<string | null>(null);
  readonly linkCopied = signal<boolean>(false);

  readonly hasPlaylist = computed(() => this.playlist() !== null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const token = (params.get('token') || '').trim();
        if (!token || token.length < 16) {
          this.errorKey.set('PLAYLIST_PUBLIC.ERROR_INVALID_TOKEN');
          this.loading.set(false);
          return;
        }
        this.fetch(token);
      });
  }

  /**
   * Copia la URL actual al portapapeles (con fallback para entornos sin
   * Clipboard API, p.ej. http sin secure-context).
   */
  async copyLink(): Promise<void> {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
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
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    } catch (err) {
      console.error('[playlist-public] error copiando enlace', err);
    }
  }

  private fetch(token: string): void {
    this.loading.set(true);
    this.playlistService
      .getByShareToken(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.playlist.set(p);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[playlist-public] error', err);
          const status = (err?.status ?? 0) as number;
          this.errorKey.set(
            status === 404
              ? 'PLAYLIST_PUBLIC.ERROR_NOT_FOUND'
              : 'PLAYLIST_PUBLIC.ERROR_GENERIC',
          );
          this.loading.set(false);
        },
      });
  }
}
