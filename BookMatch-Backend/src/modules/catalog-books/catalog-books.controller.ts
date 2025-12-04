import type { Request, Response } from 'express';
import {
  getCatalogBooks, // <--- La nueva
  findCatalogBookById,
  createCatalogBook,
  updateCatalogBook,
  deleteCatalogBook,
  getAllCategories,
} from './catalog-books.service.js';
import {
  createCatalogBookSchema,
  updateCatalogBookSchema,
  getCatalogBooksQuerySchema, // <--- El nuevo esquema
} from './catalog-books.schema.js';

// --- CONTROLADOR ACTUALIZADO (Usa Zod y la nueva lógica) ---
export async function getCatalogBooksCtrl(req: Request, res: Response) {
  try {
    // Zod se encarga de convertir strings a números y validar
    const query = getCatalogBooksQuerySchema.parse(req.query);
    
    const result = await getCatalogBooks(query);
    
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Filtros inválidos', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
}

// --- RESTO DE CONTROLADORES (ORIGINALES) ---

export async function getCatalogBookCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const book = await findCatalogBookById(id);
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    res.json(book);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createCatalogBookCtrl(
  req: Request<unknown, unknown, import('./catalog-books.schema.js').CreateCatalogBookInput>,
  res: Response,
) {
  try {
    const book = await createCatalogBook(req.body); // Ya validado por middleware en rutas
    res.status(201).json(book);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'El ISBN ya está registrado' });
    if (error.code === 'CATEGORY_NOT_FOUND') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
}

export async function updateCatalogBookCtrl(
  req: Request<{ id: string }, unknown, import('./catalog-books.schema.js').UpdateCatalogBookInput>,
  res: Response,
) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const book = await updateCatalogBook(id, req.body);
    res.json(book);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Libro no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'El ISBN ya está registrado' });
    if (error.code === 'CATEGORY_NOT_FOUND') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
}

export async function deleteCatalogBookCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    await deleteCatalogBook(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Libro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}