import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try{
    const user = await firstValueFrom(
      authService.user$.pipe(
        filter(user => user !== undefined)
      )
    );
    if (authService.isAuthenticated()) {
      return true;
    } else {
      router.navigate(['/auth/login']);
      return false;
    }
  }catch(error){
    router.navigate(['/auth/login']);
    return false;
  }
  
};
