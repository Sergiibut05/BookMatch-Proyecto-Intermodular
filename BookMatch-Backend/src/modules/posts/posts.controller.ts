import type { Request, Response } from 'express';
import {
    getPostsByForumId,
    getPostById,
    createPost,
    updatePost,
    deletePost,
} from './posts.service.js';
import {
    getPostsQuerySchema,
    type CreatePostInput,
    type UpdatePostInput,
} from './posts.schema.js';

export async function getPostsByForumIdCtrl(req: Request, res: Response) {
    try {
        const forumId = Number(req.params.forumId);
        if (Number.isNaN(forumId)) return res.status(400).json({ message: 'Forum ID inválido' });

        const query = getPostsQuerySchema.parse(req.query);
        const result = await getPostsByForumId(forumId, query);
        res.json(result);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ message: 'Filtros inválidos', errors: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
}

export async function getPostByIdCtrl(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        const post = await getPostById(id);
        if (!post) return res.status(404).json({ message: 'Post no encontrado' });

        res.json(post);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function createPostCtrl(
    req: Request<{ forumId: string }, unknown, CreatePostInput>,
    res: Response
) {
    try {
        const forumId = Number(req.params.forumId);
        if (Number.isNaN(forumId)) return res.status(400).json({ message: 'Forum ID inválido' });

        if (!req.user) return res.status(401).json({ message: 'No autorizado' });

        const post = await createPost(req.user.id, forumId, req.body);
        res.status(201).json(post);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function updatePostCtrl(
    req: Request<{ id: string }, unknown, UpdatePostInput>,
    res: Response
) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        // Obtenemos usuario y rol
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'No autorizado' });

        const existingPost = await getPostById(id);
        if (!existingPost) return res.status(404).json({ message: 'Post no encontrado' });

        // MODIFICACIÓN: Permitir si es el autor O si es ADMIN
        if (existingPost.authorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para editar este post' });
        }

        const post = await updatePost(id, req.body);
        res.json(post);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function deletePostCtrl(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

        // Obtenemos usuario y rol
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: 'No autorizado' });

        const existingPost = await getPostById(id);
        if (!existingPost) return res.status(404).json({ message: 'Post no encontrado' });

        // MODIFICACIÓN: Permitir si es el autor O si es ADMIN
        if (existingPost.authorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este post' });
        }

        await deletePost(id);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}