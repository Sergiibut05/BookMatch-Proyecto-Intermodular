import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';

import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../language-selector/language-selector';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, LanguageSelectorComponent, TranslateModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  goProfile() {
    this.router.navigate(['/profile'])
  }

  goHome() {
    this.router.navigate(['/home'])
  }

  goCart() {
    this.router.navigate(['/cart'])
  }

  goForum() {
    this.router.navigate(['/foro']);
    this.closeMenu();
  }

}