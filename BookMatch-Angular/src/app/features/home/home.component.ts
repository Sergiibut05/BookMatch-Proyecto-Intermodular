import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '@core/services/catalog.service';
import { CatalogBook } from '@shared/models';
import { Header } from '@shared/components/header/header';


@Component({
  selector: 'app-home',
  imports: [CommonModule, Header],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private catalogService = inject(CatalogService);

  
  books = signal<CatalogBook[]>([]);
  constructor() {
    this.catalogService.getAllBooks().subscribe({
      next: (books) => {
        this.books.set(books);
      },
      error: (error) => {
        console.error('Error al obtener los libros:', error);
      }
    });
  }


  
}
