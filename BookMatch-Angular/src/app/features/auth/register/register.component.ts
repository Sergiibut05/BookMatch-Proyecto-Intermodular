import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if(!password || !confirmPassword) return null;
  if(password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  returnUrl: string = '/dashboard';
  builder:FormBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  formRegister: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private route: ActivatedRoute) {
    this.formRegister = this.builder.group({
      name:['',[Validators.required, Validators.minLength(3)]],
      surname:['',[Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    // Para guardar la url de la página que el usuario intentaba acceder(si había una)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }



  onSubmit(): void {
    if (this.formRegister.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { email, password, name, surname } = this.formRegister.value;
      
      this.authService.register(email, password, name, surname).subscribe({
        next: () => {
          this.successMessage = 'Cuenta creada exitosamente. Redirigiendo...';
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

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El email ya está en uso';
      case 'auth/invalid-email':
        return 'El email no es válido';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil';
      case 'auth/operation-not-allowed':
        return 'Operación no permitida';
      case 'auth/popup-closed-by-user':
        return 'La ventana de autenticación se cerró';
      default:
        return 'Ha ocurrido un error. Inténtalo de nuevo';
    }
  }

  getError(control:string){
       
    switch(control){
      case 'name':
        if(this.formRegister.controls['name'].errors!=null && 
           Object.keys(this.formRegister.controls['name'].errors).includes('required'))
           return "*El campo nombre es requerido";
        else if(this.formRegister.controls['name'].errors!=null && 
           Object.keys(this.formRegister.controls['name'].errors).includes('minlength'))
           return "*Debe introducir al menos 3 caracteres";
        
        break;
      case 'surname':
        if(this.formRegister.controls['surname'].errors!=null && 
           Object.keys(this.formRegister.controls['surname'].errors).includes('required'))
           return "*El campo apellidos es requerido";
        else if(this.formRegister.controls['surname'].errors!=null && 
           Object.keys(this.formRegister.controls['surname'].errors).includes('minlength'))
           return "*Debe introducir al menos 3 caracteres";
        
        break;
      case 'email':
        if(this.formRegister.controls['email'].errors!=null && 
           Object.keys(this.formRegister.controls['email'].errors).includes('required'))
           return "*El campo email es requerido";
        else if(this.formRegister.controls['email'].errors!=null && 
           Object.keys(this.formRegister.controls['email'].errors).includes('email'))
           return "*El email no es correcto";
        
        break;
      case 'password': 
        if(this.formRegister.controls['password'].errors!=null && 
           Object.keys(this.formRegister.controls['password'].errors).includes('required'))
           return "*El campo password es requerido";
        else if(this.formRegister.controls['password'].errors!=null && 
           Object.keys(this.formRegister.controls['password'].errors).includes('pattern'))
           return "*Al menos una mayúscula, una minúscula, un número y 8 caracteres";
        break;
      case 'confirmPassword': 
        if(this.formRegister.controls['confirmPassword'].errors!=null && 
           Object.keys(this.formRegister.controls['confirmPassword'].errors).includes('required'))
           return "*El campo password es requerido";
        if(this.formRegister.controls['confirmPassword'].errors!=null && 
           Object.keys(this.formRegister.controls['confirmPassword'].errors).includes('passwordMatch'))
           return "*Las contranseñas no coinciden";
        break;
      default:return "";
    }
    return "";
  }
}
