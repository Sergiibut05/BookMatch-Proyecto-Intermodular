import { prisma } from '../../config/db.js';
import type { CreateCommentInput, UpdateCommentInput } from './comments.schema.js';

export const getCommentsByPostId = async (postId: number) => {
    const comments = await prisma.comment.findMany({
        where: { postId },
        include: {
            author: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    // Construir árbol de comentarios
    const commentMap = new Map();
    const roots: any[] = [];

    // Primero mapear todos los comentarios
    comments.forEach((comment: { id: any; }) => {
        commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Luego asignar hijos a padres
    comments.forEach((comment: { parentId: any; id: any; }) => {
        if (comment.parentId) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
                parent.children.push(commentMap.get(comment.id));
            } else {
                // Si el padre no existe (caso raro), lo tratamos como raiz o lo ignoramos
                roots.push(commentMap.get(comment.id));
            }
        } else {
            roots.push(commentMap.get(comment.id));
        }
    });

    return roots;
};

export const getCommentById = async (id: number) => {
    return prisma.comment.findUnique({
        where: { id },
    });
};

export const createComment = async (userId: number, postId: number, input: CreateCommentInput) => {
    return prisma.comment.create({
        data: {
            content: input.content,
            parentId: input.parentId ?? null,
            postId,
            authorId: userId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                },
            },
        },
    });
};

export const updateComment = async (id: number, input: UpdateCommentInput) => {
    return prisma.comment.update({
        where: { id },
        data: input,
    });
};

export const deleteComment = async (id: number) => {
    return prisma.comment.delete({
        where: { id },
    });
};
