import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommentsService } from '@core/services/comments.service';
import { AuthService } from '@core/services/auth.service';
import { Comment, CreateCommentDto } from '@shared/models/comments.model';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-thread',
  imports: [CommonModule, ReactiveFormsModule, CommentItemComponent, TranslateModule],
  templateUrl: './comment-thread.component.html',
  styleUrl: './comment-thread.component.scss',
})
export class CommentThreadComponent implements OnInit {
  private commentsService = inject(CommentsService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @Input() forumId!: number;
  @Input() postId!: number;

  comments = signal<Comment[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Formularios de respuesta (uno por comentario)
  replyForms = new Map<number, FormGroup>();
  showReplyInput = signal<Map<number, boolean>>(new Map());
  isReplying = signal<Map<number, boolean>>(new Map());
  replyErrors = signal<Map<number, string | null>>(new Map());

  // Formulario para comentario principal
  mainCommentForm!: FormGroup;
  showMainInput = signal<boolean>(false);
  isSubmittingMain = signal<boolean>(false);
  mainCommentError = signal<string | null>(null);

  ngOnInit(): void {
    console.log('🔵 CommentThreadComponent inicializado');
    console.log('🔵 forumId:', this.forumId);
    console.log('🔵 postId:', this.postId);
    
    this.mainCommentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
    });

    this.loadComments();
  }

  loadComments(): void {
    console.log('🔵 Cargando comentarios para postId:', this.postId, 'forumId:', this.forumId);
    this.isLoading.set(true);
    this.error.set(null);

    this.commentsService.getCommentsByPostId(this.forumId, this.postId).subscribe({
      next: (comments) => {
        console.log('✅ Comentarios cargados:', comments);
        this.comments.set(comments);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Error cargando comentarios:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error completo:', JSON.stringify(err, null, 2));
        this.error.set(err.error?.message || 'Error al cargar los comentarios');
        this.isLoading.set(false);
      }
    });
  }

  toggleMainInput(): void {
    this.showMainInput.set(!this.showMainInput());
    this.mainCommentError.set(null);
    if (!this.showMainInput()) {
      this.mainCommentForm.reset();
    }
  }

  submitMainComment(): void {
    if (this.mainCommentForm.invalid) {
      this.mainCommentForm.markAllAsTouched();
      return;
    }

    this.isSubmittingMain.set(true);
    this.mainCommentError.set(null);

    const formValue = this.mainCommentForm.value;
    const commentData: CreateCommentDto = {
      content: formValue.content.trim()
    };

    this.commentsService.createComment(this.forumId, this.postId, commentData).subscribe({
      next: (newComment) => {
        console.log('✅ Comentario creado:', newComment);
        this.isSubmittingMain.set(false);
        this.mainCommentForm.reset();
        this.showMainInput.set(false);
        this.loadComments(); // Recargar comentarios
      },
      error: (err: any) => {
        console.error('❌ Error creando comentario:', err);
        let errorMessage = 'Error al crear el comentario';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.mainCommentError.set(errorMessage);
        this.isSubmittingMain.set(false);
      }
    });
  }

  toggleReplyInput(commentId: number): void {
    const current = this.showReplyInput();
    const newMap = new Map(current);
    const isShowing = newMap.get(commentId) || false;
    
    if (!isShowing) {
      // Crear formulario si no existe
      if (!this.replyForms.has(commentId)) {
        this.replyForms.set(commentId, this.fb.group({
          content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
        }));
      }
    }
    
    newMap.set(commentId, !isShowing);
    this.showReplyInput.set(newMap);
    
    // Limpiar error
    const errors = new Map(this.replyErrors());
    errors.set(commentId, null);
    this.replyErrors.set(errors);
  }

  submitReply(parentId: number): void {
    const form = this.replyForms.get(parentId);
    if (!form || form.invalid) {
      if (form) {
        form.markAllAsTouched();
      }
      return;
    }

    const isReplying = this.isReplying();
    const newMap = new Map(isReplying);
    newMap.set(parentId, true);
    this.isReplying.set(newMap);

    const errors = new Map(this.replyErrors());
    errors.set(parentId, null);
    this.replyErrors.set(errors);

    const formValue = form.value;
    const commentData: CreateCommentDto = {
      content: formValue.content.trim(),
      parentId: parentId
    };

    this.commentsService.createComment(this.forumId, this.postId, commentData).subscribe({
      next: (newComment) => {
        console.log('✅ Respuesta creada:', newComment);
        const replying = new Map(this.isReplying());
        replying.set(parentId, false);
        this.isReplying.set(replying);
        
        form.reset();
        const showing = new Map(this.showReplyInput());
        showing.set(parentId, false);
        this.showReplyInput.set(showing);
        
        this.loadComments(); // Recargar comentarios
      },
      error: (err: any) => {
        console.error('❌ Error creando respuesta:', err);
        let errorMessage = 'Error al crear la respuesta';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        const errors = new Map(this.replyErrors());
        errors.set(parentId, errorMessage);
        this.replyErrors.set(errors);
        
        const replying = new Map(this.isReplying());
        replying.set(parentId, false);
        this.isReplying.set(replying);
      }
    });
  }

  getAuthorName(comment: Comment): string {
    return comment.author?.fullName || 'Usuario';
  }

  getAuthorAvatar(comment: Comment): string | null {
    return comment.author?.avatarUrl || null;
  }

  getFieldError(commentId: number | 'main', fieldName: string): string | null {
    const form = commentId === 'main' 
      ? this.mainCommentForm 
      : this.replyForms.get(commentId);
    
    if (!form) return null;
    
    const field = form.get(fieldName);
    if (!field || !field.touched || !field.errors) return null;

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    return 'Campo inválido';
  }

  getReplyError(commentId: number): string | null {
    return this.replyErrors().get(commentId) || null;
  }

  isReplyingTo(commentId: number): boolean {
    return this.isReplying().get(commentId) ?? false;
  }

  isShowingReplyInput(commentId: number): boolean {
    return this.showReplyInput().get(commentId) ?? false;
  }

  getReplyForm(commentId: number): FormGroup | null {
    return this.replyForms.get(commentId) || null;
  }

  /**
   * Elimina un comentario
   */
  deleteComment(commentId: number): void {
    this.commentsService.deleteComment(commentId).subscribe({
      next: () => {
        console.log('✅ Comentario eliminado:', commentId);
        this.loadComments(); // Recargar comentarios
      },
      error: (err: any) => {
        console.error('❌ Error eliminando comentario:', err);
        let errorMessage = 'Error al eliminar el comentario';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 403) {
          errorMessage = 'No tienes permiso para eliminar este comentario';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        alert(errorMessage);
      }
    });
  }
}

