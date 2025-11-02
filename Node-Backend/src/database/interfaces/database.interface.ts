/**
 Interfaz genérica para la base de datos
 */
export interface IDatabase {
    
    connect(): Promise<void>;
    
    
    disconnect(): Promise<void>;
    
    // Método para obtener el cliente Prisma (específico de Prisma)
    getPrismaClient(): any; // O el tipo específico de PrismaClient
  }