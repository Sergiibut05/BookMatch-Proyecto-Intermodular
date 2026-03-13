/**
 * Interfaces genéricas para respuestas de API
 */

/**
 * Respuesta genérica de API: datos en éxito o error/mensaje en fallo.
 * @template T Tipo del payload en caso de éxito
 */
export interface ApiResponse<T> {
  /** Payload en caso de éxito. */
  data?: T;
  /** Código o mensaje de error. */
  error?: string;
  /** Mensaje adicional. */
  message?: string;
}

/**
 * Respuesta paginada genérica: lista de ítems, total y datos de paginación.
 * @template T Tipo de cada ítem en data
 */
export interface PaginatedResponse<T> {
  /** Lista de ítems de la página. */
  data: T[];
  /** Total de registros. */
  total: number;
  /** Página actual. */
  page: number;
  /** Tamaño de página. */
  limit: number;
  /** Total de páginas. */
  totalPages: number;
}

/**
 * Usuario del sistema: vincula Firebase UID con perfil (email, nombre, avatar, rol).
 * role USER o ADMIN; usado para permisos en la app.
 */
export interface User {
  /** ID del usuario en backend. */
  id: number;
  /** UID de Firebase Auth. */
  firebaseUid: string;
  /** Email. */
  email: string;
  /** Nombre completo. */
  fullName?: string;
  /** URL del avatar. */
  avatarUrl?: string;
  /** Teléfono. */
  phone?: string;
  /** Rol USER o ADMIN. */
  role?: 'USER' | 'ADMIN';
  /** Fecha de creación (ISO). */
  createdAt?: string;
  /** Fecha de actualización (ISO). */
  updatedAt?: string;
}