import { Component, Input, inject, signal, HostListener } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Comment } from '@shared/models/comments.model';
import { AuthService } from '@core/services/auth.service';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-comment-item',
  imports: [ReactiveFormsModule, CommentItemComponent, TranslateModule, RelativeTimePipe], // Importa a sí mismo para recursión
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss',
})
export class CommentItemComponent {
  private authService = inject(AuthService);

  @Input() comment!: Comment;
  @Input() forumId!: number;
  @Input() postId!: number;
  @Input() depth: number = 0; // Profundidad de anidación
  @Input() onReply!: (commentId: number) => void;
  @Input() onSubmitReply!: (parentId: number) => void;
  @Input() isShowingReplyInput!: (commentId: number) => boolean;
  @Input() isReplying!: (commentId: number) => boolean;
  @Input() getReplyForm!: (commentId: number) => FormGroup | null;
  @Input() getFieldError!: (commentId: number, fieldName: string) => string | null;
  @Input() getReplyError!: (commentId: number) => string | null;
  @Input() onReload!: () => void;
  @Input() onDelete!: (commentId: number) => void;

  // Estado del menú y modal
  showMenu = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  
  // Estado para expandir/colapsar comentario
  isExpanded = signal<boolean>(false);

  getAuthorName(): string {
    return this.comment.author?.fullName || 'Usuario';
  }

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
    // Aplicar indentación basada en la profundidad
    if (this.depth === 0) return '';
    return `ml-${Math.min(this.depth * 4, 16)}`; // Máximo 16 (4rem) de indentación
  }

  getBorderClass(): string {
    // Agregar borde izquierdo para comentarios anidados
    if (this.depth > 0) {
      return 'border-l-2 pl-4';
    }
    return '';
  }

  /**
   * Verifica si el comentario es lo suficientemente largo como para necesitar truncamiento
   */
  isLongComment(): boolean {
    // Consideramos un comentario largo si tiene más de 150 caracteres
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
    
    // Cerrar el modal después de un pequeño delay
    // El componente padre se encargará de recargar los comentarios
    setTimeout(() => {
      this.isDeleting.set(false);
      this.closeDeleteModal();
    }, 1000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Cerrar el menú si se hace clic fuera
    if (this.showMenu()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.comment-menu-container')) {
        this.closeMenu();
      }
    }
  }
}

