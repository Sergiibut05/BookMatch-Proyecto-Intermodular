import { getFirebaseAdmin } from '../../utils/firebaseAdmin.js';
import { syncUserFromFirebase, findUserByFirebaseUid } from '../users/users.service.js';

export async function authenticateWithFirebase(idToken: string) {
  const admin = getFirebaseAdmin();
  const decoded = await admin.auth().verifyIdToken(idToken);
  const firebaseUser = await admin.auth().getUser(decoded.uid);
  const existing = await findUserByFirebaseUid(firebaseUser.uid);
  const user = await syncUserFromFirebase(firebaseUser);

  return { user, isNew: !existing };
}

