import { Component, OnInit, inject, signal } from '@angular/core';

import { StorageService } from '@core/services/storage';
import { UsersService, UserProfile } from '@core/services/users.service';
import { AuthService } from '@core/services/auth.service';
import { Header } from '@shared/components/header/header';
import { PurchaseHistoryComponent } from '../purchase-history/purchase-history.component';
import { ProfileEditComponent } from '../profile-edit/profile-edit.component';
import { TranslateModule } from '@ngx-translate/core';

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

  profile = signal<UserProfile | null>(null);
  isLoading = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

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

  onProfileUpdated(updatedProfile: UserProfile): void {
    this.profile.set(updatedProfile);
  }

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

  getAvatarUrl(): string | null {
    const profile = this.profile();
    if (profile?.avatarUrl) {
      return profile.avatarUrl;
    }
    const user = this.authService.currentUser();
    return user?.avatarUrl || null; 
  }

  hasPhoto(): boolean {
    return !!this.getAvatarUrl();
  }
}