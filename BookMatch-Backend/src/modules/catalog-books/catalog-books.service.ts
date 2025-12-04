import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import type { CreateCatalogBookInput, UpdateCatalogBookInput, GetCatalogBooksQuery } from './catalog-books.schema.js';

// --- TUS HELPERS ORIGINALES (INTACTOS) ---

const catalogBookWithCategories = Prisma.validator<Prisma.CatalogBookDefaultArgs>()({
  select: {
    id: true, title: true, author: true, isbn: true, description: true,
    coverUrl: true, imageUrls: true, price: true, stock: true,
    createdAt: true, updatedAt: true,
    categories: {
      select: {
        category: { select: { id: true, name: true, slug: true, type: true } },
      },
    },
    reviews: {
      select: {
        id: true, catalogBookId: true, userId: true, rating: true, comment: true, createdAt: true,
      },
    },
  },
});

type CatalogBookRecord = Prisma.CatalogBookGetPayload<typeof catalogBookWithCategories>;

function mapCatalogBook(record: CatalogBookRecord) {
  const { categories, reviews, ...rest } = record;
  return {
    ...rest,
    price: Number(rest.price), // Asegurar Number
    categories: categories.map((entry) => entry.category),
    reviews: (reviews || []).map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
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

// --- NUEVA FUNCIÓN DE FILTRADO (REEMPLAZA A listCatalogBooks) ---

export const getCatalogBooks = async (query: GetCatalogBooksQuery) => {
  const { page, limit, search, minPrice, maxPrice, categoryId, inStock, sortBy, minRating } = query;

  // 1. Lógica de Rating
  let ratingBookIds: number[] | undefined;
  if (minRating) {
    const groupedReviews = await prisma.review.groupBy({
      by: ['catalogBookId'],
      _avg: { rating: true },
      having: { rating: { _avg: { gte: minRating } } }
    });
    ratingBookIds = groupedReviews.map(r => r.catalogBookId);
  }

  // 2. Construir WHERE
  const where: Prisma.CatalogBookWhereInput = {
    AND: [
      search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      {
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        }
      },
      categoryId ? { categories: { some: { categoryId } } } : {},
      inStock === 'true' ? { stock: { gt: 0 } } : {},
      minRating ? { id: { in: ratingBookIds && ratingBookIds.length > 0 ? ratingBookIds : [0] } } : {}
    ]
  };

  // 3. Construir ORDER BY
  let orderBy: Prisma.CatalogBookOrderByWithRelationInput = { createdAt: 'desc' };
  switch (sortBy) {
    case 'price_asc': orderBy = { price: 'asc' }; break;
    case 'price_desc': orderBy = { price: 'desc' }; break;
    case 'alphabetical': orderBy = { title: 'asc' }; break;
    case 'newest': default: orderBy = { createdAt: 'desc' }; break;
  }

  // 4. Ejecutar consulta (Usando tu validador original)
  const [total, books] = await prisma.$transaction([
    prisma.catalogBook.count({ where }),
    prisma.catalogBook.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      ...catalogBookWithCategories, // <--- USAMOS TU ESTRUCTURA SELECT ORIGINAL
    }),
  ]);

  return {
    // Casteamos a tu tipo Record para que TypeScript no se queje del mapeo
    items: (books as unknown as CatalogBookRecord[]).map(mapCatalogBook),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// --- TUS FUNCIONES CRUD ORIGINALES (INTACTAS) ---

export async function findCatalogBookById(id: number) {
  const book = await prisma.catalogBook.findUnique({
    where: { id },
    ...catalogBookWithCategories,
  });

  return book ? mapCatalogBook(book) : null;
}

// Alias para compatibilidad
export const getCatalogBookById = findCatalogBookById;

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
  if (input.categoryIds) {
    await ensureCategoriesExist(input.categoryIds);
  }

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

export async function getAllCategories() {
  // Busca todas las categorías en la base de datos
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc', // Opcional: Para que te lleguen ordenadas alfabéticamente al frontend
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true, // Asumo que tienes este campo basado en tu código anterior
    }
  });

  return categories;
}