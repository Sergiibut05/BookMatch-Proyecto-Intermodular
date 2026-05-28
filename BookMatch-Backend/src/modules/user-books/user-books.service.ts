import type { BookCondition, Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import type { CreateUserBookInput, ListUserBooksQuery } from './user-books.schema.js';

function httpError(status: number, message: string): Error {
  const err = new Error(message);
  (err as Error & { status: number }).status = status;
  return err;
}

/** Libros no enlazados a un trueque activo (PROPOSED / ACCEPTED). */
const notInActiveTrade: Prisma.UserBookWhereInput = {
  NOT: {
    tradeItems: {
      some: {
        trade: { status: { in: ['PROPOSED', 'ACCEPTED'] } },
      },
    },
  },
};

const listInclude = {
  owner: { select: { id: true, fullName: true, avatarUrl: true } },
  categories: {
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.UserBookInclude;

const detailInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  categories: {
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  tradeItems: {
    where: {
      trade: { status: { in: ['PROPOSED', 'ACCEPTED'] } },
    },
    orderBy: { id: 'asc' },
    include: {
      trade: {
        select: {
          id: true,
          status: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
        },
      },
    },
  },
} satisfies Prisma.UserBookInclude;

function mapCategories<T extends { category: { id: number; name: string; slug: string } }>(
  rows: T[],
): Array<{ id: number; name: string; slug: string }> {
  return rows.map((r) => r.category);
}

export async function listTradeableUserBooks(query: ListUserBooksQuery) {
  const { page, limit, search, ownerId, categoryId, condition } = query;

  const where: Prisma.UserBookWhereInput = {
    AND: [
      notInActiveTrade,
      ownerId != null ? { ownerId } : {},
      categoryId != null
        ? { categories: { some: { categoryId } } }
        : {},
      condition != null ? { condition: condition as BookCondition } : {},
      search != null && search.trim().length > 0
        ? {
            OR: [
              { title: { contains: search.trim(), mode: 'insensitive' } },
              { author: { contains: search.trim(), mode: 'insensitive' } },
              { isbn: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  };

  const [total, rows] = await prisma.$transaction([
    prisma.userBook.count({ where }),
    prisma.userBook.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: listInclude,
    }),
  ]);

  return {
    items: rows.map((ub) => ({
      ...ub,
      categories: mapCategories(ub.categories),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listMyUserBooks(ownerId: number) {
  const rows = await prisma.userBook.findMany({
    where: { ownerId },
    orderBy: { updatedAt: 'desc' },
    include: listInclude,
  });
  return rows.map((ub) => ({
    ...ub,
    categories: mapCategories(ub.categories),
  }));
}

export async function getUserBookById(id: number) {
  const ub = await prisma.userBook.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!ub) {
    throw httpError(404, 'Libro no encontrado');
  }
  return {
    ...ub,
    categories: mapCategories(ub.categories),
  };
}

export async function createUserBook(ownerId: number, body: CreateUserBookInput) {
  if (body.catalogBookId != null) {
    const cat = await prisma.catalogBook.findUnique({
      where: { id: body.catalogBookId },
      include: {
        categories: { select: { categoryId: true } },
      },
    });
    if (!cat) {
      throw httpError(404, 'Libro de catálogo no encontrado');
    }

    const condition = (body.condition ?? 'GOOD') as BookCondition;
    const extraCategoryIds = body.categoryIds ?? [];
    const fromCatalog = cat.categories.map((c) => c.categoryId);
    const categoryIdSet = new Set([...fromCatalog, ...extraCategoryIds]);

    const created = await prisma.userBook.create({
      data: {
        title: cat.title,
        author: cat.author,
        isbn: cat.isbn,
        description: cat.description,
        coverUrl: cat.coverUrl,
        imageUrls: cat.imageUrls?.length ? cat.imageUrls : [],
        condition,
        catalogBookId: cat.id,
        ownerId,
        ...(categoryIdSet.size > 0
          ? {
              categories: {
                create: [...categoryIdSet].map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
      },
      include: detailInclude,
    });
    return {
      ...created,
      categories: mapCategories(created.categories),
    };
  }

  const condition = (body.condition ?? 'GOOD') as BookCondition;
  const imageUrls = body.imageUrls ?? [];

  const created = await prisma.userBook.create({
    data: {
      title: body.title!,
      author: body.author!,
      isbn: body.isbn ?? null,
      description: body.description ?? null,
      coverUrl: body.coverUrl ?? null,
      imageUrls,
      condition,
      catalogBookId: null,
      ownerId,
      ...(body.categoryIds != null && body.categoryIds.length > 0
        ? {
            categories: {
              create: body.categoryIds.map((categoryId) => ({ categoryId })),
            },
          }
        : {}),
    },
    include: detailInclude,
  });
  return {
    ...created,
    categories: mapCategories(created.categories),
  };
}

export async function deleteUserBook(id: number, ownerId: number) {
  const existing = await prisma.userBook.findFirst({
    where: { id, ownerId },
    select: { id: true },
  });
  if (!existing) {
    throw httpError(404, 'Libro no encontrado o no eres el propietario');
  }

  const active = await prisma.tradeItem.findFirst({
    where: {
      userBookId: id,
      trade: { status: { in: ['PROPOSED', 'ACCEPTED'] } },
    },
    select: { id: true },
  });
  if (active) {
    throw httpError(409, 'No se puede eliminar: el libro está en un trueque activo');
  }

  await prisma.userBook.delete({ where: { id } });
}
