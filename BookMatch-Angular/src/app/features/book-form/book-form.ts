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
import { TranslateService } from '@ngx-translate/core';

/**
 * Formulario de alta/edición de libro en catálogo (solo admin).
 * Incluye categorías, portada y subida de imágenes a Firebase Storage.
 */
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
    private translate = inject(TranslateService);

    /** Formulario reactivo del libro. */
    bookForm!: FormGroup;
    /** Lista de categorías para el select. */
    categories = signal<Category[]>([]);

    /** True si estamos editando un libro existente. */
    isEditMode = signal<boolean>(false);
    /** ID del libro en edición. */
    bookId = signal<number | null>(null);

    /** Cargando datos. */
    isLoading = signal<boolean>(false);
    /** Subiendo imagen. */
    isUploading = signal<boolean>(false);
    /** Mensaje de error. */
    error = signal<string | null>(null);

    /** URL actual de la portada (edición). */
    currentCoverUrl = signal<string | null>(null);

    /** Comprueba admin, inicializa formulario y carga libro si hay id en ruta. */
    ngOnInit(): void {
        if (!this.authService.isAdmin()) {
        alert(this.translate.instant('BOOK_FORM.ERRORS.ACCESS_DENIED'));
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
            this.error.set(this.translate.instant('BOOK_FORM.ERRORS.LOAD_BOOK'));
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
        this.error.set(this.translate.instant('BOOK_FORM.ERRORS.UPLOAD_IMAGE'));
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
            alert(this.translate.instant('BOOK_FORM.SUCCESS.UPDATE'));
            this.router.navigate(['/book-details', this.bookId()]);
            },
            error: (err) => {
            this.error.set(err.error?.message || this.translate.instant('BOOK_FORM.ERRORS.UPDATE_BOOK'));
            this.isLoading.set(false);
            }
        });
        } else {
        this.catalogService.createBook(bookData).subscribe({
            next: () => {
            alert(this.translate.instant('BOOK_FORM.SUCCESS.CREATE'));
            this.router.navigate(['/home']);
            },
            error: (err) => {
            this.error.set(err.error?.message || this.translate.instant('BOOK_FORM.ERRORS.CREATE_BOOK'));
            this.isLoading.set(false);
            }
        });
        }
    }

    getFieldError(fieldName: string): string | null {
        const field = this.bookForm.get(fieldName);
        if (!field || !field.touched || !field.errors) return null;
        if (field.errors['required']) return this.translate.instant('BOOK_FORM.VALIDATION.REQUIRED');
        if (field.errors['minlength']) return this.translate.instant('BOOK_FORM.VALIDATION.MIN_LENGTH');
        if (field.errors['min']) return this.translate.instant('BOOK_FORM.VALIDATION.MIN_VALUE');
        return this.translate.instant('BOOK_FORM.VALIDATION.INVALID');
    }
}