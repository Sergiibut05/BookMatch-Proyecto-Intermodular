import { Injectable, inject } from '@angular/core';
import { Storage as FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Servicio de gestion de imagenes con Firebase Storage y Capacitor Camera.
 *
 * Abstrae captura/seleccion de fotos y operaciones de subida/eliminacion para
 * avatares de usuario e imagenes de publicaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage = inject(FirebaseStorage);

  /**
   * Toma o selecciona una foto (cámara en móvil, input file en web).
   * @returns Promise con la foto tomada o null si se cancela
   */
  async takePhoto(): Promise<Photo | null> {
    try {
      // En web, usar input file nativo
      if (Capacitor.getPlatform() === 'web') {
        return await this.takePhotoWeb();
      }

      // En móvil, usar Capacitor Camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Permite elegir entre cámara y galería
      });

      return image;
    } catch (error) {
      return null;
    }
  }

  private async takePhotoWeb(): Promise<Photo | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'user'; // Para cámara frontal en móvil

      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        // Convertir File a DataUrl para compatibilidad con Photo
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            format: file.type.split('/')[1],
            saved: false,
          } as Photo);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  /**
   * Sube una foto como avatar de usuario; elimina la anterior si se indica.
   * @param photo Foto a subir
   * @param userId ID del usuario
   * @param oldPhotoUrl URL de la foto anterior a eliminar
   * @returns Promise con la URL de la imagen subida
   */
  async uploadPhoto(photo: Photo, userId: string, oldPhotoUrl?: string | null): Promise<string> {
    try {
      // Eliminar foto anterior si existe
      if (oldPhotoUrl) {
        await this.deletePhoto(oldPhotoUrl);
      }

      // Convertir DataUrl a Blob
      const blob = await this.dataUrlToBlob(photo.dataUrl!);

      // Crear referencia en Firebase Storage
      const fileName = `avatars/${userId}_${Date.now()}.${photo.format || 'jpg'}`;
      const storageRef = ref(this.storage, fileName);

      // Subir imagen
      await uploadBytes(storageRef, blob);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new Error('Error al subir la imagen');
    }
  }

  /**
   * Sube una portada de playlist (ruta `playlists/` en Storage).
   * @param photo Foto a subir (capturada por `takePhoto`).
   * @param playlistId ID numérico de la playlist.
   * @param oldCoverUrl URL previa (se elimina tras subir la nueva).
   * @returns Promise con la URL pública de la imagen subida.
   */
  async uploadPlaylistCover(
    photo: Photo,
    playlistId: number,
    oldCoverUrl?: string | null,
  ): Promise<string> {
    try {
      const blob = await this.dataUrlToBlob(photo.dataUrl!);
      const fileName = `playlists/${playlistId}_${Date.now()}.${photo.format || 'jpg'}`;
      const storageRef = ref(this.storage, fileName);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      if (oldCoverUrl && this.isFirebaseStorageUrl(oldCoverUrl)) {
        await this.deletePhoto(oldCoverUrl);
      }

      return downloadURL;
    } catch (error) {
      throw new Error('Error al subir la portada de la playlist');
    }
  }

  /**
   * Sube una imagen para un post (ruta posts/ en Storage).
   * @param photo Foto a subir
   * @param userId ID del usuario
   * @returns Promise con la URL de la imagen subida
   */
  async uploadPostImage(photo: Photo, userId: string): Promise<string> {
    try {
      // Convertir DataUrl a Blob
      const blob = await this.dataUrlToBlob(photo.dataUrl!);

      // Crear referencia en Firebase Storage
      const fileName = `posts/${userId}_${Date.now()}.${photo.format || 'jpg'}`;
      const storageRef = ref(this.storage, fileName);

      // Subir imagen
      await uploadBytes(storageRef, blob);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new Error('Error al subir la imagen del post');
    }
  }

  /**
   * Elimina una foto de Firebase Storage a partir de su URL de descarga.
   * @param photoUrl URL de la foto a eliminar
   */
  async deletePhoto(photoUrl: string): Promise<void> {
    try {
      const url = new URL(photoUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        return;
      }

      const decodedPath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(this.storage, decodedPath);

      await deleteObject(storageRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        // Error silencioso si el archivo no existe
      }
    }
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  /**
   * Comprueba si una URL apunta a nuestro bucket de Firebase Storage.
   * Evita intentar borrar URLs externas (p.ej. las que genera la IA).
   */
  private isFirebaseStorageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith('firebasestorage.googleapis.com');
    } catch {
      return false;
    }
  }
}
