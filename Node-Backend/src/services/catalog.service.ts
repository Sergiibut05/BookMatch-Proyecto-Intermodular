import { CatalogRepository } from '../repositories/catalog.repository';

/**
 * Servicio de catálogo
 * Contiene la lógica de negocio
 */
export class CatalogService {
  private repository: CatalogRepository;

  constructor() {
    this.repository = new CatalogRepository();
  }

  async getAllBooks() {
    const books = await this.repository.findAll();
    // Lógica de negocio: filtrar, transformar, etc.
    return books.filter(book => book.stock > 0);
  }

  async getBookById(id: number) {
    if (id <= 0) {
      throw new Error('ID inválido');
    }
    
    const book = await this.repository.findById(id);
    
    if (!book) {
      throw new Error('Libro no encontrado');
    }
    
    return book;
  }
}