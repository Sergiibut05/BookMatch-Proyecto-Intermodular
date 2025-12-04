import { prisma } from '../../config/db.js';
import type { CreateForumInput, UpdateForumInput, GetForumsQuery } from './forums.schema.ts';
import type { Prisma } from '@prisma/client';

export const getForums = async (query: GetForumsQuery) => {
    const { page, limit, search } = query;

    const where: Prisma.ForumWhereInput = search
        ? {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, forums] = await prisma.$transaction([
        prisma.forum.count({ where }),
        prisma.forum.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                _count: {
                    select: { posts: true },
                },
            },
        }),
    ]);

    return {
        items: forums,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getForumById = async (id: number) => {
    return prisma.forum.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: { posts: true },
            },
        },
    });
};

export const createForum = async (userId: number, input: CreateForumInput) => {
    return prisma.forum.create({
        data: {
            title: input.title,
            description: input.description ?? null,
            creatorId: userId,
        },
    });
};

export const updateForum = async (id: number, input: UpdateForumInput) => {
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const data: Partial<{ title: string; description: string | null }> = {};

    if (input.title !== undefined) {
        data.title = input.title;
    }

    if (input.description !== undefined) {
        data.description = input.description;
    }

    return prisma.forum.update({
        where: { id },
        data,
    });
};

export const deleteForum = async (id: number) => {
    return prisma.forum.delete({
        where: { id },
    });
};
