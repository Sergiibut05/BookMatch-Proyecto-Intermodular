import { Component, Input, inject, signal, HostListener } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Comment } from '@shared/models/comments.model';
import { AuthService } from '@core/services/auth.service';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

/**
 * Componente recursivo para representar un comentario individual del hilo.
 *
 * Incluye acciones de respuesta, estado expandido y menu de moderacion.
 *
 * @example
 * ```html
 * <app-comment-item
 *   [comment]="comment"
 *   [forumId]="forumId"
 *   [postId]="postId"
 * />
 * ```
 */
@Component({
  selector: 'app-comment-item',
  imports: [ReactiveFormsModule, CommentItemComponent, TranslateModule, RelativeTimePipe], 
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss',
})
export class CommentItemComponent {
  private authService = inject(AuthService);

  @Input() comment!: Comment;
  @Input() forumId!: number;
  @Input() postId!: number;
  @Input() depth: number = 0; 
  @Input() onReply!: (commentId: number) => void;
  @Input() onSubmitReply!: (parentId: number) => void;
  @Input() isShowingReplyInput!: (commentId: number) => boolean;
  @Input() isReplying!: (commentId: number) => boolean;
  @Input() getReplyForm!: (commentId: number) => FormGroup | null;
  @Input() getFieldError!: (commentId: number, fieldName: string) => string | null;
  @Input() getReplyError!: (commentId: number) => string | null;
  @Input() onReload!: () => void;
  @Input() onDelete!: (commentId: number) => void;

  showMenu = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  
  isExpanded = signal<boolean>(false);

  /**
   * Determina si el usuario actual puede modificar/eliminar el comentario.
   */
  canModify(): boolean {
    const currentUser = this.authService.currentUser();
    const isAuthor = currentUser ? this.comment.authorId === currentUser.id : false;
    const isAdmin = this.authService.isAdmin();
    return isAuthor || isAdmin;
  }
  /**
   * Indica si el usuario actual tiene rol administrador.
   */
  isAdmin() {
    return this.authService.isAdmin();
  }

  /**
   * Devuelve nombre visible del autor.
   */
  getAuthorName(): string {
    return this.comment.author?.fullName || 'Usuario';
  }

  /**
   * Devuelve avatar del autor o `null` si no existe.
   */
  getAuthorAvatar(): string | null {
    return this.comment.author?.avatarUrl || null;
  }

  hasChildren(): boolean {
    return !!(this.comment.children && this.comment.children.length > 0);
  }

  getChildren(): Comment[] {
    return this.comment.children || [];
  }

  getIndentClass(): string {
    if (this.depth === 0) return '';
    return `ml-${Math.min(this.depth * 4, 16)}`;
  }

  getBorderClass(): string {
    if (this.depth > 0) {
      return 'border-l-2 pl-4';
    }
    return '';
  }

  /**
   * Verifica si el comentario es lo suficientemente largo como para necesitar truncamiento
   */
  isLongComment(): boolean {
    return this.comment.content.length > 150;
  }

  /**
   * Alterna el estado expandido/colapsado del comentario
   */
  toggleExpand(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  /**
   * Verifica si el usuario actual es el autor del comentario
   */
  isAuthor(): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser ? this.comment.authorId === currentUser.id : false;
  }

  /**
   * Abre/cierra el menú de opciones
   */
  toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  /**
   * Cierra el menú de opciones
   */
  closeMenu(): void {
    this.showMenu.set(false);
  }

  /**
   * Abre el modal de confirmación de eliminación
   */
  openDeleteModal(): void {
    this.showDeleteModal.set(true);
    this.closeMenu();
  }

  /**
   * Cierra el modal de confirmación de eliminación
   */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  /**
   * Elimina el comentario
   */
  deleteComment(): void {
    if (this.isDeleting()) return; // Evitar múltiples llamadas
    
    this.isDeleting.set(true);
    
    this.onDelete(this.comment.id);
    
    setTimeout(() => {
      this.isDeleting.set(false);
      this.closeDeleteModal();
    }, 1000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showMenu()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.comment-menu-container')) {
        this.closeMenu();
      }
    }
  }
}

