import type { Request, Response } from 'express';
import { authenticateWithFirebase, sendPasswordReset } from './auth.service.js';
import { firebaseAuthSchema } from '../users/users.schema.js';

export async function registerCtrl(req: Request, res: Response) {
  try {
    const { idToken } = firebaseAuthSchema.parse(req.body);
    const data = await authenticateWithFirebase(idToken);
    res.status(data.isNew ? 201 : 200).json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
}

export async function loginCtrl(req: Request, res: Response) {
  try {
    const { idToken } = firebaseAuthSchema.parse(req.body);
    const data = await authenticateWithFirebase(idToken);
    res.status(200).json(data);
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
}

export async function forgotPasswordCtrl(req: Request, res: Response) {
  try {
    const { email } = req.body;
    await sendPasswordReset(email);
    
    res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones.' });
  } catch (e: any) {
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
}