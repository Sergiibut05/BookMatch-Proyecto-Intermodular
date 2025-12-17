import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { normalizeText } from '../../utils/textUtils.js';
import type { 
  CreateCatalogBookInput, 
  UpdateCatalogBookInput, 
  GetCatalogBooksQuery,
  CreateReviewInput
} from './catalog-books.schema.js';

// --- HELPERS Y MAPEOS (INTACTOS) ---

const catalogBookWithCategories = {
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
        id: true, 
        catalogBookId: true, 
        userId: true, 
        rating: true, 
        comment: true, 
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    },
  },
};

type CatalogBookRecord = any;

function mapCatalogBook(record: CatalogBookRecord) {
  const { categories, reviews, ...rest } = record;
  return {
    ...rest,
    price: Number(rest.price),
    categories: categories.map((entry: any) => entry.category),
    reviews: (reviews || []).map((review: any) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
      user: review.user ? {
        id: review.user.id,
        fullName: review.user.fullName,
        avatarUrl: review.user.avatarUrl,
      } : null,
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

  const foundIds = new Set(categories.map((category: any) => category.id));
  const missing = categoryIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    const error = new Error(`Categorías no encontradas: ${missing.join(', ')}`);
    (error as any).code = 'CATEGORY_NOT_FOUND';
    throw error;
  }
}

// --- FUNCIONES DE LECTURA (INTACTAS) ---

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
    ratingBookIds = groupedReviews.map((r: any) => r.catalogBookId);
  }

  // 2. Si hay búsqueda, usar SQL raw para normalizar ambos lados
  let searchBookIds: number[] | undefined;
  if (search) {
    const normalizedSearch = normalizeText(search);
    // Usar SQL raw para normalizar tanto el término como los datos de la BD
    // Usamos una función que normaliza caracteres acentuados comunes en español
    const searchResults = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id 
      FROM catalog_books 
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
            LOWER(author),
            'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ',
            'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC'
          )
        ) LIKE ${`%${normalizedSearch}%`}
        OR LOWER(isbn) LIKE ${`%${normalizedSearch}%`}
    `;
    searchBookIds = searchResults.map((r: any) => r.id);
  }

  // 3. Construir WHERE
  const where: any = {
    AND: [
      searchBookIds ? { id: { in: searchBookIds.length > 0 ? searchBookIds : [0] } } : {},
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
  let orderBy: any = { createdAt: 'desc' };
  switch (sortBy) {
    case 'price_asc': orderBy = { price: 'asc' }; break;
    case 'price_desc': orderBy = { price: 'desc' }; break;
    case 'alphabetical': orderBy = { title: 'asc' }; break;
    case 'newest': default: orderBy = { createdAt: 'desc' }; break;
  }

  const [total, books] = await prisma.$transaction([
    prisma.catalogBook.count({ where }),
    prisma.catalogBook.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      ...catalogBookWithCategories,
    }),
  ]);

  return {
    items: (books as unknown as CatalogBookRecord[]).map(mapCatalogBook),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export async function findCatalogBookById(id: number) {
  const book = await prisma.catalogBook.findUnique({
    where: { id },
    ...catalogBookWithCategories,
  });

  return book ? mapCatalogBook(book) : null;
}

export const getCatalogBookById = findCatalogBookById;

export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, type: true }
  });
  return categories;
}

// --- FUNCIONES CRUD (INTACTAS) ---

export async function createCatalogBook(input: CreateCatalogBookInput) {
  await ensureCategoriesExist(input.categoryIds);

  const {
    categoryIds = [], price, stock = 0, imageUrls = [], description, coverUrl, title, author, isbn,
  } = input;

  const data: any = {
    title, author, isbn,
    description: description ?? null,
    coverUrl: coverUrl ?? null,
    price: price,
    stock, imageUrls,
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
    categoryIds, price, imageUrls, description, coverUrl, stock, title, author, isbn,
  } = input;

  const data: any = {};

  if (title !== undefined) data.title = title;
  if (author !== undefined) data.author = author;
  if (isbn !== undefined) data.isbn = isbn;
  if (description !== undefined) data.description = description;
  if (coverUrl !== undefined) data.coverUrl = coverUrl;
  if (price !== undefined) data.price = price;
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

// --- NUEVA FUNCIÓN PARA RESEÑAS ---

export async function addReview(bookId: number, userId: number, input: CreateReviewInput) {
  // 1. Verificar si el libro existe
  const book = await prisma.catalogBook.findUnique({
    where: { id: bookId },
    select: { id: true }
  });

  if (!book) {
    const error = new Error('Libro no encontrado');
    (error as any).code = 'BOOK_NOT_FOUND';
    throw error;
  }

  // 2. Crear la reseña usando 'UncheckedCreateInput'
  const review = await prisma.review.create({
    data: {
      rating: input.rating,
      comment: input.comment,
      catalogBookId: bookId, 
      userId: userId,        
    } as any 
  });

  return {
    ...review,
    createdAt: review.createdAt.toISOString()
  };
}

// --- MODIFICACIÓN: FUNCIÓN PARA BORRAR RESEÑA CON PERMISO ADMIN ---
// Se ha añadido el parámetro userRole para verificar si es ADMIN
export async function deleteReview(reviewId: number, userId: number, userRole: string) {
  // 1. Buscamos la reseña
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    const error: any = new Error('Reseña no encontrada');
    error.code = 'REVIEW_NOT_FOUND';
    throw error;
  }

  // 2. Verificamos permisos:
  // Permitimos borrar SI: (El usuario es el dueño) O (El rol es ADMIN)
  if (review.userId !== userId && userRole !== 'ADMIN') {
    const error: any = new Error('No tienes permiso para borrar esta reseña');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  // 3. Borramos
  return await prisma.review.delete({
    where: { id: reviewId },
  });
}