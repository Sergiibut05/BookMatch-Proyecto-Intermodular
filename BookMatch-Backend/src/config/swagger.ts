import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Express + PostgreSQL',
      version: '1.0.0',
      description: 'API REST con autenticación mediante Firebase, validación Zod, rate limiting y testing completo',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID interno del usuario',
            },
            firebaseUid: {
              type: 'string',
              description: 'UID del usuario en Firebase',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            fullName: {
              type: 'string',
              nullable: true,
              description: 'Nombre completo del usuario',
            },
            avatarUrl: {
              type: 'string',
              nullable: true,
              description: 'URL del avatar del usuario',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Teléfono del usuario',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización',
            },
          },
        },
        FirebaseAuthInput: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: {
              type: 'string',
              description: 'ID Token emitido por Firebase para el usuario autenticado',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            isNew: {
              type: 'boolean',
              description: 'Indica si el usuario fue creado durante la autenticación',
            },
          },
        },
        UpdateProfileInput: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            fullName: {
              type: 'string',
              nullable: true,
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            phone: {
              type: 'string',
              nullable: true,
            },
          },
        },
        CatalogBook: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            title: {
              type: 'string',
            },
            author: {
              type: 'string',
            },
            isbn: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            coverUrl: {
              type: 'string',
              nullable: true,
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            price: {
              type: 'number',
              format: 'double',
            },
            stock: {
              type: 'integer',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            categories: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Category',
              },
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            slug: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['MAIN', 'SPECIAL'],
            },
          },
        },
        CreateCatalogBookInput: {
          type: 'object',
          required: ['title', 'author', 'isbn', 'price'],
          properties: {
            title: {
              type: 'string',
            },
            author: {
              type: 'string',
            },
            isbn: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            coverUrl: {
              type: 'string',
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            price: {
              type: 'number',
            },
            stock: {
              type: 'integer',
            },
            categoryIds: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
          },
        },
        UpdateCatalogBookInput: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
            },
            author: {
              type: 'string',
            },
            isbn: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            coverUrl: {
              type: 'string',
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            price: {
              type: 'number',
            },
            stock: {
              type: 'integer',
            },
            categoryIds: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación',
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios',
      },
      {
        name: 'CatalogBooks',
        description: 'Gestión de libros del catálogo',
      },
    ],
  },
  apis: [join(__dirname, '../modules/**/*.routes.js'),
        join(__dirname, '../modules/**/*.routes.ts')
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

