import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, firstValueFrom } from 'rxjs';

/**
 * Guard para rutas públicas (landing, login, register).
 *
 * Si el usuario ya está autenticado redirige a /home para evitar que
 * vea brevemente la landing o el formulario de login antes de ser
 * redirigido por el componente.
 */
export const noAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await firstValueFrom(
    authService.user$.pipe(filter(u => u !== undefined))
  );

  if (authService.isAuthenticated()) {
    router.navigate(['/home']);
    return false;
  }
  return true;
};
