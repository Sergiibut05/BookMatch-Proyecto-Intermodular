import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Validador de formulario que comprueba coincidencia de contrasenas.
 */
function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;
  if (password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

/**
 * Pantalla de registro de usuario con validaciones reactivas.
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  returnUrl: string = '/dashboard';
  builder: FormBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  formRegister: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private route: ActivatedRoute) {
    this.formRegister = this.builder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      surname: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    // Para guardar la url de la página que el usuario intentaba acceder(si había una)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }



  /**
   * Ejecuta el alta de usuario cuando el formulario es valido.
   */
  onSubmit(): void {
    if (this.formRegister.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email, password, name, surname } = this.formRegister.value;

      this.authService.register(email, password, name, surname).subscribe({
        next: () => {
          this.successMessage = this.translate.instant('REGISTER.SUCCESS_MESSAGE');
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.getErrorMessage(error.code);
        }
      });
    }
  }

  /**
   * Ejecuta registro/login con Google y redirige al destino pendiente.
   */
  loginWithGoogle(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error.code);
      }
    });
  }

  /**
   * Traduce errores de Firebase a mensajes mostrables.
   */
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return this.translate.instant('REGISTER.ERRORS.EMAIL_IN_USE');
      case 'auth/invalid-email':
        return this.translate.instant('REGISTER.ERRORS.INVALID_EMAIL');
      case 'auth/weak-password':
        return this.translate.instant('REGISTER.ERRORS.WEAK_PASSWORD');
      case 'auth/operation-not-allowed':
        return this.translate.instant('REGISTER.ERRORS.OPERATION_NOT_ALLOWED');
      case 'auth/popup-closed-by-user':
        return this.translate.instant('REGISTER.ERRORS.POPUP_CLOSED');
      default:
        return this.translate.instant('REGISTER.ERRORS.DEFAULT');
    }
  }

  /**
   * Construye mensajes de validacion por control para la plantilla.
   */
  getError(control: string) {

    switch (control) {
      case 'name':
        if (this.formRegister.controls['name'].errors != null &&
          Object.keys(this.formRegister.controls['name'].errors).includes('required'))
          return this.translate.instant('REGISTER.ERRORS.NAME_REQUIRED');
        else if (this.formRegister.controls['name'].errors != null &&
          Object.keys(this.formRegister.controls['name'].errors).includes('minlength'))
          return this.translate.instant('REGISTER.ERRORS.MIN_LENGTH_3');

        break;
      case 'surname':
        if (this.formRegister.controls['surname'].errors != null &&
          Object.keys(this.formRegister.controls['surname'].errors).includes('required'))
          return this.translate.instant('REGISTER.ERRORS.SURNAME_REQUIRED');
        else if (this.formRegister.controls['surname'].errors != null &&
          Object.keys(this.formRegister.controls['surname'].errors).includes('minlength'))
          return this.translate.instant('REGISTER.ERRORS.MIN_LENGTH_3');

        break;
      case 'email':
        if (this.formRegister.controls['email'].errors != null &&
          Object.keys(this.formRegister.controls['email'].errors).includes('required'))
          return this.translate.instant('REGISTER.ERRORS.EMAIL_REQUIRED');
        else if (this.formRegister.controls['email'].errors != null &&
          Object.keys(this.formRegister.controls['email'].errors).includes('email'))
          return this.translate.instant('REGISTER.ERRORS.EMAIL_INVALID');

        break;
      case 'password':
        if (this.formRegister.controls['password'].errors != null &&
          Object.keys(this.formRegister.controls['password'].errors).includes('required'))
          return this.translate.instant('REGISTER.ERRORS.PASSWORD_REQUIRED');
        else if (this.formRegister.controls['password'].errors != null &&
          Object.keys(this.formRegister.controls['password'].errors).includes('pattern'))
          return this.translate.instant('REGISTER.ERRORS.PASSWORD_PATTERN');
        break;
      case 'confirmPassword':
        if (this.formRegister.controls['confirmPassword'].errors != null &&
          Object.keys(this.formRegister.controls['confirmPassword'].errors).includes('required'))
          return this.translate.instant('REGISTER.ERRORS.PASSWORD_REQUIRED');
        if (this.formRegister.controls['confirmPassword'].errors != null &&
          Object.keys(this.formRegister.controls['confirmPassword'].errors).includes('passwordMatch'))
          return this.translate.instant('REGISTER.ERRORS.PASSWORD_MISMATCH');
        break;
      default: return "";
    }
    return "";
  }
}
