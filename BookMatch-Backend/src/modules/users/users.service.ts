import type admin from 'firebase-admin';
import { prisma } from '../../config/db.js';

const userSelect = {
  id: true,
  firebaseUid: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

type FirebaseProfile = Pick<
  admin.auth.UserRecord,
  'uid' | 'email' | 'displayName' | 'photoURL' | 'phoneNumber'
>;

export async function syncUserFromFirebase(profile: FirebaseProfile) {
  if (!profile.email) {
    throw new Error('El usuario de Firebase no tiene un email asociado');
  }

  const base = {
    email: profile.email,
    fullName: profile.displayName ?? null,
    avatarUrl: profile.photoURL ?? null,
  };

  // No pisar teléfono guardado en BD si Firebase no trae phoneNumber (p. ej. perfil /trueque).
  const updateData = {
    ...base,
    ...(profile.phoneNumber != null && profile.phoneNumber !== ''
      ? { phone: profile.phoneNumber }
      : {}),
  };

  return prisma.user.upsert({
    where: { firebaseUid: profile.uid },
    update: updateData,
    create: {
      firebaseUid: profile.uid,
      ...base,
      phone: profile.phoneNumber ?? null,
    },
    select: userSelect,
  });
}

export async function findUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function findUserByFirebaseUid(firebaseUid: string) {
  return prisma.user.findUnique({
    where: { firebaseUid },
    select: userSelect,
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: userSelect,
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { id: 'asc' },
  });
}

export async function updateUser(
  id: number,
  data: { fullName?: string | null; email?: string; avatarUrl?: string | null; phone?: string | null }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({ where: { id } });
}

export async function updateProfile(
  userId: number,
  data: { fullName?: string | null; email?: string; avatarUrl?: string | null; phone?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });
}
