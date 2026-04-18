import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlaylistService } from '@core/services/playlist.service';
import {
  GeneratePlaylistResponse,
  Playlist,
  PlaylistVisibility,
} from '@shared/models';

/**
 * Diálogo "Generar con IA" (H1.9 · SCRUM-168).
 *
 * Se usa como modal overlay desde el listado:
 *   <app-playlist-generate-dialog (close)="onDialogClose()" />
 *
 * Flujo:
 *   1. El usuario escribe prompt + parámetros opcionales.
 *   2. Enviamos `POST /api/playlists/generate` y recibimos el draft 202.
 *   3. Hacemos polling (3s, 60s timeout) a `getById` hasta que la playlist
 *      tenga items o descripción `[AI_FAILED]`.
 *   4. Si todo va bien navegamos a `/playlists/:id`.
 *   5. Si el usuario cancela con generación en curso, `DELETE` el draft.
 */
@Component({
  selector: 'app-playlist-generate-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './playlist-generate-dialog.component.html',
  styleUrl: './playlist-generate-dialog.component.scss',
})
export class PlaylistGenerateDialogComponent {
  private fb = inject(FormBuilder);
  private playlistService = inject(PlaylistService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  /** Evento emitido cuando el usuario cierra el diálogo sin navegar. */
  @Output() readonly closeDialog = new EventEmitter<void>();

  /** Indica si hay una generación en curso (POST + polling). */
  readonly generating = signal<boolean>(false);
  /** Clave i18n del banner de error (null si no hay error). */
  readonly errorKey = signal<string | null>(null);
  /** Parámetros interpolables para el mensaje de error (count, lookup, etc). */
  readonly errorParams = signal<Record<string, unknown> | null>(null);
  /** ID del draft creado: lo usamos para cancelar/borrar si el usuario aborta. */
  readonly draftPlaylistId = signal<number | null>(null);
  /** Texto del botón de envío según estado. */
  readonly submitLabelKey = computed(() =>
    this.generating() ? 'PLAYLIST_GENERATE.SUBMITTING' : 'PLAYLIST_GENERATE.SUBMIT',
  );

  readonly form = this.fb.nonNullable.group({
    prompt: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(2000)],
    ],
    size: this.fb.nonNullable.control<number>(8, [
      Validators.min(3),
      Validators.max(25),
    ]),
    mood: this.fb.nonNullable.control<string>('', [Validators.maxLength(80)]),
    language: this.fb.nonNullable.control<string>('es'),
    visibility: this.fb.nonNullable.control<PlaylistVisibility>('PRIVATE'),
    genreInput: this.fb.nonNullable.control<string>(''),
  });

  /** Géneros añadidos como chips (max 10). */
  readonly genres = signal<string[]>([]);

  readonly promptCount = computed(() => this.form.controls.prompt.value.length);

  /** Añade un chip de género desde el input. */
  addGenre(): void {
    const raw = this.form.controls.genreInput.value.trim();
    if (!raw) return;
    const current = this.genres();
    if (current.length >= 10) return;
    if (current.some((g) => g.toLowerCase() === raw.toLowerCase())) return;
    this.genres.update((list) => [...list, raw.slice(0, 80)]);
    this.form.controls.genreInput.setValue('');
  }

  removeGenre(genre: string): void {
    this.genres.update((list) => list.filter((g) => g !== genre));
  }

  submit(): void {
    if (this.generating() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { prompt, size, mood, language, visibility } = this.form.getRawValue();

    this.errorKey.set(null);
    this.errorParams.set(null);
    this.generating.set(true);

    this.playlistService
      .generateWithAi({
        prompt: prompt.trim(),
        size,
        mood: mood.trim() || undefined,
        language,
        visibility,
        genres: this.genres().length ? this.genres() : undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: GeneratePlaylistResponse) => {
          this.draftPlaylistId.set(response.playlist.id);
          this.pollAndNavigate(response.playlist.id);
        },
        error: (err) => this.handleGenerateError(err),
      });
  }

  private pollAndNavigate(playlistId: number): void {
    this.playlistService
      .pollGeneration(playlistId, { intervalMs: 3000, timeoutMs: 60000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (playlist: Playlist) => {
          const failed = playlist.description?.startsWith('[AI_FAILED]') ?? false;
          if (failed) {
            this.errorKey.set('PLAYLIST_GENERATE.ERROR_AI_FAILED');
            this.errorParams.set(null);
            this.generating.set(false);
            return;
          }
          this.generating.set(false);
          this.draftPlaylistId.set(null);
          this.router.navigate(['/playlists', playlist.id]);
          this.closeDialog.emit();
        },
        error: (err) => {
          console.error('[playlist-generate] polling error', err);
          if (err?.message === 'AI_GENERATION_TIMEOUT') {
            this.errorKey.set('PLAYLIST_GENERATE.ERROR_TIMEOUT');
          } else {
            this.errorKey.set('PLAYLIST_GENERATE.ERROR_POLL');
          }
          this.generating.set(false);
        },
      });
  }

  private handleGenerateError(err: unknown): void {
    this.generating.set(false);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 503) {
        this.errorKey.set('PLAYLIST_GENERATE.ERROR_NOT_CONFIGURED');
        return;
      }
      if (err.status === 502) {
        this.errorKey.set('PLAYLIST_GENERATE.ERROR_N8N_UNREACHABLE');
        return;
      }
      if (err.status === 401 || err.status === 403) {
        this.errorKey.set('PLAYLIST_GENERATE.ERROR_AUTH');
        return;
      }
      if (err.status === 400) {
        this.errorKey.set('PLAYLIST_GENERATE.ERROR_VALIDATION');
        return;
      }
    }
    console.error('[playlist-generate] generateWithAi error', err);
    this.errorKey.set('PLAYLIST_GENERATE.ERROR_GENERIC');
  }

  /**
   * Cierra el diálogo. Si había una generación en curso con un draft
   * creado, hacemos soft-delete para no dejar basura en la lista.
   */
  requestClose(): void {
    const id = this.draftPlaylistId();
    if (this.generating() && id) {
      this.playlistService.delete(id).subscribe({
        next: () => { /* no-op, el signal ya limpia la caché */ },
        error: (err) => console.warn('[playlist-generate] no se pudo borrar el draft', err),
      });
    }
    this.draftPlaylistId.set(null);
    this.generating.set(false);
    this.closeDialog.emit();
  }

  /** Handler del backdrop: sólo cierra si se hace clic fuera del cuadro. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  /** Helper para errores de formulario en plantilla. */
  hasError(control: FormControl | null, key: string): boolean {
    if (!control) return false;
    return (control.touched || control.dirty) && control.hasError(key);
  }
}
