/**
 * Interfaces para el catálogo de libros
 */

/** Autor de una reseña: id, nombre y avatar. */
export interface ReviewAuthor {
  /** ID del usuario. */
  id: number;
  /** Nombre completo o null. */
  fullName: string | null;
  /** URL del avatar o null. */
  avatarUrl: string | null;
}

/**
 * Categoría del catálogo: MAIN o SPECIAL, con slug y opcionalmente parentId para jerarquía.
 */
export interface Category {
  /** ID de la categoría. */
  id: number;
  /** Nombre mostrado. */
  name: string;
  /** Slug para URL. */
  slug: string;
  /** Tipo MAIN o SPECIAL. */
  type: 'MAIN' | 'SPECIAL';
  /** ID de la categoría padre si es jerárquica. */
  parentId?: number | null;
  /** Icono opcional. */
  icon?: string;
  /** Descripción opcional. */
  description?: string;
}

/**
 * Libro del catálogo: datos de venta, stock, portada, imágenes y categorías/reseñas expandidas.
 */
export interface CatalogBook {
  /** ID del libro. */
  id: number;
  /** Título del libro. */
  title: string;
  /** Autor. */
  author: string;
  /** ISBN. */
  isbn: string;
  /** Descripción opcional. */
  description?: string;
  /** URL de la portada. */
  coverUrl?: string;
  /** URLs de imágenes adicionales. */
  imageUrls: string[];
  /** Precio en la moneda del sistema. */
  price: number;
  /** Unidades en stock. */
  stock: number;
  /** Categorías asignadas (expandido). */
  categories?: Category[];
  /** Reseñas (expandido). */
  reviews?: Review[];
  /** Fecha de creación (ISO). */
  createdAt?: string;
  /** Fecha de actualización (ISO). */
  updatedAt?: string;
}

/** DTO para crear un libro en el catálogo; categoryIds opcional para asignar categorías. */
export interface CreateCatalogBookDto {
  /** Título del libro. */
  title: string;
  /** Autor. */
  author: string;
  /** ISBN. */
  isbn: string;
  /** Descripción opcional. */
  description?: string;
  /** URL de portada opcional. */
  coverUrl?: string;
  /** URLs de imágenes opcionales. */
  imageUrls?: string[];
  /** Precio. */
  price: number;
  /** Stock inicial. */
  stock: number;
  /** IDs de categorías a asignar. */
  categoryIds?: number[];
}

/** DTO para actualizar un libro; todos los campos heredados son opcionales. */
export interface UpdateCatalogBookDto extends Partial<CreateCatalogBookDto> {}

/**
 * Reseña de un libro: valoración 1-5, comentario opcional y autor.
 */
export interface Review {
  /** ID de la reseña. */
  id: number;
  /** ID del libro. */
  catalogBookId: number;
  /** ID del usuario que la escribe. */
  userId: number;
  /** Valoración de 1 a 5. */
  rating: number;
  /** Comentario opcional. */
  comment?: string;
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Autor expandido. */
  user?: ReviewAuthor;
}