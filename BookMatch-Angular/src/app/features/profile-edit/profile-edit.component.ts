import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { UsersService, UserProfile, UpdateProfileData } from '@core/services/users.service';
import { AuthService } from '@core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';

function optionalProfilePhone(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '').trim();
  if (!v) return null;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 6 ? null : { phoneTooShort: true };
}

/**
 * Formulario de edición de perfil: nombre completo y teléfono opcional.
 * Emite profileUpdated con el perfil actualizado; sincroniza displayName en Firebase Auth.
 */
@Component({
  selector: 'app-profile-edit',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PhoneInputComponent],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
})
export class ProfileEditComponent implements OnInit, OnChanges {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  /** Perfil actual a mostrar y editar. */
  @Input() profile!: UserProfile;

  /** Se emite cuando el perfil se actualiza correctamente. */
  @Output() profileUpdated = new EventEmitter<UserProfile>();

  /** Guardando cambios. */
  isSaving = signal<boolean>(false);
  /** Mensaje de error. */
  error = signal<string | null>(null);
  /** Modo edición activo. */
  isEditing = signal<boolean>(false);
  /** Formulario. */
  editForm!: FormGroup;

  ngOnInit(): void {
    this.editForm = this.fb.group({
      fullName: ['', [Validators.minLength(2)]],
      phone: ['', [optionalProfilePhone]],
    });
    if (this.profile) {
      this.initializeForm(this.profile);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && this.profile && this.editForm) {
      this.initializeForm(this.profile);
    }
  }

  initializeForm(profile: UserProfile): void {
    this.editForm = this.fb.group({
      fullName: [profile.fullName || '', [Validators.minLength(2)]],
      phone: [profile.phone || '', [optionalProfilePhone]],
    });
  }

  startEditing(): void {
    const currentProfile = this.profile;
    if (!currentProfile) return;

    if (!this.editForm) {
      this.initializeForm(currentProfile);
    } else {
      this.editForm.patchValue({
        fullName: currentProfile.fullName || '',
        phone: currentProfile.phone || '',
      });
    }

    this.isEditing.set(true);
    this.error.set(null);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.error.set(null);
    if (this.profile && this.editForm) {
      this.initializeForm(this.profile);
    }
  }

  saveProfile(): void {
    if (!this.editForm) return;

    const fullNameControl = this.editForm.get('fullName');
    const phoneControl = this.editForm.get('phone');
    if (!fullNameControl || !phoneControl) return;

    if (fullNameControl.invalid) {
      fullNameControl.markAsTouched();
      return;
    }
    if (phoneControl.invalid) {
      phoneControl.markAsTouched();
      return;
    }

    const currentProfile = this.profile;
    if (!currentProfile) return;

    this.isSaving.set(true);
    this.error.set(null);

    const newFullName = fullNameControl.value?.trim() || '';
    const fullNameToSave = newFullName === '' ? (currentProfile.fullName || null) : newFullName;

    const phoneRaw = String(phoneControl.value ?? '').trim();
    const phoneToSave = phoneRaw === '' ? null : phoneRaw;

    const updateData: UpdateProfileData = {
      fullName: fullNameToSave,
      phone: phoneToSave,
    };

    if (fullNameToSave && fullNameToSave !== currentProfile.fullName) {
      this.authService.updateProfile({ displayName: fullNameToSave }).catch((err) => {
        console.error('Error actualizando displayName en Firebase:', err);
      });
    }

    this.usersService.updateMyProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profileUpdated.emit(updatedProfile);
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: (err: unknown) => {
        console.error('Error actualizando perfil:', err);
        const msg = err && typeof err === 'object' && 'error' in err ? (err as { error?: { message?: string } }).error?.message : undefined;
        this.error.set(msg || 'Error al actualizar el perfil');
        this.isSaving.set(false);
      },
    });
  }

  getFieldError(): string | null {
    const field = this.editForm?.get('fullName');
    if (!field || !field.touched || !field.errors) return null;

    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return 'Campo inválido';
  }

  getPhoneError(): string | null {
    const field = this.editForm?.get('phone');
    if (!field || !field.touched || !field.errors) return null;
    if (field.errors['phoneTooShort']) {
      return 'PROFILE.ERROR_PHONE_MIN';
    }
    return null;
  }
}
