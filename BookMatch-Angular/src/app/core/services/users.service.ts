import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  firebaseUid: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role?: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  fullName?: string | null;
  email?: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/users`;

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
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
   */
  updateAvatar(avatarUrl: string): Observable<UserProfile> {
    return this.updateMyProfile({ avatarUrl });
  }
}

