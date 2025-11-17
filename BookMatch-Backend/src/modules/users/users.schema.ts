import { z } from 'zod';

export const firebaseAuthSchema = z.object({
  idToken: z.string().min(1, 'El token de Firebase es requerido'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').nullable().optional(),
  email: z.string().email('Email inválido').optional(),
  avatarUrl: z.string().url('La URL del avatar no es válida').nullable().optional(),
  phone: z.string().min(6, 'El teléfono debe tener al menos 6 dígitos').nullable().optional(),
});

export const updateProfileSchema = updateUserSchema;

export type FirebaseAuthInput = z.infer<typeof firebaseAuthSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
