/**
 * Modelos de Playlists (alineados con la API `/api/playlists` del backend).
 */

/** Visibilidad de una playlist. */
export type PlaylistVisibility = 'PRIVATE' | 'PUBLIC';

/** Origen de la playlist: manual del usuario, generada por IA o mixto. */
export type PlaylistSource = 'MANUAL' | 'AI' | 'HYBRID';

/** Estado de lectura de un item de la playlist. */
export type PlaylistItemStatus = 'PENDING' | 'READING' | 'READ';

/**
 * Libro referenciado dentro de un item (subset proyectado por el backend).
 */
export interface PlaylistItemBook {
  /** ID del libro en el catálogo. */
  id: number;
  /** Título del libro. */
  title: string;
  /** Autor. */
  author: string;
  /** ISBN. */
  isbn: string;
  /** URL de la portada o null. */
  coverUrl: string | null;
  /** Precio numérico o null si no está disponible. */
  price: number | null;
}

/** Item (libro) contenido dentro de una playlist. */
export interface PlaylistItem {
  /** ID del item. */
  id: number;
  /** ID de la playlist a la que pertenece. */
  playlistId: number;
  /** ID del libro en el catálogo. */
  catalogBookId: number;
  /** Posición dentro de la playlist (1 = primero). */
  position: number;
  /** Estado de lectura del item. */
  status: PlaylistItemStatus;
  /** Nota libre del usuario o null. */
  note: string | null;
  /** Fecha de añadido (ISO). */
  addedAt: string;
  /** Libro proyectado o null. */
  catalogBook: PlaylistItemBook | null;
}

/** Resumen / detalle de una playlist. */
export interface Playlist {
  /** ID de la playlist. */
  id: number;
  /** ID del usuario propietario. */
  ownerId: number;
  /** Título. */
  title: string;
  /** Descripción o null. */
  description: string | null;
  /** URL de la portada o null. */
  coverUrl: string | null;
  /** Visibilidad. */
  visibility: PlaylistVisibility;
  /** Origen. */
  source: PlaylistSource;
  /** Prompt original si fue generada por IA, o null. */
  aiPrompt: string | null;
  /** Token público de compartir o null si es privada. */
  shareToken: string | null;
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Fecha de última modificación (ISO). */
  updatedAt: string;
  /** Fecha de soft-delete (ISO) o null. */
  deletedAt: string | null;
  /** Número total de items. */
  itemsCount: number;
  /** Items de la playlist (puede venir vacío en listados). */
  items: PlaylistItem[];
}

/** Payload para crear una playlist. */
export interface CreatePlaylistDto {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  visibility?: PlaylistVisibility;
  source?: PlaylistSource;
  aiPrompt?: string | null;
  itemIds?: number[];
}

/** Payload para actualizar una playlist. */
export interface UpdatePlaylistDto {
  title?: string;
  description?: string | null;
  coverUrl?: string | null;
  visibility?: PlaylistVisibility;
}

/** Filtros soportados por el listado. */
export interface PlaylistListQuery {
  page?: number;
  limit?: number;
  search?: string;
  source?: PlaylistSource;
  visibility?: PlaylistVisibility;
  sortBy?: 'newest' | 'updated' | 'alphabetical';
}

/** Respuesta paginada del backend para playlists. */
export interface PlaylistListResponse {
  items: Playlist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Payload para añadir un item a una playlist. */
export interface AddPlaylistItemDto {
  catalogBookId: number;
  note?: string | null;
  position?: number;
}

/** Payload para actualizar un item. */
export interface UpdatePlaylistItemDto {
  note?: string | null;
  status?: PlaylistItemStatus;
}

/** Payload para reordenar items (todos los movidos en una sola llamada). */
export interface ReorderPlaylistItemsDto {
  items: Array<{ itemId: number; position: number }>;
}

/** Respuesta del endpoint de reorder. */
export interface ReorderPlaylistItemsResponse {
  items: PlaylistItem[];
}

/**
 * Parámetros para generar una playlist con IA (H1.3 · SCRUM-162).
 * Alineado con `generatePlaylistSchema` del backend.
 */
export interface GeneratePlaylistWithAiDto {
  /** Prompt libre (5-2000 chars). */
  prompt: string;
  /** Número de libros a proponer (3-25, default 8). */
  size?: number;
  /** Géneros preferidos, hasta 10 strings cortos. */
  genres?: string[];
  /** Estado de ánimo / tono libre. */
  mood?: string;
  /** Idioma preferido (código ISO corto: 'es', 'en', ...). */
  language?: string;
  /** Visibilidad inicial (default PRIVATE). */
  visibility?: PlaylistVisibility;
}

/**
 * Respuesta 202 del backend al crear un draft IA.
 * El frontend debe hacer polling a `pollUrl` hasta que la playlist
 * tenga items o su descripción empiece por `[AI_FAILED]`.
 */
export interface GeneratePlaylistResponse {
  message: string;
  playlist: Playlist;
  pollUrl: string;
}

/** Formatos de exportación soportados (H1.4). */
export type PlaylistExportFormat = 'json' | 'md';
