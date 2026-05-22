import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Perfil de usuario retornado por la API.
 */
export interface UserProfile {
  /** ID del usuario. */
  id: number;
  /** UID de Firebase. */
  firebaseUid: string;
  /** Email. */
  email: string;
  /** Nombre completo o null. */
  fullName: string | null;
  /** URL del avatar o null. */
  avatarUrl: string | null;
  /** Teléfono o null. */
  phone: string | null;
  /** Rol USER o ADMIN. */
  role?: 'USER' | 'ADMIN';
  /** Fecha de creación (ISO). */
  createdAt: string;
  /** Fecha de actualización (ISO). */
  updatedAt: string;
}

/** Datos permitidos al actualizar el perfil del usuario (todos opcionales). */
export interface UpdateProfileData {
  /** Nuevo nombre completo. */
  fullName?: string | null;
  /** Nuevo email. */
  email?: string;
  /** Nueva URL de avatar. */
  avatarUrl?: string | null;
  /** Nuevo teléfono. */
  phone?: string | null;
}

/**
 * Servicio de perfil del usuario autenticado.
 *
 * Expone operaciones para consultar y actualizar informacion personal
 * incluyendo avatar y datos de contacto.
 */
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/users`;

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      take(1),
      map(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      })
    );
  }

  /**
   * @returns Observable con el perfil del usuario autenticado
   *
   * @example
   * ```ts
   * this.usersService.getMyProfile().subscribe((profile) => this.profile = profile);
   * ```
   */
  getMyProfile(): Observable<UserProfile> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.get<UserProfile>(`${this.apiUrl}/me`, { headers })
      )
    );
  }

  /**
   * @param data Datos a actualizar
   * @returns Observable con el perfil actualizado
   *
   * @example
   * ```ts
   * this.usersService.updateMyProfile({ fullName: 'Ana Lopez' }).subscribe();
   * ```
   */
  updateMyProfile(data: UpdateProfileData): Observable<UserProfile> {
    return this.authHeaders().pipe(
      switchMap(headers =>
        this.http.patch<UserProfile>(`${this.apiUrl}/me`, data, { headers })
      )
    );
  }

  /**
   * @param avatarUrl URL del nuevo avatar
   * @returns Observable con el perfil actualizado
   *
   * @example
   * ```ts
   * this.usersService.updateAvatar(downloadUrl).subscribe();
   * ```
   */
  updateAvatar(avatarUrl: string): Observable<UserProfile> {
    return this.updateMyProfile({ avatarUrl });
  }
}

