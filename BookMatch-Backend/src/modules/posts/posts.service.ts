import { prisma } from '../../config/db.js';
import type { CreatePostInput, UpdatePostInput, GetPostsQuery } from './posts.schema.js';
import { Prisma } from '@prisma/client';

export const getPostsByForumId = async (forumId: number, query: GetPostsQuery) => {
    const { page, limit, sort } = query;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'score') {
        orderBy = { score: 'desc' };
    } else if (sort === 'comments') {
        orderBy = { comments: { _count: 'desc' } };
    }

    const where: any = { forumId };

    const [total, posts] = await prisma.$transaction([
        prisma.post.count({ where }),
        prisma.post.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
                _count: {
                    select: { comments: true, votes: true },
                },
            },
        }),
    ]);

    return {
        items: posts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getPostById = async (id: number) => {
    return prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                },
            },
            forum: {
                select: {
                    id: true,
                    title: true
                }
            },
            images: true,
            _count: {
                select: { comments: true, votes: true },
            },
        },
    });
};

export const createPost = async (userId: number, forumId: number, input: CreatePostInput) => {
    return prisma.post.create({
        data: {
            ...input,
            authorId: userId,
            forumId,
        },
    });
};

export const updatePost = async (id: number, input: UpdatePostInput) => {
    const data = Object.fromEntries(
        Object.entries(input).filter(([_, value]) => value !== undefined)
    );

    return prisma.post.update({
        where: { id },
        data,
    });
};

export const deletePost = async (id: number) => {
    return prisma.post.delete({
        where: { id },
    });
};
