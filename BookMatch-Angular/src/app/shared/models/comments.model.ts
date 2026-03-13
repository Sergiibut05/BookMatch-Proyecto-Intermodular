/**
 * Interfaces para comentarios
 */

/** Autor de un comentario: id, nombre y avatar para la UI. */
export interface CommentAuthor {
  /** ID del usuario. */
  id: number;
  /** Nombre completo o null. */
  fullName: string | null;
  /** URL del avatar o null. */
  avatarUrl: string | null;
}

/**
 * Comentario en un post; puede ser raíz (parentId null) o respuesta (parentId definido).
 * children contiene las respuestas anidadas cuando se expande.
 */
export interface Comment {
  /** ID del comentario. */
  id: number;
  /** Texto del comentario. */
  content: string;
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Fecha de actualización (ISO). */
  updatedAt: string;
  /** ID del post. */
  postId: number;
  /** ID del autor. */
  authorId: number;
  /** ID del comentario padre (null si es raíz). */
  parentId: number | null;
  /** Autor expandido. */
  author?: CommentAuthor;
  /** Respuestas anidadas. */
  children?: Comment[];
}

/** DTO para crear un comentario; parentId opcional para respuestas. */
export interface CreateCommentDto {
  /** Contenido del comentario. */
  content: string;
  /** ID del comentario padre si es respuesta. */
  parentId?: number;
}

/** DTO para actualizar un comentario (solo contenido). */
export interface UpdateCommentDto {
  /** Nuevo contenido. */
  content?: string;
}

