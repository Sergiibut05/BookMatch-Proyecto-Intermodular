import type { Request, Response } from 'express';
import {
    getCommentsByPostId,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
} from './comments.service.js';
import {
    type CreateCommentInput,
    type UpdateCommentInput,
} from './comments.schema.js';

export async function getCommentsByPostIdCtrl(req: Request, res: Response) {
    try {
        const postId = Number(req.params.postId);
        if (Number.isNaN(postId)) return res.status(400).json({ message: 'Post ID inválido' });

        const comments = await getCommentsByPostId(postId);
        res.json(comments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function createCommentCtrl(
    req: Request<{ postId: string }, unknown, CreateCommentInput>,
    res: Response
) {
    try {
        const postId = Number(req.params.postId);
        if (Number.isNaN(postId)) return res.status(400).json({ message: 'Post ID inválido' });

        if (!req.user) return res.status(401).json({ message: 'No autorizado' });

        const comment = await createComment(req.user.id, postId, req.body);
        res.status(201).json(comment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function updateCommentCtrl(
    req: Request<{ id: string }, unknown, UpdateCommentInput>,
    res: Response
) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        // Obtenemos usuario y rol
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'No autorizado' });
        
        const existingComment = await getCommentById(id);
        if (!existingComment) return res.status(404).json({ message: 'Comentario no encontrado' });

        // MODIFICACIÓN: Permitir si es el autor O si es ADMIN
        if (existingComment.authorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para editar este comentario' });
        }

        const comment = await updateComment(id, req.body);
        res.json(comment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteCommentCtrl(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        // Obtenemos usuario y rol
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'No autorizado' });

        const existingComment = await getCommentById(id);
        if (!existingComment) return res.status(404).json({ message: 'Comentario no encontrado' });

        // MODIFICACIÓN: Permitir si es el autor O si es ADMIN
        if (existingComment.authorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este comentario' });
        }

        await deleteComment(id);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
