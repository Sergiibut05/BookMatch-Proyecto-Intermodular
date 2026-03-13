import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';

import { VotesService, VoteType } from '@core/services/votes.service';

/**
 * Datos minimos necesarios para renderizar y actualizar votos de un post.
 */
export interface UpvoteData {
  /** ID del post. */
  id: number;
  /** Puntuación actual. */
  score: number;
  /** Voto del usuario actual (UP/DOWN) o null. */
  userVote?: VoteType | null;
}

/**
 * Control de voto positivo/negativo para publicaciones del foro.
 *
 * @example
 * ```html
 * <app-upvote-button
 *   [item]="post"
 *   [forumId]="forumId"
 *   [postId]="post.id"
 *   (scoreUpdated)="onScoreUpdated($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-upvote-button',
  imports: [],
  templateUrl: './upvote-button.component.html',
  styleUrl: './upvote-button.component.scss',
})
export class UpvoteButtonComponent implements OnInit {
  private votesService = inject(VotesService);

  @Input() item!: UpvoteData;
  @Input() forumId!: number;
  @Input() postId!: number;
  @Output() scoreUpdated = new EventEmitter<number>();

  currentScore = signal<number>(0);
  userVote = signal<VoteType | null>(null);
  isVoting = signal<boolean>(false);

  ngOnInit(): void {
    if (this.item) {
      this.currentScore.set(this.item.score ?? 0);
      this.userVote.set(this.item.userVote ?? null);
    } else {
      console.warn('⚠️ UpvoteButtonComponent: item no está definido');
      this.currentScore.set(0);
      this.userVote.set(null);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] && this.item) {
      this.currentScore.set(this.item.score ?? 0);
      this.userVote.set(this.item.userVote ?? null);
    }
  }

  /**
   * Maneja el voto hacia arriba
   *
   * @returns void
   */
  handleUpvote(): void {
    if (this.isVoting()) return;

    const currentVote = this.userVote();
    
    if (currentVote === 'UP') {
      // Si ya votó arriba, eliminar el voto
      this.deleteVote();
    } else {
      // Votar arriba
      this.vote('UP');
    }
  }

  /**
   * Maneja el voto hacia abajo
   *
   * @returns void
   */
  handleDownvote(): void {
    if (this.isVoting()) return;

    const currentVote = this.userVote();
    
    if (currentVote === 'DOWN') {
      // Si ya votó abajo, eliminar el voto
      this.deleteVote();
    } else {
      // Votar abajo
      this.vote('DOWN');
    }
  }

  /**
   * Realiza un voto
   *
   * @param type Tipo de voto (`UP` o `DOWN`)
   */
  private vote(type: VoteType): void {
    this.isVoting.set(true);

    this.votesService.upsertVote(this.forumId, this.postId, type).subscribe({
      next: (response) => {
        const newScore = response.score;

        this.userVote.set(type);
        this.currentScore.set(newScore);
        this.item.userVote = type;
        this.item.score = newScore;
        this.isVoting.set(false);
        this.scoreUpdated.emit(newScore);
      },
      error: (err) => {
        console.error('Error votando:', err);
        this.isVoting.set(false);
      }
    });
  }

  /**
   * Elimina el voto actual
   */
  private deleteVote(): void {
    this.isVoting.set(true);

    this.votesService.deleteVote(this.forumId, this.postId).subscribe({
      next: (response) => {
        const newScore = response.score;

        this.userVote.set(null);
        this.currentScore.set(newScore);
        this.item.userVote = null;
        this.item.score = newScore;
        this.isVoting.set(false);
        this.scoreUpdated.emit(newScore);
      },
      error: (err) => {
        console.error('Error eliminando voto:', err);
        this.isVoting.set(false);
      }
    });
  }
}

