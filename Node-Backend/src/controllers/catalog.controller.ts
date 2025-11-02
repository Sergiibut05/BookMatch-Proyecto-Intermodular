import { Request, Response } from 'express';
import { CatalogService } from '../services/catalog.service';

export class CatalogController {
    private service: CatalogService;
  
    constructor() {
      this.service = new CatalogService();
    }
  
    // GET /api/catalog
    getAllBooks = async (req: Request, res: Response) => {
      try {
        const books = await this.service.getAllBooks();
        res.json(books);
      } catch (error) {
        res.status(500).json({
          error: 'Error fetching books',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  
    // GET /api/catalog/:id
    getBookById = async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const book = await this.service.getBookById(id);
        res.json(book);
      } catch (error) {
        if (error instanceof Error && error.message === 'Libro no encontrado') {
          return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
          error: 'Error fetching book',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  
    // POST /api/catalog
    createBook = async (req: Request, res: Response) => {
      try {
        //const userId = req.user?.uid; // Firebase UID
        //const userEmail = req.user?.email; // Firebase email para luego poner createdBy: userEmail
        // Aquí falta el método createBook en el service
        // const book = await this.service.createBook(req.body);
        res.status(201).json({ message: 'Not implemented yet' });
      } catch (error) {
        res.status(400).json({
          error: 'Error creating book',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  }