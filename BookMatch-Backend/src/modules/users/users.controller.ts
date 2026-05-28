import type { Request, Response } from 'express';
import { listUsers, findUserById, updateUser, deleteUser, updateProfile } from './users.service.js';

export async function listUsersCtrl(_req: Request, res: Response) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function meCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateUserCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const user = await updateUser(id, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }
    res.status(500).json({ message: error.message });
  }
}

export async function deleteUserCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    await deleteUser(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

export async function updateProfileCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const user = await updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }
    res.status(500).json({ message: error.message });
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};