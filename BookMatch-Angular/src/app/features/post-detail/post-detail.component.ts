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
import { IsAdminDirective } from '@core/directives/is-admin.directive';

/**
 * Detalle de un post/tema: contenido, imágenes, votos, comentarios en hilo.
 * Permite editar/borrar (admin o autor), ampliar imágenes y votar.
 */
@Component({
  selector: 'app-post-detail',
  imports: [Header, ReactiveFormsModule, CommentThreadComponent, TranslateModule, RelativeTimePipe, IsAdminDirective],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  /** Router para navegación. */
  router = inject(Router);
  /** Signal que indica si el usuario actual es admin. */
  isAdmin = this.authService.isAdmin;

  /** ID del foro actual (desde ruta). */
  forumId = signal<number | null>(null);
  /** ID del post actual (desde ruta). */
  postId = signal<number | null>(null);
  /** Post cargado desde la API. */
  post = signal<Post | null>(null);
  /** Cargando detalle del post. */
  isLoading = signal<boolean>(true);
  /** Mensaje de error si falla la carga. */
  error = signal<string | null>(null);

  /** Si el modal de imagen ampliada está visible. */
  showImageModal = signal<boolean>(false);
  /** URL de la imagen seleccionada en el modal. */
  selectedImageUrl = signal<string | null>(null);

  /** Si el menú de opciones (editar/borrar) está abierto. */
  showMenu = signal<boolean>(false);

  /** Si el modal de editar post está visible. */
  showEditModal = signal<boolean>(false);
  /** Enviando actualización del post. */
  isUpdating = signal<boolean>(false);
  /** Error al actualizar el post. */
  updateError = signal<string | null>(null);
  /** Formulario reactivo para editar título y contenido. */
  editForm!: FormGroup;

  /** Si el modal de confirmar borrado está visible. */
  showDeleteModal = signal<boolean>(false);
  /** Eliminando el post. */
  isDeleting = signal<boolean>(false);

  /** Inicializa el formulario de edición y suscribe a params para cargar el post. */
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

  /** Abre el modal con la imagen ampliada. */
  openImageModal(imageUrl: string): void {
    this.selectedImageUrl.set(imageUrl);
    this.showImageModal.set(true);
  }

  /** Cierra el modal de imagen. */
  closeImageModal(): void {
    this.showImageModal.set(false);
    this.selectedImageUrl.set(null);
  }

  /** Carga el post por forumId y postId desde la API. */
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

  /** Navega de vuelta al listado del foro o a /foro. */
  goBack(): void {
    const forumId = this.forumId();
    if (forumId) {
      this.router.navigate(['/foro', forumId]);
    } else {
      this.router.navigate(['/foro']);
    }
  }

  /** Nombre del autor del post o 'Usuario'. */
  getAuthorName(): string {
    const post = this.post();
    return post?.author?.fullName || 'Usuario';
  }

  /** URL del avatar del autor o null. */
  getAuthorAvatar(): string | null {
    const post = this.post();
    return post?.author?.avatarUrl || null;
  }

  /** Número de comentarios del post. */
  getCommentCount(): number {
    const post = this.post();
    return post?._count?.comments || 0;
  }

  /** True si el usuario actual es el autor del post. */
  isAuthor(): boolean {
    const post = this.post();
    const currentUser = this.authService.currentUser();
    return post && currentUser ? post.authorId === currentUser.id : false;
  }

  /** True si el usuario puede editar/borrar (autor o admin). */
  canModify(): boolean {
    const post = this.post();
    const currentUser = this.authService.currentUser();
    if (!post || !currentUser) return false;
    
    const isAuthor = post.authorId === currentUser.id;
    const isAdmin = this.authService.isAdmin();
    
    return isAuthor || isAdmin;
  }

  /** Alterna la visibilidad del menú de opciones. */
  toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  /** Cierra el menú de opciones. */
  closeMenu(): void {
    this.showMenu.set(false);
  }

  /** Abre el modal de edición con los datos actuales del post. */
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

  /** Cierra el modal de edición y resetea el formulario. */
  closeEditModal(): void {
    this.showEditModal.set(false);
    this.updateError.set(null);
    this.editForm.reset();
  }

  /** Envía la actualización del post a la API y recarga. */
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
        
        this.isUpdating.set(false);
        this.closeEditModal();
        this.loadPost(); // Recargar el post actualizado
      },
      error: (err: any) => {
        console.error('Error actualizando post:', err);
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

  /** Abre el modal de confirmar borrado. */
  openDeleteModal(): void {
    this.showDeleteModal.set(true);
    this.closeMenu();
  }

  /** Cierra el modal de confirmar borrado. */
  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  /** Elimina el post en la API y navega al foro. */
  deletePost(): void {
    const forumId = this.forumId();
    const postId = this.postId();
    if (!forumId || !postId) return;

    this.isDeleting.set(true);

    this.postsService.deletePost(forumId, postId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        // Volver al foro después de eliminar
        this.goBack();
      },
      error: (err: any) => {
        console.error('Error eliminando post:', err);
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

  /** Mensaje de error del campo del formulario de edición. */
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

  /** Cierra el menú al hacer click fuera. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    
    if (this.showMenu()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.closeMenu();
      }
    }
  }

  /** Limpieza al destruir el componente. */
  ngOnDestroy(): void {
    
  }
}

