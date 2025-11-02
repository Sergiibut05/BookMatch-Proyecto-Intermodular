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
  
  export interface CatalogBookCategory {
    id: number;
    catalogBookId: number;
    categoryId: number;
    category: Category;
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
    categories?: CatalogBookCategory[];
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