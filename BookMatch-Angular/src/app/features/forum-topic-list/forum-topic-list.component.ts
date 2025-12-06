import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PostsService } from '@core/services/posts.service';
import { ForumsService } from '@core/services/forums.service';
import { AuthService } from '@core/services/auth.service';
import { VotesService } from '@core/services/votes.service';
import { Post, PostsListResponse, CreatePostDto } from '@shared/models/posts.model';
import { Forum, UpdateForumDto } from '@shared/models/forums.model';
import { Header } from '@shared/components/header/header';
import { UpvoteButtonComponent } from '@shared/components/upvote-button/upvote-button.component';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-forum-topic-list',
  imports: [CommonModule, Header, ReactiveFormsModule, UpvoteButtonComponent],
  templateUrl: './forum-topic-list.component.html',
  styleUrl: './forum-topic-list.component.scss',
})
export class ForumTopicListComponent implements OnInit, OnDestroy {
  private postsService = inject(PostsService);
  private forumsService = inject(ForumsService);
  private authService = inject(AuthService);
  private votesService = inject(VotesService);
  private route = inject(ActivatedRoute);
  router = inject(Router); // Público para usar en el template
  private fb = inject(FormBuilder);

  forumId = signal<number | null>(null);
  forum = signal<Forum | null>(null);
  posts = signal<Post[]>([]);
  filteredPosts = signal<Post[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalPosts = signal<number>(0);
  limit = 10; // Posts por página
  
  // Búsqueda
  searchQuery = signal<string>('');
  
  // Modal de crear post
  showCreateModal = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  createError = signal<string | null>(null);
  createForm!: FormGroup;

  // Menú de opciones del foro
  showForumMenu = signal<boolean>(false);

  // Modal de editar foro
  showEditForumModal = signal<boolean>(false);
  isUpdatingForum = signal<boolean>(false);
  updateForumError = signal<string | null>(null);
  editForumForm!: FormGroup;

  // Modal de confirmar borrar foro
  showDeleteForumModal = signal<boolean>(false);
  isDeletingForum = signal<boolean>(false);

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

  loadPosts(page: number = 1): void {
    const id = this.forumId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.currentPage.set(page);

    // Ordenar por score por defecto
    this.postsService.getPostsByForumId(id, page, this.limit, 'score').subscribe({
      next: (response: PostsListResponse) => {
        const posts = response.items || [];
        
        // Mostrar posts inmediatamente sin esperar los votos
        this.posts.set(posts);
        this.filteredPosts.set(posts);
        this.totalPages.set(response.totalPages || 1);
        this.totalPosts.set(response.total || 0);
        this.isLoading.set(false);
        
        // Cargar los votos del usuario de forma asíncrona (sin bloquear)
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
      return; // Si no hay usuario o posts, no hacer nada
    }

    // Crear un array de observables para obtener los votos
    const voteObservables = posts.map(post => 
      this.votesService.getUserVote(forumId, post.id).pipe(
        map(vote => ({ postId: post.id, userVote: vote?.type || null })),
        // Manejar errores individuales para que no falle todo el forkJoin
        catchError(err => {
          console.warn(`Error cargando voto para post ${post.id}:`, err);
          return of({ postId: post.id, userVote: null });
        })
      )
    );

    // Ejecutar todas las peticiones en paralelo
    forkJoin(voteObservables).subscribe({
      next: (results) => {
        // Actualizar los posts con los votos del usuario
        const currentPosts = this.posts();
        const updatedPosts = currentPosts.map(post => {
          const voteResult = results.find(r => r.postId === post.id);
          return voteResult ? { ...post, userVote: voteResult.userVote } : post;
        });
        this.posts.set(updatedPosts);
        this.filterPosts(this.searchQuery()); // Re-filtrar para actualizar la lista filtrada
      },
      error: (err) => {
        console.error('Error cargando votos:', err);
        // No hacer nada si falla, los posts ya están mostrados
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
    this.filterPosts(this.searchQuery()); // Re-filtrar para reordenar si es necesario
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.filterPosts(query);
  }

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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadPosts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPost(postId: number): void {
    const forumId = this.forumId();
    if (forumId) {
      this.router.navigate(['/foro', forumId, 'tema', postId]);
    }
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.createError.set(null);
    this.createForm.reset();
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createError.set(null);
    this.createForm.reset();
  }

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

    this.postsService.createPost(forumId, postData).subscribe({
      next: (newPost) => {
        console.log('✅ Post creado:', newPost);
        this.isCreating.set(false);
        this.closeCreateModal();
        // Recargar la lista de posts
        this.loadPosts(this.currentPage());
      },
      error: (err: any) => {
        console.error('❌ Error creando post:', err);
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

  getAuthorName(post: Post): string {
    return post.author?.fullName || 'Usuario';
  }

  getAuthorAvatar(post: Post): string | null {
    return post.author?.avatarUrl || null;
  }

  getCommentCount(post: Post): number {
    return post._count?.comments || 0;
  }

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

  isForumCreator(): boolean {
    const forum = this.forum();
    const currentUser = this.authService.currentUser();
    return forum && currentUser ? forum.creatorId === currentUser.id : false;
  }

  toggleForumMenu(): void {
    this.showForumMenu.set(!this.showForumMenu());
  }

  closeForumMenu(): void {
    this.showForumMenu.set(false);
  }

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

  closeEditForumModal(): void {
    this.showEditForumModal.set(false);
    this.updateForumError.set(null);
    this.editForumForm.reset();
  }

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
        console.log('✅ Foro actualizado:', updatedForum);
        this.isUpdatingForum.set(false);
        this.closeEditForumModal();
        this.loadForum(); // Recargar el foro actualizado
      },
      error: (err: any) => {
        console.error('❌ Error actualizando foro:', err);
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

  openDeleteForumModal(): void {
    this.showDeleteForumModal.set(true);
    this.closeForumMenu();
  }

  closeDeleteForumModal(): void {
    this.showDeleteForumModal.set(false);
  }

  deleteForum(): void {
    const forumId = this.forumId();
    if (!forumId) return;

    this.isDeletingForum.set(true);

    this.forumsService.deleteForum(forumId).subscribe({
      next: () => {
        console.log('✅ Foro eliminado');
        this.isDeletingForum.set(false);
        this.closeDeleteForumModal();
        // Volver a la lista de foros después de eliminar
        this.router.navigate(['/foro']);
      },
      error: (err: any) => {
        console.error('❌ Error eliminando foro:', err);
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

  ngOnDestroy(): void {
    // Limpiar cualquier suscripción si es necesario
  }
}

