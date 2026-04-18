import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PlaylistService } from '@core/services/playlist.service';
import { Header } from '@shared/components/header/header';

/**
 * Formulario de creación manual de playlist (`/playlists/new`).
 *
 * Solo metadatos: título, descripción, visibilidad. Los libros se añaden
 * desde la vista detalle (H1.7). La generación con IA se ofrece ahora a
 * través del modal `PlaylistGenerateDialogComponent` (H1.9 · SCRUM-168).
 */
@Component({
  selector: 'app-playlist-new',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    Header,
  ],
  templateUrl: './playlist-new.component.html',
  styleUrl: './playlist-new.component.scss',
})
export class PlaylistNewComponent {
  private fb = inject(FormBuilder);
  private playlistService = inject(PlaylistService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(1000)]],
    visibility: this.fb.nonNullable.control<'PRIVATE' | 'PUBLIC'>('PRIVATE'),
  });

  readonly submitting = signal<boolean>(false);
  readonly errorKey = signal<string | null>(null);

  readonly titleCount = computed(() => this.form.controls.title.value.length);
  readonly descriptionCount = computed(
    () => this.form.controls.description.value.length,
  );

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorKey.set(null);

    const { title, description, visibility } = this.form.getRawValue();

    this.playlistService
      .create({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        visibility,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (playlist) => {
          this.router.navigate(['/playlists', playlist.id]);
        },
        error: (err) => {
          console.error('[playlist-new] error creando playlist', err);
          this.errorKey.set('PLAYLIST_NEW.ERROR_CREATE');
          this.submitting.set(false);
        },
      });
  }
}
