import prisma from '../config/database.config';

/**
 * Repository para CatalogBook
 * Envuelve las operaciones de Prisma
 * Esta es la única capa que conoce Prisma directamente
 */
export class CatalogRepository {
    
  async findAll() {
    return await prisma.catalogBook.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
  }

  async findById(id: number) {
    return await prisma.catalogBook.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
  }

  async create(data: {
    title: string;
    author: string;
    isbn: string;
    price: number;
    stock: number;
    description?: string;
    coverUrl?: string;
    imageUrls?: string[];
  }) {
    return await prisma.catalogBook.create({
      data
    });
  }
}