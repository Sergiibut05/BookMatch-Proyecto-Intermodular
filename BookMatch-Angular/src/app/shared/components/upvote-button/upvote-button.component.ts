import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VotesService, VoteType } from '@core/services/votes.service';

export interface UpvoteData {
  id: number;
  score: number;
  userVote?: VoteType | null;
}

@Component({
  selector: 'app-upvote-button',
  imports: [CommonModule],
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

  /**
   * Maneja el voto hacia arriba
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
   */
  private vote(type: VoteType): void {
    this.isVoting.set(true);

    this.votesService.upsertVote(this.forumId, this.postId, type).subscribe({
      next: () => {
        const previousVote = this.userVote();
        const previousScore = this.currentScore();

        // Calcular nuevo score
        let newScore = previousScore;
        if (previousVote === 'UP' && type === 'DOWN') {
          newScore -= 2; // Cambió de UP a DOWN: -2
        } else if (previousVote === 'DOWN' && type === 'UP') {
          newScore += 2; // Cambió de DOWN a UP: +2
        } else if (previousVote === null && type === 'UP') {
          newScore += 1; // Nuevo voto UP: +1
        } else if (previousVote === null && type === 'DOWN') {
          newScore -= 1; // Nuevo voto DOWN: -1
        }

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
      next: () => {
        const previousVote = this.userVote();
        const previousScore = this.currentScore();

        // Calcular nuevo score
        let newScore = previousScore;
        if (previousVote === 'UP') {
          newScore -= 1; // Eliminar voto UP: -1
        } else if (previousVote === 'DOWN') {
          newScore += 1; // Eliminar voto DOWN: +1
        }

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

