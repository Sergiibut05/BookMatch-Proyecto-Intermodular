import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService, UserProfile, UpdateProfileData } from '@core/services/users.service';
import { AuthService } from '@core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-edit',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
})
export class ProfileEditComponent implements OnInit, OnChanges {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Input: perfil actual
  @Input() profile!: UserProfile;
  
  // Output: evento cuando se actualiza el perfil
  @Output() profileUpdated = new EventEmitter<UserProfile>();

  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  isEditing = signal<boolean>(false);
  editForm!: FormGroup;

  ngOnInit(): void {
    
    this.editForm = this.fb.group({
      fullName: ['', [Validators.minLength(2)]]
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
      fullName: [profile.fullName || '', [Validators.minLength(2)]]
    });
  }

  startEditing(): void {
    const currentProfile = this.profile;
    if (!currentProfile) return;

    if (!this.editForm) {
      this.initializeForm(currentProfile);
    } else {
      this.editForm.patchValue({
        fullName: currentProfile.fullName || ''
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

  saveName(): void {
    if (!this.editForm) return;

    const fullNameControl = this.editForm.get('fullName');
    if (!fullNameControl) return;

    // Validar el campo
    if (fullNameControl.invalid) {
      fullNameControl.markAsTouched();
      return;
    }

    const currentProfile = this.profile;
    if (!currentProfile) return;

    this.isSaving.set(true);
    this.error.set(null);

    const newFullName = fullNameControl.value?.trim() || '';
    const fullNameToSave = newFullName === '' 
      ? (currentProfile.fullName || null)
      : newFullName;

    const updateData: UpdateProfileData = {
      fullName: fullNameToSave
    };

    // Actualizar displayName en Firebase Auth si cambió
    if (fullNameToSave && fullNameToSave !== currentProfile.fullName) {
      this.authService.updateProfile({ displayName: fullNameToSave }).catch(err => {
        console.error('Error actualizando displayName en Firebase:', err);
      });
    }

    this.usersService.updateMyProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profileUpdated.emit(updatedProfile);
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: (err: any) => {
        console.error('Error actualizando perfil:', err);
        this.error.set(err.error?.message || 'Error al actualizar el perfil');
        this.isSaving.set(false);
      }
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
}

