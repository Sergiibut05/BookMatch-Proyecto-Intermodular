import { Component, OnInit, inject, signal } from '@angular/core';

import { StorageService } from '@core/services/storage';
import { UsersService, UserProfile } from '@core/services/users.service';
import { AuthService } from '@core/services/auth.service';
import { Header } from '@shared/components/header/header';
import { PurchaseHistoryComponent } from '../purchase-history/purchase-history.component';
import { ProfileEditComponent } from '../profile-edit/profile-edit.component';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Perfil del usuario: muestra datos personales, historial de compras y edición.
 * Permite cambiar avatar (cámara/galería) y sincroniza con Firebase Auth y backend.
 */
@Component({
  selector: 'app-profile',
  imports: [Header, PurchaseHistoryComponent, ProfileEditComponent, TranslateModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private storageService = inject(StorageService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  /** Perfil del usuario desde la API. */
  profile = signal<UserProfile | null>(null);
  /** Cargando perfil. */
  isLoading = signal<boolean>(false);
  /** Subiendo avatar. */
  isUploading = signal<boolean>(false);
  /** Mensaje de error. */
  error = signal<string | null>(null);

  /** Carga el perfil al iniciar. */
  ngOnInit(): void {
    this.loadProfile();
  }

  /** Obtiene el perfil del usuario autenticado. */
  loadProfile(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.usersService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando perfil:', err);
        this.error.set(err.error?.message || 'Error al cargar el perfil');
        this.isLoading.set(false);
      }
    });
  }

  /** Actualiza el perfil en el estado cuando se edita. */
  onProfileUpdated(updatedProfile: UserProfile): void {
    this.profile.set(updatedProfile);
    this.authService.mergeCurrentUser({
      fullName: updatedProfile.fullName ?? undefined,
      phone: updatedProfile.phone ?? undefined,
      avatarUrl: updatedProfile.avatarUrl ?? undefined,
    });
  }

  /** Toma foto, sube a Storage y actualiza Auth y backend. */
  async changePhoto(): Promise<void> {
    try {
      this.error.set(null);
      
      
      const photo = await this.storageService.takePhoto();
      if (!photo) {
        return; 
      }

      this.isUploading.set(true);

      const currentProfile = this.profile();
      if (!currentProfile) {
        throw new Error('Perfil no cargado');
      }

      
      const user = this.authService.currentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Subir foto a Firebase Storage
      const newPhotoUrl = await this.storageService.uploadPhoto(
        photo,
        user.firebaseUid, // <--- CAMBIO AQUÍ
        currentProfile.avatarUrl
      );

      // Actualizar photoURL en Firebase Auth
      await this.authService.updateProfile({ photoURL: newPhotoUrl });

      // Actualizar avatarUrl en la BD
      this.usersService.updateAvatar(newPhotoUrl).subscribe({
        next: (updatedProfile) => {
          this.profile.set(updatedProfile);
          this.isUploading.set(false);
        },
        error: (err: any) => {
          console.error('Error actualizando avatar en BD:', err);
          this.error.set('Foto subida pero error al actualizar perfil');
          this.isUploading.set(false);
        }
      });
    } catch (error: any) {
      console.error('Error cambiando foto:', error);
      this.error.set(error.message || 'Error al cambiar la foto');
      this.isUploading.set(false);
    }
  }

  /** URL del avatar (perfil o Auth). */
  getAvatarUrl(): string | null {
    const profile = this.profile();
    if (profile?.avatarUrl) {
      return profile.avatarUrl;
    }
    const user = this.authService.currentUser();
    return user?.avatarUrl || null; 
  }

  /** True si hay URL de avatar. */
  hasPhoto(): boolean {
    return !!this.getAvatarUrl();
  }
}