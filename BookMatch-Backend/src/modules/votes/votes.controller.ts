import type { Request, Response } from 'express';
import {
    upsertVote,
    deleteVote,
    getUserVote,
} from './votes.service.js';
import {
    type CreateVoteInput,
} from './votes.schema.js';

export async function upsertVoteCtrl(
    req: Request<{ postId: string }, unknown, CreateVoteInput>,
    res: Response
) {
    try {
        const postId = Number(req.params.postId);
        if (Number.isNaN(postId)) return res.status(400).json({ message: 'Post ID inválido' });

        if (!req.user) return res.status(401).json({ message: 'No autorizado' });

        await upsertVote(req.user.id, postId, req.body);
        res.status(200).json({ message: 'Voto registrado' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteVoteCtrl(req: Request, res: Response) {
    try {
        const postId = Number(req.params.postId);
        if (Number.isNaN(postId)) return res.status(400).json({ message: 'Post ID inválido' });

        if (!req.user) return res.status(401).json({ message: 'No autorizado' });

        await deleteVote(req.user.id, postId);
        res.status(200).json({ message: 'Voto eliminado' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function getUserVoteCtrl(req: Request, res: Response) {
    try {
        const postId = Number(req.params.postId);
        if (Number.isNaN(postId)) return res.status(400).json({ message: 'Post ID inválido' });

        if (!req.user) return res.status(401).json({ message: 'No autorizado' });

        const vote = await getUserVote(req.user.id, postId);
        res.json(vote);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
