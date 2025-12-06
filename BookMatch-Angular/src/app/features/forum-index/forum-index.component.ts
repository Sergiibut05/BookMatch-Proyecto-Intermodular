import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ForumsService } from '@core/services/forums.service';
import { Forum, ForumsListResponse, CreateForumDto } from '@shared/models/forums.model';
import { Header } from '@shared/components/header/header';

@Component({
  selector: 'app-forum-index',
  imports: [CommonModule, Header, ReactiveFormsModule],
  templateUrl: './forum-index.component.html',
  styleUrl: './forum-index.component.scss',
})
export class ForumIndexComponent implements OnInit {
  private forumsService = inject(ForumsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  forums = signal<Forum[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Paginación
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalForums = signal<number>(0);
  limit = 12; // Foros por página

  // Modal de crear foro
  showCreateModal = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  createError = signal<string | null>(null);
  createForm!: FormGroup;

  ngOnInit(): void {
    this.createForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['']
    });
    this.loadForums();
  }

  loadForums(page: number = 1): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.currentPage.set(page);

    console.log('🔍 Cargando foros, página:', page);

    this.forumsService.getForums(page, this.limit).subscribe({
      next: (response: ForumsListResponse) => {
        console.log('✅ Respuesta del backend:', response);
        console.log('📊 Foros recibidos:', response.items?.length || 0);
        
        this.forums.set(response.items || []);
        this.totalPages.set(response.totalPages || 1);
        this.totalForums.set(response.total || 0);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Error cargando foros:', err);
        console.error('❌ Error completo:', JSON.stringify(err, null, 2));
        console.error('❌ Status:', err.status);
        console.error('❌ Error message:', err.error);
        this.error.set(err.error?.message || err.message || 'Error al cargar los foros');
        this.isLoading.set(false);
      }
    });
  }

  goToForum(forumId: number): void {
    this.router.navigate(['/foro', forumId]);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadForums(page);
      // Scroll al inicio de la página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getCreatorName(forum: Forum): string {
    return forum.creator?.fullName || 'Usuario';
  }

  getCreatorAvatar(forum: Forum): string | null {
    return forum.creator?.avatarUrl || null;
  }

  getTotalPosts(forum: Forum): number {
    return forum._count?.posts || 0;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();
    
    // Mostrar máximo 5 páginas alrededor de la actual
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    // Ajustar si estamos cerca del inicio o final
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

  createForum(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.createError.set(null);

    const formValue = this.createForm.value;
    
    // Construir el payload: solo incluir description si tiene contenido
    const forumData: CreateForumDto = {
      title: formValue.title.trim()
    };
    
    if (formValue.description && formValue.description.trim()) {
      forumData.description = formValue.description.trim();
    }

    console.log('📤 Enviando datos del foro:', forumData);

    this.forumsService.createForum(forumData).subscribe({
      next: (newForum) => {
        console.log('✅ Foro creado:', newForum);
        this.isCreating.set(false);
        this.closeCreateModal();
        // Recargar la lista de foros
        this.loadForums(this.currentPage());
      },
      error: (err: any) => {
        console.error('❌ Error creando foro:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error completo:', JSON.stringify(err, null, 2));
        
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

