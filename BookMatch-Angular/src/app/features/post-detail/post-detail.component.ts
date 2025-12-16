import { Component, OnInit, OnDestroy, inject, signal, HostListener, computed } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PostsService } from '@core/services/posts.service';
import { AuthService } from '@core/services/auth.service';
import { Post, UpdatePostDto } from '@shared/models/posts.model';
import { Header } from '@shared/components/header/header';
import { CommentThreadComponent } from '@shared/components/comment-thread/comment-thread.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-post-detail',
  imports: [Header, ReactiveFormsModule, CommentThreadComponent, TranslateModule, RelativeTimePipe],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  router = inject(Router); // Público para usar en el template
  isAdmin = this.authService.isAdmin;

  forumId = signal<number | null>(null);
  postId = signal<number | null>(null);
  post = signal<Post | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Menú de opciones
  showMenu = signal<boolean>(false);

  // Modal de editar
  showEditModal = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  updateError = signal<string | null>(null);
  editForm!: FormGroup;

  // Modal de confirmar borrar
  showDeleteModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.route.params.subscribe(params => {
      const forumId = Number(params['forumId']);
      const postId = Number(params['postId']);
      
      if (!isNaN(forumId) && !isNaN(postId)) {
        this.forumId.set(forumId);
        this.postId.set(postId);
        this.loadPost();
      } else {
        this.error.set('ID de foro o post inválido');
        this.isLoading.set(false);
      }
    });
  }

  loadPost(): void {
    const forumId = this.forumId();
    const postId = this.postId();
    
    if (!forumId || !postId) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.postsService.getPostById(forumId, postId).subscribe({
      next: (post) => {
        this.post.set(post);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando post:', err);
        this.error.set(err.error?.message || 'Error al cargar el post');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    const forumId = this.forumId();
    if (forumId) {
      this.router.navigate(['/foro', forumId]);
    } else {
      this.router.navigate(['/foro']);
    }
  }

  getAuthorName(): string {
    const post = this.post();
    return post?.author?.fullName || 'Usuario';
  }

  getAuthorAvatar(): string | null {
    const post = this.post();
    return post?.author?.avatarUrl || null;
  }

  getCommentCount(): number {
    const post = this.post();
    return post?._count?.comments || 0;
  }

  isAuthor(): boolean {
    const post = this.post();
    const currentUser = this.authService.currentUser();
    return post && currentUser ? post.authorId === currentUser.id : false;
  }

  canModify(): boolean {
    const post = this.post();
    const currentUser = this.authService.currentUser();
    if (!post || !currentUser) return false;
    
    const isAuthor = post.authorId === currentUser.id;
    const isAdmin = this.authService.isAdmin();
    
    return isAuthor || isAdmin;
  }

  toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }

  openEditModal(): void {
    const post = this.post();
    if (!post) return;

    this.editForm.patchValue({
      title: post.title,
      content: post.content
    });
    this.showEditModal.set(true);
    this.updateError.set(null);
    this.closeMenu();
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.updateError.set(null);
    this.editForm.reset();
  }

  updatePost(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const forumId = this.forumId();
    const postId = this.postId();
    if (!forumId || !postId) return;

    this.isUpdating.set(true);
    this.updateError.set(null);

    const formValue = this.editForm.value;
    const updateData: UpdatePostDto = {
      title: formValue.title.trim(),
      content: formValue.content.trim()
    };

    this.postsService.updatePost(forumId, postId, updateData).subscribe({
      next: (updatedPost) => {
        console.log('✅ Post actualizado:', updatedPost);
        this.isUpdating.set(false);
        this.closeEditModal();
        this.loadPost(); // Recargar el post actualizado
      },
      error: (err: any) => {
        console.error('❌ Error actualizando post:', err);
        let errorMessage = 'Error al actualizar el post';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 403) {
          errorMessage = 'No tienes permiso para editar este post';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.updateError.set(errorMessage);
        this.isUpdating.set(false);
      }
    });
  }

  openDeleteModal(): void {
    this.showDeleteModal.set(true);
    this.closeMenu();
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  deletePost(): void {
    const forumId = this.forumId();
    const postId = this.postId();
    if (!forumId || !postId) return;

    this.isDeleting.set(true);

    this.postsService.deletePost(forumId, postId).subscribe({
      next: () => {
        console.log('✅ Post eliminado');
        this.isDeleting.set(false);
        this.closeDeleteModal();
        // Volver al foro después de eliminar
        this.goBack();
      },
      error: (err: any) => {
        console.error('❌ Error eliminando post:', err);
        let errorMessage = 'Error al eliminar el post';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 403) {
          errorMessage = 'No tienes permiso para eliminar este post';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        alert(errorMessage);
        this.isDeleting.set(false);
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.editForm?.get(fieldName);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Cerrar el menú si se hace clic fuera
    if (this.showMenu()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.closeMenu();
      }
    }
  }

  ngOnDestroy(): void {
    // Limpiar cualquier suscripción si es necesario
  }
}

