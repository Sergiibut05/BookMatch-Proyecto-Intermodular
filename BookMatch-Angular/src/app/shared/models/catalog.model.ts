/**
 * Interfaces para el catálogo de libros
 */

export interface Category {
    id: number;
    name: string;
    slug: string;
    type: 'MAIN' | 'SPECIAL';
    icon?: string;
    description?: string;
  }
  
  export interface CatalogBook {
    id: number;
    title: string;
    author: string;
    isbn: string;
    description?: string;
    coverUrl?: string;
    imageUrls: string[];
    price: number;
    stock: number;
    categories?: Category[];
    reviews?: Review[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  // DTOs (Data Transfer Objects) para crear/actualizar
  export interface CreateCatalogBookDto {
    title: string;
    author: string;
    isbn: string;
    description?: string;
    coverUrl?: string;
    imageUrls?: string[];
    price: number;
    stock: number;
    categoryIds?: number[]; // IDs de categorías a asignar
  }
  
  export interface UpdateCatalogBookDto extends Partial<CreateCatalogBookDto> {}

  export interface Review {
    id: number;
    catalogBookId: number;
    userId: number;
    rating: number; // 1-5
    comment?: string;
    createdAt: string;
  }