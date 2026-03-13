import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ForumsService } from '@core/services/forums.service';
import { Forum, ForumsListResponse, CreateForumDto } from '@shared/models/forums.model';
import { Header } from '@shared/components/header/header';

/**
 * Listado de foros con paginación; permite crear foros (modal) y navegar a cada foro.
 */
@Component({
  selector: 'app-forum-index',
  imports: [CommonModule, Header, ReactiveFormsModule, TranslateModule],
  templateUrl: './forum-index.component.html',
  styleUrl: './forum-index.component.scss',
})
export class ForumIndexComponent implements OnInit {
  private forumsService = inject(ForumsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  /** Lista de foros de la página actual. */
  forums = signal<Forum[]>([]);
  /** Cargando foros. */
  isLoading = signal<boolean>(true);
  /** Mensaje de error. */
  error = signal<string | null>(null);

  /** Página actual. */
  currentPage = signal<number>(1);
  /** Total de páginas. */
  totalPages = signal<number>(1);
  /** Total de foros. */
  totalForums = signal<number>(0);
  /** Foros por página. */
  limit = 12;

  /** Modal de crear foro visible. */
  showCreateModal = signal<boolean>(false);
  /** Enviando creación. */
  isCreating = signal<boolean>(false);
  /** Error al crear. */
  createError = signal<string | null>(null);
  /** Formulario de creación. */
  createForm!: FormGroup;

  /** Inicializa el formulario y carga la primera página. */
  ngOnInit(): void {
    this.createForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['']
    });
    this.loadForums();
  }

  /** Carga la página de foros. */
  loadForums(page: number = 1): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.currentPage.set(page);


    this.forumsService.getForums(page, this.limit).subscribe({
      next: (response: ForumsListResponse) => {
        
        this.forums.set(response.items || []);
        this.totalPages.set(response.totalPages || 1);
        this.totalForums.set(response.total || 0);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando foros:', err);
        console.error('Error completo:', JSON.stringify(err, null, 2));
        console.error('Status:', err.status);
        console.error('Error message:', err.error);
        this.error.set(err.error?.message || err.message || 'Error al cargar los foros');
        this.isLoading.set(false);
      }
    });
  }

  /** Navega al detalle del foro. */
  goToForum(forumId: number): void {
    this.router.navigate(['/foro', forumId]);
  }

  /** Cambia a otra página y hace scroll arriba. */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadForums(page);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Nombre del creador o 'Usuario'. */
  getCreatorName(forum: Forum): string {
    return forum.creator?.fullName || 'Usuario';
  }

  /** Avatar del creador o null. */
  getCreatorAvatar(forum: Forum): string | null {
    return forum.creator?.avatarUrl || null;
  }

  /** Número de posts del foro. */
  getTotalPosts(forum: Forum): number {
    return forum._count?.posts || 0;
  }

  /** Números de página a mostrar en la paginación. */
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

  /** Abre el modal de crear foro. */
  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.createError.set(null);
    this.createForm.reset();
  }

  /** Cierra el modal de crear foro. */
  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createError.set(null);
    this.createForm.reset();
  }

  /** Crea el foro con los datos del formulario. */
  createForum(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.createError.set(null);

    const formValue = this.createForm.value;
    
    
    const forumData: CreateForumDto = {
      title: formValue.title.trim()
    };
    
    if (formValue.description && formValue.description.trim()) {
      forumData.description = formValue.description.trim();
    }

    

    this.forumsService.createForum(forumData).subscribe({
      next: (newForum) => {
        
        this.isCreating.set(false);
        this.closeCreateModal();
        // Recargar la lista de foros
        this.loadForums(this.currentPage());
      },
      error: (err: any) => {
        console.error('Error creando foro:', err);
        console.error('Status:', err.status);
        console.error('Error completo:', JSON.stringify(err, null, 2));
        
        let errorMessage = 'Error al crear el foro';
        if (err.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos. Verifica que el título tenga entre 3 y 100 caracteres.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.createError.set(errorMessage);
        this.isCreating.set(false);
      }
    });
  }

  /** Mensaje de error del campo del formulario. */
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
}

