import { prisma } from '../../config/db.js';
import { normalizeText } from '../../utils/textUtils.js';
import type { CreateForumInput, UpdateForumInput, GetForumsQuery } from './forums.schema.ts';
import type { Prisma } from '@prisma/client';

export const getForums = async (query: GetForumsQuery) => {
    const { page, limit, search } = query;

    // Si hay búsqueda, usar SQL raw para normalizar ambos lados
    let searchForumIds: number[] | undefined;
    if (search) {
        const normalizedSearch = normalizeText(search);
        // Usar SQL raw para normalizar tanto el término como los datos de la BD
        // Usamos una función que normaliza caracteres acentuados comunes en español
        const searchResults = await prisma.$queryRaw<Array<{ id: number }>>`
            SELECT id 
            FROM forums 
            WHERE 
                LOWER(
                  TRANSLATE(
                    LOWER(title),
                    'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ',
                    'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC'
                  )
                ) LIKE ${`%${normalizedSearch}%`}
                OR LOWER(
                  TRANSLATE(
                    LOWER(COALESCE(description, '')),
                    'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ',
                    'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC'
                  )
                ) LIKE ${`%${normalizedSearch}%`}
        `;
        searchForumIds = searchResults.map(r => r.id);
    }

    const where: Prisma.ForumWhereInput = searchForumIds
        ? { id: { in: searchForumIds.length > 0 ? searchForumIds : [0] } }
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
