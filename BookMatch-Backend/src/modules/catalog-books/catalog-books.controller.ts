import type { Request, Response } from 'express';
import {
  listCatalogBooks,
  findCatalogBookById,
  createCatalogBook,
  updateCatalogBook,
  deleteCatalogBook,
} from './catalog-books.service.js';
import type {
  CreateCatalogBookInput,
  UpdateCatalogBookInput,
} from './catalog-books.schema.js';

function parseCategoryIds(raw: unknown): number[] | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }

  const values = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  if (values.length === 0) {
    return [];
  }

  const ids = values.map((value) => Number(value));

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error('categoryIds debe contener enteros positivos');
  }

  return Array.from(new Set(ids));
}

function parseStringList(raw: unknown): string[] | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  const values = String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length ? Array.from(new Set(values)) : [];
}

function parsePagination(query: any): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  // Límite por defecto 10, tope 100
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  return { page, limit };
}

export async function listCatalogBooksCtrl(req: Request, res: Response) {
  try {
    const categoryIds = parseCategoryIds(req.query.categoryIds);
    const categoryNames = parseStringList(req.query.categoryNames);
    const { page, limit } = parsePagination(req.query);

    const filters =
      categoryIds === undefined && categoryNames === undefined
        ? {}
        : { ...(categoryIds !== undefined ? { categoryIds } : {}), ...(categoryNames !== undefined ? { categoryNames } : {}) };

    const result = await listCatalogBooks(filters, { page, limit });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function getCatalogBookCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const book = await findCatalogBookById(id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    res.json(book);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createCatalogBookCtrl(
  req: Request<unknown, unknown, CreateCatalogBookInput>,
  res: Response,
) {
  try {
    const book = await createCatalogBook(req.body);
    res.status(201).json(book);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El ISBN ya está registrado' });
    }
    if (error.code === 'CATEGORY_NOT_FOUND') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

export async function updateCatalogBookCtrl(
  req: Request<{ id: string }, unknown, UpdateCatalogBookInput>,
  res: Response,
) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const book = await updateCatalogBook(id, req.body);
    res.json(book);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El ISBN ya está registrado' });
    }
    if (error.code === 'CATEGORY_NOT_FOUND') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

export async function deleteCatalogBookCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    await deleteCatalogBook(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}


