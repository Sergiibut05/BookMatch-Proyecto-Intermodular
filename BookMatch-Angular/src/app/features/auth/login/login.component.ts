import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


/**
 * Pantalla de inicio de sesion con email/contrasena y Google.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Ejecuta login clasico cuando el formulario es valido.
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.getErrorMessage(error.code);
        }
      });
    }
  }

  /**
   * Ejecuta login federado con Google.
   */
  loginWithGoogle(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error.code);
      }
    });
  }

  /**
   * Mapea codigos de error de Firebase a claves i18n.
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'LOGIN.ERRORS.USER_NOT_FOUND',
      'auth/wrong-password': 'LOGIN.ERRORS.WRONG_PASSWORD',
      'auth/invalid-email': 'LOGIN.ERRORS.INVALID_EMAIL',
      'auth/user-disabled': 'LOGIN.ERRORS.USER_DISABLED',
      'auth/too-many-requests': 'LOGIN.ERRORS.TOO_MANY_REQUESTS',
      'auth/popup-closed-by-user': 'LOGIN.ERRORS.POPUP_CLOSED',
      'default': 'LOGIN.ERRORS.DEFAULT'
    };

    const key = errorMessages[errorCode] || errorMessages['default'];
    return this.translate.instant(key);
  }
}
