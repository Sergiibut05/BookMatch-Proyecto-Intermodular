import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import type { CreateCatalogBookInput, UpdateCatalogBookInput } from './catalog-books.schema.js';

const catalogBookWithCategories = Prisma.validator<Prisma.CatalogBookDefaultArgs>()({
  select: {
    id: true,
    title: true,
    author: true,
    isbn: true,
    description: true,
    coverUrl: true,
    imageUrls: true,
    price: true,
    stock: true,
    createdAt: true,
    updatedAt: true,
    categories: {
      select: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
    },
  },
});

type CatalogBookRecord = Prisma.CatalogBookGetPayload<typeof catalogBookWithCategories>;

function mapCatalogBook(record: CatalogBookRecord) {
  const { categories, ...rest } = record;
  return {
    ...rest,
    categories: categories.map((entry) => entry.category),
  };
}

async function ensureCategoriesExist(categoryIds: number[] | undefined) {
  if (!categoryIds || categoryIds.length === 0) {
    return;
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });

  const foundIds = new Set(categories.map((category) => category.id));
  const missing = categoryIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    const error = new Error(`Categorías no encontradas: ${missing.join(', ')}`);
    (error as any).code = 'CATEGORY_NOT_FOUND';
    throw error;
  }
}

export async function listCatalogBooks(filters: { categoryIds?: number[] } = {}) {
  const where: Prisma.CatalogBookWhereInput = {};

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.categories = {
      some: {
        categoryId: { in: filters.categoryIds },
      },
    };
  }

  const books = await prisma.catalogBook.findMany({
    where,
    ...catalogBookWithCategories,
    orderBy: { id: 'asc' },
  });

  return books.map(mapCatalogBook);
}

export async function findCatalogBookById(id: number) {
  const book = await prisma.catalogBook.findUnique({
    where: { id },
    ...catalogBookWithCategories,
  });

  return book ? mapCatalogBook(book) : null;
}

export async function createCatalogBook(input: CreateCatalogBookInput) {
  await ensureCategoriesExist(input.categoryIds);

  const {
    categoryIds = [],
    price,
    stock = 0,
    imageUrls = [],
    description,
    coverUrl,
    title,
    author,
    isbn,
  } = input;

  const data: Prisma.CatalogBookCreateInput = {
    title,
    author,
    isbn,
    description: description ?? null,
    coverUrl: coverUrl ?? null,
    price: new Prisma.Decimal(price),
    stock,
    imageUrls,
  };

  if (categoryIds.length) {
    data.categories = {
      create: categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    };
  }

  const created = await prisma.catalogBook.create({
    data,
    ...catalogBookWithCategories,
  });

  return mapCatalogBook(created);
}

export async function updateCatalogBook(id: number, input: UpdateCatalogBookInput) {
  await ensureCategoriesExist(input.categoryIds);

  const {
    categoryIds,
    price,
    imageUrls,
    description,
    coverUrl,
    stock,
    title,
    author,
    isbn,
  } = input;

  const data: Prisma.CatalogBookUpdateInput = {};

  if (title !== undefined) data.title = title;
  if (author !== undefined) data.author = author;
  if (isbn !== undefined) data.isbn = isbn;
  if (description !== undefined) data.description = description;
  if (coverUrl !== undefined) data.coverUrl = coverUrl;
  if (price !== undefined) data.price = new Prisma.Decimal(price);
  if (stock !== undefined) data.stock = stock;
  if (imageUrls !== undefined) {
    data.imageUrls = { set: imageUrls };
  }
  if (categoryIds) {
    data.categories = {
      deleteMany: {},
      create: categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    };
  }

  const updated = await prisma.catalogBook.update({
    where: { id },
    data,
    ...catalogBookWithCategories,
  });

  return mapCatalogBook(updated);
}

export async function deleteCatalogBook(id: number) {
  await prisma.catalogBook.delete({ where: { id } });
}


