/**
 * Interfaces genéricas para respuestas de API
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface User {
  id: number;
  firebaseUid: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}