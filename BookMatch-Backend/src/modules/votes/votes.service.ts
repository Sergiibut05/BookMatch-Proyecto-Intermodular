import { prisma } from '../../config/db.js';
import type { CreateVoteInput } from './votes.schema.js';

type VoteType = 'UP' | 'DOWN';

async function updatePostScore(postId: number) {
    const upVotes = await prisma.vote.count({
        where: { postId, type: 'UP' },
    });
    const downVotes = await prisma.vote.count({
        where: { postId, type: 'DOWN' },
    });

    const score = upVotes - downVotes;

    await prisma.post.update({
        where: { id: postId },
        data: { score },
    });
}

export const upsertVote = async (userId: number, postId: number, input: CreateVoteInput) => {
    const type = input.type as VoteType;

    await prisma.$transaction(async (tx: any) => {
        // Upsert el voto
        const existingVote = await tx.vote.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existingVote) {
            if (existingVote.type !== type) {
                await tx.vote.update({
                    where: { id: existingVote.id },
                    data: { type },
                });
            }
        } else {
            await tx.vote.create({
                data: {
                    userId,
                    postId,
                    type,
                },
            });
        }
    });

    // Recalcular score fuera de la transacción para no bloquear demasiado (o dentro si es crítico)
    // Lo hacemos después para asegurar consistencia eventual rápida
    await updatePostScore(postId);
};

export const deleteVote = async (userId: number, postId: number) => {
    try {
        await prisma.vote.delete({
            where: { userId_postId: { userId, postId } },
        });
        await updatePostScore(postId);
    } catch (error: any) {
        if (error.code === 'P2025') {
            // Voto no existía, ignorar
            return;
        }
        throw error;
    }
};

export const getUserVote = async (userId: number, postId: number) => {
    return prisma.vote.findUnique({
        where: { userId_postId: { userId, postId } },
    });
};
