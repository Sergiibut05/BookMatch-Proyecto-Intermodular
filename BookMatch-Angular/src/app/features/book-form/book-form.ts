import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Header } from '@shared/components/header/header';
import { CatalogService } from '@core/services/catalog.service';
import { AuthService } from '@core/services/auth.service';
import { StorageService } from '@core/services/storage';
import { Category, CreateCatalogBookDto } from '@shared/models';

@Component({
    selector: 'app-book-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Header, TranslateModule],
    templateUrl: './book-form.html',
    styles: [`
        :host { display: block; }
    `]
})
export class BookFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private catalogService = inject(CatalogService);
    private authService = inject(AuthService);
    private storageService = inject(StorageService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    bookForm!: FormGroup;
    categories = signal<Category[]>([]);
    
    isEditMode = signal<boolean>(false);
    bookId = signal<number | null>(null);
    
    isLoading = signal<boolean>(false);
    isUploading = signal<boolean>(false);
    error = signal<string | null>(null);
    
    currentCoverUrl = signal<string | null>(null);

    ngOnInit(): void {
        if (!this.authService.isAdmin()) {
        alert('Acceso denegado. Solo administradores.');
        this.router.navigate(['/home']);
        return;
        }
        this.initForm();
        this.loadCategories();
        this.route.params.subscribe(params => {
        if (params['id']) {
            this.isEditMode.set(true);
            this.bookId.set(Number(params['id']));
            this.loadBookData(Number(params['id']));
        }
        });
    }

    private initForm(): void {
        this.bookForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        author: ['', [Validators.required]],
        isbn: ['', [Validators.required]],
        price: [0, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        description: ['', [Validators.maxLength(2000)]],
        categoryId: [null, [Validators.required]],
        coverUrl: ['']
        });
    }

    loadCategories(): void {
        this.catalogService.getCategories().subscribe({
        next: (cats) => this.categories.set(cats),
        error: (err) => console.error('Error cargando categorías', err)
        });
    }

    loadBookData(id: number): void {
        this.isLoading.set(true);
        this.catalogService.getBookById(id).subscribe({
        next: (book) => {
            this.bookForm.patchValue({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            price: book.price,
            stock: book.stock,
            description: book.description,
            coverUrl: book.coverUrl,
            categoryId: book.categories && book.categories.length > 0 ? book.categories[0].id : null
            });
            
            if (book.coverUrl) {
            this.currentCoverUrl.set(book.coverUrl);
            }
            
            this.isLoading.set(false);
        },
        error: (err) => {
            this.error.set('Error al cargar el libro');
            this.isLoading.set(false);
        }
        });
    }

    async uploadCover(): Promise<void> {
        try {
        this.error.set(null);
        const photo = await this.storageService.takePhoto();
        
        if (!photo) return;

        this.isUploading.set(true);
        const userId = this.authService.currentUser()?.firebaseUid || 'admin_uploads';
        const downloadUrl = await this.storageService.uploadPhoto(photo, userId, null);
        
        this.currentCoverUrl.set(downloadUrl);
        this.bookForm.patchValue({ coverUrl: downloadUrl });
        this.isUploading.set(false);

        } catch (err: any) {
        console.error('Error subiendo portada:', err);
        this.error.set('Error al subir la imagen');
        this.isUploading.set(false);
        }
    }

    onSubmit(): void {
        if (this.bookForm.invalid) {
        this.bookForm.markAllAsTouched();
        return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        const formValue = this.bookForm.value;
        const bookData: any = {
        title: formValue.title,
        author: formValue.author,
        isbn: formValue.isbn,
        price: Number(formValue.price),
        stock: Number(formValue.stock),
        description: formValue.description,
        coverUrl: formValue.coverUrl,
        categoryIds: formValue.categoryId ? [Number(formValue.categoryId)] : []
        };

        if (this.isEditMode() && this.bookId()) {
        this.catalogService.updateBook(this.bookId()!, bookData).subscribe({
            next: () => {
            alert('Libro actualizado correctamente');
            this.router.navigate(['/book-details', this.bookId()]);
            },
            error: (err) => {
            this.error.set(err.error?.message || 'Error al actualizar libro');
            this.isLoading.set(false);
            }
        });
        } else {
        this.catalogService.createBook(bookData).subscribe({
            next: () => {
            alert('Libro creado correctamente');
            this.router.navigate(['/home']);
            },
            error: (err) => {
            this.error.set(err.error?.message || 'Error al crear libro');
            this.isLoading.set(false);
            }
        });
        }
    }

    getFieldError(fieldName: string): string | null {
        const field = this.bookForm.get(fieldName);
        if (!field || !field.touched || !field.errors) return null;
        if (field.errors['required']) return 'Este campo es obligatorio';
        if (field.errors['minlength']) return 'Texto demasiado corto';
        if (field.errors['min']) return 'El valor debe ser positivo';
        return 'Campo inválido';
    }
}