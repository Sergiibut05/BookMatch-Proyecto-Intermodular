import type { Request, Response } from 'express';
import {
    getForums,
    getForumById,
    createForum,
    updateForum,
    deleteForum,
} from './forums.service.js';
import {
    getForumsQuerySchema,
    type CreateForumInput,
    type UpdateForumInput,
} from './forums.schema.js';

export async function getForumsCtrl(req: Request, res: Response) {
    try {
        const query = getForumsQuerySchema.parse(req.query);
        const result = await getForums(query);
        res.json(result);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ message: 'Filtros inválidos', errors: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
}

export async function getForumByIdCtrl(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        const forum = await getForumById(id);
        if (!forum) return res.status(404).json({ message: 'Foro no encontrado' });

        res.json(forum);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function createForumCtrl(
    req: Request<unknown, unknown, CreateForumInput>,
    res: Response
) {
    try {
        if (!req.user) return res.status(401).json({ message: 'No autorizado' });

        const forum = await createForum(req.user.id, req.body);
        res.status(201).json(forum);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function updateForumCtrl(
    req: Request<{ id: string }, unknown, UpdateForumInput>,
    res: Response
) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        // Obtenemos usuario y rol
        const user = (req as any).user; 
        if (!user) return res.status(401).json({ message: 'No autorizado' });

        // Verificar propiedad (opcional, por ahora solo actualiza)
        // Idealmente deberíamos verificar si el usuario es el creador antes de actualizar
        const existingForum = await getForumById(id);
        if (!existingForum) return res.status(404).json({ message: 'Foro no encontrado' });

        // MODIFICACIÓN: Permitir si es el creador O si es ADMIN
        if (existingForum.creatorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para editar este foro' });
        }

        const forum = await updateForum(id, req.body);
        res.json(forum);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteForumCtrl(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        // Obtenemos usuario y rol
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'No autorizado' });

        const existingForum = await getForumById(id);
        if (!existingForum) return res.status(404).json({ message: 'Foro no encontrado' });

        // MODIFICACIÓN: Permitir si es el creador O si es ADMIN
        if (existingForum.creatorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este foro' });
        }

        await deleteForum(id);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
