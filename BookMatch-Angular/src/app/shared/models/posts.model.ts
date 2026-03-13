/**
 * Interfaces para posts/temas del foro
 */

/** Autor de un post: datos mínimos para mostrar en UI (id, nombre, avatar). */
export interface PostAuthor {
  /** ID del usuario autor. */
  id: number;
  /** Nombre completo o null. */
  fullName: string | null;
  /** URL del avatar o null. */
  avatarUrl: string | null;
}

/** Tipo de voto en un post: positivo (UP) o negativo (DOWN). */
export type VoteType = 'UP' | 'DOWN';

/** Imagen asociada a un post; contiene id y URL pública. */
export interface PostImage {
  /** ID de la imagen. */
  id: number;
  /** URL pública de la imagen. */
  url: string;
}

/**
 * Post/tema dentro de un foro.
 * Incluye autor expandido, imágenes, puntuación y conteos de comentarios/votos.
 */
export interface Post {
  /** ID del post. */
  id: number;
  /** Título del post. */
  title: string;
  /** Contenido en texto. */
  content: string;
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Fecha de última actualización (ISO). */
  updatedAt: string;
  /** ID del foro al que pertenece. */
  forumId: number;
  /** ID del usuario autor. */
  authorId: number;
  /** Puntuación por votos. */
  score: number;
  /** Autor expandido para la UI. */
  author?: PostAuthor;
  /** Imágenes del post. */
  images?: PostImage[];
  /** Voto del usuario actual (UP/DOWN) o null. */
  userVote?: VoteType | null;
  /** Conteos de comentarios y votos. */
  _count?: {
    comments: number;
    votes: number;
  };
}

/** Respuesta paginada del listado de posts. */
export interface PostsListResponse {
  /** Lista de posts de la página actual. */
  items: Post[];
  /** Total de registros. */
  total: number;
  /** Página actual. */
  page: number;
  /** Tamaño de página. */
  limit: number;
  /** Total de páginas. */
  totalPages: number;
}

/** DTO para crear un nuevo post (título, contenido y URLs de imágenes opcionales). */
export interface CreatePostDto {
  /** Título del post. */
  title: string;
  /** Contenido del post. */
  content: string;
  /** URLs de imágenes opcionales. */
  images?: string[];
}

/** DTO para actualizar un post; todos los campos son opcionales. */
export interface UpdatePostDto {
  /** Nuevo título si se actualiza. */
  title?: string;
  /** Nuevo contenido si se actualiza. */
  content?: string;
}

