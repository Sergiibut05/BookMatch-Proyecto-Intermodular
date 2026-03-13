/**
 * Interfaces para foros
 */

/** Creador del foro: id, nombre completo y avatar para mostrar en UI. */
export interface ForumCreator {
  /** ID del usuario creador. */
  id: number;
  /** Nombre completo o null. */
  fullName: string | null;
  /** URL del avatar o null. */
  avatarUrl: string | null;
}

/**
 * Foro: contenedor de posts/temas con título, descripción y creador.
 * _count.posts indica cuántos posts tiene (si viene expandido).
 */
export interface Forum {
  /** ID del foro. */
  id: number;
  /** Título del foro. */
  title: string;
  /** Descripción o null. */
  description: string | null;
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Fecha de actualización (ISO). */
  updatedAt: string;
  /** ID del usuario creador. */
  creatorId: number;
  /** Creador expandido. */
  creator?: ForumCreator;
  /** Número de posts (expandido). */
  _count?: {
    posts: number;
  };
}

/** Respuesta paginada del listado de foros. */
export interface ForumsListResponse {
  /** Lista de foros de la página. */
  items: Forum[];
  /** Total de foros. */
  total: number;
  /** Página actual. */
  page: number;
  /** Tamaño de página. */
  limit: number;
  /** Total de páginas. */
  totalPages: number;
}

/** DTO para crear un nuevo foro. */
export interface CreateForumDto {
  /** Título del foro. */
  title: string;
  /** Descripción opcional. */
  description?: string;
}

/** DTO para actualizar un foro; todos los campos son opcionales. */
export interface UpdateForumDto {
  /** Nuevo título. */
  title?: string;
  /** Nueva descripción. */
  description?: string;
}

