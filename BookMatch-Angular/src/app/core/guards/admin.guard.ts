import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, firstValueFrom } from 'rxjs';

/**
 * Guard funcional que protege rutas de administrador.
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Esperamos a que Firebase emita un estado definido (usuario o null)
    await firstValueFrom(
      authService.user$.pipe(
        filter(user => user !== undefined)
      )
    );
    
    // Y necesitamos esperar un poco más a que el perfil se sincronice 
    // y el signal se actualice, ya que user$ emite FirebaseUser y 
    // fetchBackendProfile puede tardar unos ms.
    // Una forma rápida es comprobar authService.isAdmin().
    // Pero debido a que fetchBackendProfile es asíncrono, isAdmin() podría ser falso al principio.
    // Lo ideal sería un pequeño delay o comprobar de nuevo si currentUser se actualiza.
    
    // Retraso de 500ms para asegurar la carga del rol desde el DB si es un reload fresco.
    if (!authService.currentUser()) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (authService.isAuthenticated() && authService.isAdmin()) {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  } catch(error) {
    router.navigate(['/']);
    return false;
  }
};
