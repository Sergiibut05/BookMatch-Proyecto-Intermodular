import { Injectable, inject } from '@angular/core';
import { Storage as FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storage = inject(FirebaseStorage);

  /**
   * Toma una foto usando Capacitor Camera (móvil) o input file (web)
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
      console.error('Error tomando foto:', error);
      return null;
    }
  }

  /**
   * Toma foto en web usando input file
   */
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
   * Sube una imagen a Firebase Storage
   * @param photo Foto tomada con Capacitor
   * @param userId ID del usuario
   * @param oldPhotoUrl URL de la foto anterior (opcional, para eliminarla)
   * @returns URL de descarga de la nueva imagen
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
      console.error('Error subiendo foto:', error);
      throw new Error('Error al subir la imagen');
    }
  }

  /**
   * Elimina una foto de Firebase Storage
   */
  async deletePhoto(photoUrl: string): Promise<void> {
    try {
      // Extraer el path de la URL de Firebase Storage
      // Formato: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
      const url = new URL(photoUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        console.warn('No se pudo extraer el path de la URL:', photoUrl);
        return;
      }

      // Decodificar el path (puede estar codificado)
      const decodedPath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(this.storage, decodedPath);

      // Eliminar archivo
      await deleteObject(storageRef);
    } catch (error: any) {
      // Si el archivo no existe, no es un error crítico
      if (error.code !== 'storage/object-not-found') {
        console.error('Error eliminando foto:', error);
      }
    }
  }

  /**
   * Convierte DataUrl a Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }
}
