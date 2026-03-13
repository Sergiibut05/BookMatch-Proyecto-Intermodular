import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PostsService } from '@core/services/posts.service';
import { ForumsService } from '@core/services/forums.service';
import { AuthService } from '@core/services/auth.service';
import { VotesService } from '@core/services/votes.service';
import { StorageService } from '@core/services/storage';
import { Post, PostsListResponse, CreatePostDto } from '@shared/models/posts.model';
import { Forum, UpdateForumDto } from '@shared/models/forums.model';
import { Header } from '@shared/components/header/header';
import { UpvoteButtonComponent } from '@shared/components/upvote-button/upvote-button.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Listado de posts/temas de un foro: paginación, búsqueda, crear/editar/borrar post y foro (admin),
 * subida de imágenes y votos. Usa UpvoteButtonComponent y RelativeTimePipe.
 */
@Component({
  selector: 'app-forum-topic-list',
  imports: [Header, ReactiveFormsModule, UpvoteButtonComponent, TranslateModule, RelativeTimePipe],
  templateUrl: './forum-topic-list.component.html',
  styleUrl: './forum-topic-list.component.scss',
})
export class ForumTopicListComponent implements OnInit, OnDestroy {
  private postsService = inject(PostsService);
  private forumsService = inject(ForumsService);
  private authService = inject(AuthService);
  private votesService = inject(VotesService);
  private storageService = inject(StorageService);
  private route = inject(ActivatedRoute);
  /** Router para navegación. */
  router = inject(Router);
  private fb = inject(FormBuilder);

  /** ID del foro (desde ruta). */
  forumId = signal<number | null>(null);
  /** Foro actual cargado. */
  forum = signal<Forum | null>(null);
  /** Posts del foro. */
  posts = signal<Post[]>([]);
  /** Posts filtrados por búsqueda. */
  filteredPosts = signal<Post[]>([]);
  /** Cargando datos. */
  isLoading = signal<boolean>(true);
  /** Mensaje de error. */
  error = signal<string | null>(null);

  /** Página actual. */
  currentPage = signal<number>(1);
  /** Total de páginas. */
  totalPages = signal<number>(1);
  /** Total de posts. */
  totalPosts = signal<number>(0);
  /** Posts por página. */
  limit = 10;

  /** Texto de búsqueda en posts. */
  searchQuery = signal<string>('');

  /** Modal de crear post visible. */
  showCreateModal = signal<boolean>(false);
  /** Enviando creación de post. */
  isCreating = signal<boolean>(false);
  /** Error al crear post. */
  createError = signal<string | null>(null);
  /** Formulario de nuevo post. */
  createForm!: FormGroup;
  /** URLs de imágenes del nuevo post. */
  createImages = signal<string[]>([]);
  /** Subiendo imagen. */
  isUploadingImage = signal<boolean>(false);
  /** Error al subir imagen. */
  uploadImageError = signal<string | null>(null);

  /** Menú de opciones del foro (editar/borrar) visible. */
  showForumMenu = signal<boolean>(false);

  /** Modal de editar foro visible. */
  showEditForumModal = signal<boolean>(false);
  /** Actualizando foro. */
  isUpdatingForum = signal<boolean>(false);
  /** Error al actualizar foro. */
  updateForumError = signal<string | null>(null);
  /** Formulario de edición del foro. */
  editForumForm!: FormGroup;

  /** Modal de confirmar borrar foro visible. */
  showDeleteForumModal = signal<boolean>(false);
  /** Eliminando foro. */
  isDeletingForum = signal<boolean>(false);

  /** Inicializa formularios y suscribe a params para cargar foro y posts. */
  ngOnInit(): void {
    this.createForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.editForumForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['']
    });

    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (!isNaN(id)) {
        this.forumId.set(id);
        this.loadForum();
        this.loadPosts();
      } else {
        this.error.set('ID de foro inválido');
        this.isLoading.set(false);
      }
    });
  }

  /** Carga el foro por ID. */
  loadForum(): void {
    const id = this.forumId();
    if (!id) return;

    this.forumsService.getForumById(id).subscribe({
      next: (forum) => {
        this.forum.set(forum);
      },
      error: (err: any) => {
        console.error('Error cargando foro:', err);
      }
    });
  }

  /** Carga posts del foro con paginación y votos del usuario. */
  loadPosts(page: number = 1): void {
    const id = this.forumId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.currentPage.set(page);

    
    this.postsService.getPostsByForumId(id, page, this.limit, 'score').subscribe({
      next: (response: PostsListResponse) => {
        const posts = response.items || [];
        
        
        this.posts.set(posts);
        this.filteredPosts.set(posts);
        this.totalPages.set(response.totalPages || 1);
        this.totalPosts.set(response.total || 0);
        this.isLoading.set(false);
        
        
        if (posts.length > 0) {
          this.loadUserVotesAsync(posts, id);
        }
      },
      error: (err: any) => {
        console.error('Error cargando posts:', err);
        this.error.set(err.error?.message || 'Error al cargar los posts');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Carga los votos del usuario para cada post de forma asíncrona (sin bloquear)
   */
  private loadUserVotesAsync(posts: Post[], forumId: number): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !posts || posts.length === 0) {
      return; 
    }


    const voteObservables = posts.map(post => 
      this.votesService.getUserVote(forumId, post.id).pipe(
        map(vote => ({ postId: post.id, userVote: vote?.type || null })),
        catchError(err => {
          console.warn(`Error cargando voto para post ${post.id}:`, err);
          return of({ postId: post.id, userVote: null });
        })
      )
    );

    forkJoin(voteObservables).subscribe({
      next: (results) => {
        // Actualizar los posts con los votos del usuario
        const currentPosts = this.posts();
        const updatedPosts = currentPosts.map(post => {
          const voteResult = results.find(r => r.postId === post.id);
          return voteResult ? { ...post, userVote: voteResult.userVote } : post;
        });
        this.posts.set(updatedPosts);
        this.filterPosts(this.searchQuery()); 
      },
      error: (err) => {
        console.error('Error cargando votos:', err);
      }
    });
  }

  /**
   * Maneja la actualización del score después de un voto
   */
  onScoreUpdated(postId: number, newScore: number): void {
    this.posts.update(posts =>
      posts.map(post => (post.id === postId ? { ...post, score: newScore } : post))
    );
    this.filterPosts(this.searchQuery()); 
  }

  /** Actualiza la búsqueda y filtra posts. */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.filterPosts(query);
  }

  /** Filtra posts por título, contenido o nombre de autor. */
  filterPosts(query: string): void {
    const allPosts = this.posts();
    if (!query || query.trim() === '') {
      this.filteredPosts.set(allPosts);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = allPosts.filter(post =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.author?.fullName?.toLowerCase().includes(lowerQuery)
    );

    this.filteredPosts.set(filtered);
  }

  /** Cambia de página y hace scroll arriba. */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadPosts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Navega al detalle del post. */
  goToPost(postId: number): void {
    const forumId = this.forumId();
    if (forumId) {
      this.router.navigate(['/foro', forumId, 'tema', postId]);
    }
  }

  /** Abre el modal de crear post. */
  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.createError.set(null);
    this.createForm.reset();
    this.createImages.set([]);
    this.uploadImageError.set(null);
  }

  /** Cierra el modal de crear post. */
  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createError.set(null);
    this.createForm.reset();
    this.createImages.set([]);
    this.uploadImageError.set(null);
  }

  /**
   * Añade una imagen al nuevo post usando Firebase Storage
   */
  async addImageToPost(): Promise<void> {
    if (this.isUploadingImage()) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.uploadImageError.set('Debes iniciar sesión para añadir imágenes.');
      return;
    }

    try {
      this.isUploadingImage.set(true);
      this.uploadImageError.set(null);

      const photo = await this.storageService.takePhoto();
      if (!photo) {
        this.isUploadingImage.set(false);
        return;
      }

      const url = await this.storageService.uploadPostImage(photo, String(currentUser.id));
      this.createImages.update(images => [...images, url]);
    } catch (error: any) {
      console.error('Error añadiendo imagen al post:', error);
      this.uploadImageError.set(error?.message || 'Error al subir la imagen.');
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  /** Quita una imagen de la lista del nuevo post. */
  removeImageFromPost(index: number): void {
    this.createImages.update(images => images.filter((_, i) => i !== index));
  }

  /** Crea el post con título, contenido e imágenes. */
  createPost(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const forumId = this.forumId();
    if (!forumId) return;

    this.isCreating.set(true);
    this.createError.set(null);

    const formValue = this.createForm.value;
    const postData: CreatePostDto = {
      title: formValue.title.trim(),
      content: formValue.content.trim()
    };

    const images = this.createImages();
    if (images && images.length > 0) {
      (postData as any).images = images;
    }

    this.postsService.createPost(forumId, postData).subscribe({
      next: (newPost) => {
        this.isCreating.set(false);
        this.closeCreateModal();
        this.loadPosts(this.currentPage());
      },
      error: (err: any) => {
        console.error('Error creando post:', err);
        let errorMessage = 'Error al crear el post';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos. Verifica que el título tenga entre 3 y 200 caracteres y el contenido al menos 10 caracteres.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.createError.set(errorMessage);
        this.isCreating.set(false);
      }
    });
  }

  /** Nombre del autor del post o 'Usuario'. */
  getAuthorName(post: Post): string {
    return post.author?.fullName || 'Usuario';
  }

  /** Avatar del autor o null. */
  getAuthorAvatar(post: Post): string | null {
    return post.author?.avatarUrl || null;
  }

  /** Número de comentarios del post. */
  getCommentCount(post: Post): number {
    return post._count?.comments || 0;
  }

  /** Números de página para la paginación. */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else if (end === total) {
        start = Math.max(1, end - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /** Mensaje de error del campo del formulario de crear post. */
  getFieldError(fieldName: string): string | null {
    const field = this.createForm?.get(fieldName);
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

  /** True si el usuario actual es el creador del foro. */
  isForumCreator(): boolean {
    const forum = this.forum();
    const currentUser = this.authService.currentUser();
    return forum && currentUser ? forum.creatorId === currentUser.id : false;
  }

  /** Alterna la visibilidad del menú del foro. */
  toggleForumMenu(): void {
    this.showForumMenu.set(!this.showForumMenu());
  }

  /** Cierra el menú del foro. */
  closeForumMenu(): void {
    this.showForumMenu.set(false);
  }

  /** Abre el modal de editar foro con los datos actuales. */
  openEditForumModal(): void {
    const forum = this.forum();
    if (!forum) return;

    this.editForumForm.patchValue({
      title: forum.title,
      description: forum.description || ''
    });
    this.showEditForumModal.set(true);
    this.updateForumError.set(null);
    this.closeForumMenu();
  }

  /** Cierra el modal de editar foro. */
  closeEditForumModal(): void {
    this.showEditForumModal.set(false);
    this.updateForumError.set(null);
    this.editForumForm.reset();
  }

  /** Envía la actualización del foro a la API. */
  updateForum(): void {
    if (this.editForumForm.invalid) {
      this.editForumForm.markAllAsTouched();
      return;
    }

    const forumId = this.forumId();
    if (!forumId) return;

    this.isUpdatingForum.set(true);
    this.updateForumError.set(null);

    const formValue = this.editForumForm.value;
    const updateData: UpdateForumDto = {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || undefined
    };

    this.forumsService.updateForum(forumId, updateData).subscribe({
      next: (updatedForum) => {
        this.isUpdatingForum.set(false);
        this.closeEditForumModal();
        this.loadForum(); 
      },
      error: (err: any) => {
        console.error('Error actualizando foro:', err);
        let errorMessage = 'Error al actualizar el foro';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 403) {
          errorMessage = 'No tienes permiso para editar este foro';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.updateForumError.set(errorMessage);
        this.isUpdatingForum.set(false);
      }
    });
  }

  /** Abre el modal de confirmar borrar foro. */
  openDeleteForumModal(): void {
    this.showDeleteForumModal.set(true);
    this.closeForumMenu();
  }

  /** Cierra el modal de confirmar borrar foro. */
  closeDeleteForumModal(): void {
    this.showDeleteForumModal.set(false);
  }

  /** Elimina el foro y navega a /foro. */
  deleteForum(): void {
    const forumId = this.forumId();
    if (!forumId) return;

    this.isDeletingForum.set(true);

    this.forumsService.deleteForum(forumId).subscribe({
      next: () => {
        this.isDeletingForum.set(false);
        this.closeDeleteForumModal();

        this.router.navigate(['/foro']);
      },
      error: (err: any) => {
        console.error('Error eliminando foro:', err);
        let errorMessage = 'Error al eliminar el foro';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 403) {
          errorMessage = 'No tienes permiso para eliminar este foro';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        alert(errorMessage);
        this.isDeletingForum.set(false);
      }
    });
  }

  /** Mensaje de error del campo del formulario de editar foro. */
  getForumFieldError(fieldName: string): string | null {
    const field = this.editForumForm?.get(fieldName);
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

  /** Cierra el menú del foro al hacer click fuera. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Cerrar el menú si se hace clic fuera
    if (this.showForumMenu()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.forum-menu-container')) {
        this.closeForumMenu();
      }
    }
  }

  /** Limpieza al destruir el componente. */
  ngOnDestroy(): void {
    
  }
}

