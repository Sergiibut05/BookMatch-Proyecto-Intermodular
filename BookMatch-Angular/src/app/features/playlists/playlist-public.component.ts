import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PlaylistService } from '@core/services/playlist.service';
import { PublicPlaylist } from '@shared/models';

/**
 * Vista pública de una playlist compartida (`/public/playlists/:token`).
 *
 * No requiere `authGuard` ni token Firebase: consume
 * `GET /api/playlists/share/:token`, que devuelve una proyección sin
 * `ownerId` ni `aiPrompt` y solo si la playlist es `PUBLIC`.
 */
@Component({
  selector: 'app-playlist-public',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="min-h-screen bg-[#FCF5E2] text-neutral-900">
      <header class="border-b border-amber-100 bg-white/80 backdrop-blur">
        <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <a routerLink="/home" class="text-lg font-bold text-[#4a3828]">BookMatch</a>
          <a
            routerLink="/auth/login"
            class="rounded-lg bg-[#E0A15E] px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#c88f4e]"
          >
            {{ 'PLAYLIST_PUBLIC.OPEN_APP' | translate }}
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-4xl px-4 py-8">
        @if (loading()) {
          <div class="flex items-center justify-center py-20 text-neutral-500">
            <div
              class="h-8 w-8 animate-spin rounded-full border-2 border-[#E0A15E] border-t-transparent"
            ></div>
          </div>
        } @else if (errorKey()) {
          <div class="rounded-xl bg-red-50 p-6 text-center text-red-700">
            <h1 class="mb-2 text-lg font-semibold">
              {{ 'PLAYLIST_PUBLIC.ERROR_TITLE' | translate }}
            </h1>
            <p>{{ errorKey()! | translate }}</p>
          </div>
        } @else if (playlist(); as p) {
          <section class="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div class="relative h-48 w-full bg-gradient-to-br from-[#E0A15E] to-[#a06c3a]">
              @if (p.coverUrl) {
                <img
                  [src]="p.coverUrl"
                  [alt]="p.title"
                  class="h-48 w-full object-cover"
                  loading="lazy"
                />
              }
              <div class="absolute inset-0 bg-black/30"></div>
              <div class="absolute inset-x-0 bottom-0 p-6 text-white">
                <div class="mb-1 text-xs uppercase tracking-wider opacity-90">
                  {{ 'PLAYLIST_PUBLIC.SHARED_PLAYLIST' | translate }}
                </div>
                <h1 class="text-2xl font-bold sm:text-3xl">{{ p.title }}</h1>
                <p class="mt-1 text-sm opacity-90">
                  {{ 'PLAYLIST_PUBLIC.ITEMS_COUNT' | translate: { count: p.items.length } }}
                </p>
              </div>
            </div>

            @if (p.description) {
              <div class="border-b border-neutral-100 p-6 text-neutral-700">
                <p class="whitespace-pre-wrap">{{ p.description }}</p>
              </div>
            }

            <ul class="divide-y divide-neutral-100">
              @for (item of p.items; track item.id) {
                <li class="flex gap-4 p-4">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FCF5E2] text-sm font-semibold text-[#E0A15E]"
                  >
                    {{ item.position }}
                  </div>
                  <div class="h-20 w-14 shrink-0 overflow-hidden rounded bg-neutral-200">
                    @if (item.catalogBook?.coverUrl) {
                      <img
                        [src]="item.catalogBook!.coverUrl!"
                        [alt]="item.catalogBook!.title"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-semibold text-neutral-900">
                      {{ item.catalogBook?.title ?? '—' }}
                    </div>
                    <div class="truncate text-sm text-neutral-500">
                      {{ item.catalogBook?.author ?? '' }}
                    </div>
                    @if (item.note) {
                      <div class="mt-1 text-xs italic text-neutral-500">"{{ item.note }}"</div>
                    }
                  </div>
                </li>
              } @empty {
                <li class="p-8 text-center text-neutral-500">
                  {{ 'PLAYLIST_PUBLIC.EMPTY' | translate }}
                </li>
              }
            </ul>

            <footer class="border-t border-neutral-100 p-4 text-center text-xs text-neutral-400">
              {{ 'PLAYLIST_PUBLIC.FOOTER' | translate }}
            </footer>
          </section>
        }
      </main>
    </div>
  `,
})
export class PlaylistPublicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private playlistService = inject(PlaylistService);

  readonly playlist = signal<PublicPlaylist | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorKey = signal<string | null>(null);

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
