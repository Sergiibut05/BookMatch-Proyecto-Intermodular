# API Express + PostgreSQL - Manual Completo

Este proyecto implementa una API REST con Node.js, Express y PostgreSQL siguiendo un desarrollo incremental versionado con Git tags. Cada versión añade funcionalidad nueva de forma progresiva..

## 📚 Índice

- [Navegación entre versiones](#-navegación-entre-versiones)
- [Tecnologías utilizadas](#-tecnologías-utilizadas)
- [Inicio rápido](#-inicio-rápido)
- [Versiones del proyecto](#️-versiones-del-proyecto)
  - [v0.1.0 - Proyecto base](#v010---proyecto-base)
  - [v0.2.0 - Express básico](#v020---express-básico)
  - [v0.3.0 - PostgreSQL + Docker con Prisma](#v030---postgresql--docker-con-prisma)
  - [v0.4.0 - Validación con Zod](#v040---validación-con-zod)
  - [v0.5.0 - Módulo Auth (registro/login)](#v050---módulo-auth-registrologin)
  - [v0.6.0 - Middleware de autenticación](#v060---middleware-de-autenticación)
  - [v0.7.0 - Mejoras en Users](#v070---mejoras-en-users-actualizar-perfil-y-cambiar-contraseña)
  - [v0.8.0 - Seguridad adicional](#v080---seguridad-adicional-rate-limiting-y-logging)
  - [v0.9.0 - Testing](#v090---testing-con-jest-y-supertest)
  - [v1.0.0 - Producción](#v100---producción-y-documentación)
  - [v1.0.1 - Fix Swagger](#v101---fix-documentación-swagger-completa)
  - [v1.0.2 - Fix tsx](#v102---fix-tsx-para-es-modules-en-desarrollo)

---

## 📋 Navegación entre versiones

### Ver todas las versiones disponibles
```bash
git tag
```

### Cambiar a una versión específica
```bash
git checkout v0.3.0
npm install
```

### Volver a la última versión
```bash
git checkout main
npm install
```

### Ver diferencias entre versiones
```bash
git diff v0.2.0 v0.3.0
```

### Ver commits de una versión
```bash
git log v0.2.0..v0.3.0 --oneline
```

---

## 🔧 Tecnologías utilizadas

- **Node.js** (≥ 18) + **TypeScript** - Lenguaje y runtime
- **Express** - Framework web
- **PostgreSQL** - Base de datos relacional
- **Prisma** - ORM moderno con type-safety
- **JWT** - Autenticación con tokens
- **bcrypt** - Hash de contraseñas
- **Zod** - Validación de esquemas
- **Docker** - Contenedores para PostgreSQL
- **Morgan** - Logging de requests HTTP
- **Helmet** - Seguridad con headers HTTP
- **CORS** - Control de acceso cross-origin
- **Winston** - Sistema de logging profesional
- **express-rate-limit** - Rate limiting por IP
- **Jest** + **Supertest** - Testing de integración

---

## 🚀 Inicio rápido

### Clonar y usar la última versión
```bash
# Clonar proyecto
git clone <repository>
cd node-server

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env y configurar JWT_SECRET

# Levantar PostgreSQL con Docker
docker-compose up -d

# Ejecutar migraciones
npx prisma migrate dev

# Compilar TypeScript
npm run build

# Iniciar servidor
npm start

# O en modo desarrollo
npm run dev

# Ejecutar tests
npm test
```

### Probar la API
```bash
# Health check
curl http://localhost:3000/health

# Documentación Swagger
open http://localhost:3000/api-docs

# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🗂️ Versiones del proyecto

## v0.1.0 - Proyecto base

**Objetivo:** Inicializar el proyecto con todas las dependencias necesarias, configurar TypeScript y crear la estructura de carpetas modular.

### Paso 1: Inicializar proyecto npm

```bash
npm init -y
```

**Qué hace:** Crea `package.json` con configuración por defecto para gestionar dependencias y scripts.

### Paso 2: Instalar dependencias de producción

```bash
npm install express cors helmet morgan dotenv bcrypt jsonwebtoken zod
```

**Dependencias instaladas:**
- `express` - Framework web para Node.js
- `cors` - Middleware para habilitar CORS
- `helmet` - Seguridad con headers HTTP
- `morgan` - Logger de peticiones HTTP
- `dotenv` - Carga variables de entorno desde .env
- `bcrypt` - Hash de contraseñas con salt
- `jsonwebtoken` - Generación y verificación de JWT
- `zod` - Validación de schemas con TypeScript

### Paso 3: Instalar dependencias de desarrollo

```bash
npm install -D nodemon typescript @types/node @types/express @types/jsonwebtoken @types/bcrypt @types/cors @types/morgan ts-node
```

**Dependencias de desarrollo:**
- `typescript` - Compilador TypeScript
- `nodemon` - Reinicia automáticamente el servidor en desarrollo
- `ts-node` - Ejecuta TypeScript sin compilar
- `@types/*` - Tipos TypeScript para las librerías

### Paso 4: Configurar TypeScript

```bash
npx tsc --init
```

**Qué hace:** Genera `tsconfig.json` con configuración de TypeScript.

**Configuración aplicada:**
- `rootDir: "./src"` - Código fuente en carpeta src
- `outDir: "./dist"` - Código compilado en carpeta dist
- `strict: true` - Modo estricto TypeScript
- `esModuleInterop: true` - Interoperabilidad con CommonJS
- `module: "nodenext"` - Módulos ES6 modernos

### Paso 5: Crear estructura de carpetas

```bash
mkdir -p src/config src/middleware src/modules/auth src/modules/users src/utils src/tests
```

**Estructura creada:**
```
src/
├── config/          # Configuración (DB, env)
├── middleware/      # Middlewares (auth, validación, errores)
├── modules/         # Módulos de la aplicación
│   ├── auth/       # Autenticación (registro, login)
│   └── users/      # Gestión de usuarios
├── utils/          # Utilidades y helpers
└── tests/          # Tests unitarios e integración
```

### Paso 6: Configurar scripts en package.json

Añadir scripts al `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc -p .",
    "start": "node dist/index.js",
    "test": "jest"
  }
}
```

**Scripts:**
- `npm run dev` - Desarrollo con hot-reload
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Ejecuta versión compilada
- `npm test` - Ejecuta tests (futuro)

### Paso 7: Configurar variables de entorno

Crear `.env.example`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=supersecreta_cambia_esto
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
BCRYPT_SALT_ROUNDS=10
```

**Variables configuradas:**
- `PORT` - Puerto del servidor
- `NODE_ENV` - Entorno (development/production)
- `JWT_SECRET` - Clave secreta para firmar JWT (cambiar en producción)
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `BCRYPT_SALT_ROUNDS` - Rounds de hash para bcrypt (10 = ~10ms)

### Paso 8: Configurar .gitignore

Crear `.gitignore`:

```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
```

**Archivos ignorados:**
- `node_modules/` - Dependencias
- `dist/` - Código compilado
- `.env` - Variables de entorno sensibles
- Logs y archivos temporales

### Paso 9: Configurar nodemon

Crear `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/index.ts"
}
```

**Configuración:**
- Observa cambios en carpeta `src`
- Extensiones `.ts`
- Ejecuta con `ts-node`

### Verificar instalación

```bash
npm run build
# Debe compilar sin errores
```

### ✅ Resultado v0.1.0

- ✅ Proyecto npm inicializado
- ✅ TypeScript configurado
- ✅ Dependencias instaladas
- ✅ Estructura de carpetas creada
- ✅ Scripts de desarrollo listos

---

## v0.2.0 - Express básico

**Objetivo:** Configurar servidor Express con middlewares básicos, variables de entorno, endpoint de health check y manejo de errores.

### Paso 1: Crear configuración de variables de entorno

Crear `src/config/env.ts`:

```typescript
import 'dotenv/config';

const required = (v: string | undefined, k: string) => {
  if (!v) throw new Error(`Falta variable de entorno: ${k}`);
  return v;
};

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: required(process.env.JWT_SECRET, 'JWT_SECRET'),
  DATABASE_URL: required(process.env.DATABASE_URL, 'DATABASE_URL'),
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
};
```

**Qué hace:**
- Carga variables desde `.env`
- Valida que existan variables obligatorias
- Convierte tipos (string a number)
- Exporta objeto tipado para usar en toda la app

### Paso 2: Crear middleware de manejo de errores

Crear `src/middleware/error.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error interno' });
}
```

**Qué hace:**
- Captura errores de toda la aplicación
- Logs del error
- Responde con status code apropiado
- Formato JSON consistente

### Paso 3: Configurar aplicación Express

Crear `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
```

**Middlewares configurados:**
- `helmet()` - Headers de seguridad (X-Frame-Options, etc)
- `cors()` - Permite requests de otros dominios
- `express.json()` - Parsea body JSON
- `morgan('dev')` - Logs de requests en consola

**Endpoint:**
- `GET /health` - Health check para monitoreo

### Paso 4: Crear servidor

Crear `src/index.ts`:

```typescript
import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`API escuchando en http://localhost:${env.PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
```

**Qué hace:**
- Inicia servidor Express en puerto configurado
- Graceful shutdown en SIGTERM/SIGINT (Ctrl+C)
- Log de inicio del servidor

### Paso 5: Configurar archivo .env

```bash
cp .env.example .env
```

Editar `.env` y cambiar `JWT_SECRET` por un valor seguro.

### Paso 6: Compilar y probar

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor
npm start
```

### Paso 7: Probar endpoint health

```bash
curl http://localhost:3000/health
# {"ok":true}
```

### ✅ Resultado v0.2.0

- ✅ Servidor Express funcionando
- ✅ Variables de entorno configuradas
- ✅ Middlewares de seguridad activos
- ✅ Health check endpoint
- ✅ Manejo de errores global
- ✅ Logging de requests

**Archivos creados:**
- `src/index.ts` - Arranque del servidor
- `src/app.ts` - Configuración Express
- `src/config/env.ts` - Variables de entorno
- `src/middleware/error.ts` - Error handler

---

## v0.3.0 - PostgreSQL + Docker con Prisma

**Objetivo:** Configurar PostgreSQL con Docker, integrar Prisma ORM, crear modelo User y ejecutar primera migración.

### Paso 1: Instalar dependencias de Prisma

```bash
npm install -D prisma
npm install @prisma/client
```

**Dependencias:**
- `prisma` - CLI de Prisma para migraciones
- `@prisma/client` - Cliente generado para queries

### Paso 2: Inicializar Prisma

```bash
npx prisma init
```

**Qué hace:**
- Crea carpeta `prisma/`
- Genera `prisma/schema.prisma`
- Genera `prisma.config.ts` (eliminar, no necesario)

**Eliminar archivo innecesario:**
```bash
rm prisma.config.ts
```

### Paso 3: Configurar Docker Compose para PostgreSQL

Crear `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16
    container_name: node-server-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Configuración:**
- Imagen: `postgres:16` (versión LTS)
- Puerto: `5432` expuesto
- Volumen persistente `pgdata` para datos
- Healthcheck para verificar estado
- Credenciales por defecto (cambiar en producción)

### Paso 4: Definir schema de Prisma

Editar `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
}
```

**Modelo User:**
- `id` - Primary key autoincremental
- `email` - Único, para login
- `name` - Nombre del usuario
- `passwordHash` - Contraseña hasheada con bcrypt
- `createdAt` - Timestamp de creación

### Paso 5: Levantar PostgreSQL

```bash
docker-compose up -d
```

**Qué hace:**
- Descarga imagen de PostgreSQL si no existe
- Crea contenedor en background (`-d`)
- Crea volumen para persistencia
- Expone puerto 5432

**Verificar estado:**
```bash
docker-compose ps
# Debe mostrar estado "healthy"
```

### Paso 6: Ejecutar migración inicial

```bash
npx prisma migrate dev --name init
```

**Qué hace:**
- Crea carpeta `prisma/migrations/`
- Genera SQL de migración
- Ejecuta migración en base de datos
- Genera Prisma Client actualizado

**Archivos generados:**
```
prisma/migrations/
└── 20251104112830_init/
    └── migration.sql
```

### Paso 7: Verificar tabla creada

```bash
docker exec node-server-postgres psql -U postgres -d app_db -c "\dt"
```

**Resultado esperado:**
```
               List of relations
 Schema |        Name        | Type  |  Owner   
--------+--------------------+-------+----------
 public | User               | table | postgres
 public | _prisma_migrations | table | postgres
```

### Paso 8: Crear cliente de Prisma

Crear `src/config/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

**Qué hace:**
- Exporta instancia única de PrismaClient
- Auto-completado TypeScript con el schema
- Gestión automática de conexiones

### Paso 9: Actualizar .gitignore

Añadir a `.gitignore`:

```
.env.test
.env.production
```

### ✅ Resultado v0.3.0

- ✅ PostgreSQL corriendo en Docker
- ✅ Prisma ORM configurado
- ✅ Modelo User definido
- ✅ Migración ejecutada
- ✅ Tabla User creada en DB
- ✅ Cliente Prisma disponible

**Archivos creados:**
- `docker-compose.yml` - Configuración Docker
- `prisma/schema.prisma` - Schema de Prisma
- `prisma/migrations/` - Migraciones SQL
- `src/config/db.ts` - Cliente Prisma

**Comandos útiles de Prisma:**
```bash
npx prisma studio              # Interfaz web para ver datos
npx prisma migrate dev         # Crear nueva migración
npx prisma generate            # Regenerar cliente
npx prisma db push             # Push schema sin migración (dev)
docker-compose logs -f postgres # Ver logs de PostgreSQL
```

---

## v0.4.0 - Validación con Zod

**Objetivo:** Implementar validación de datos de entrada con Zod, crear middleware genérico de validación y añadir CRUD completo de usuarios.

### Paso 1: Crear middleware de validación

Crear `src/middleware/validate.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  req.body = parsed.data;
  next();
};
```

**Qué hace:**
- Middleware reutilizable para cualquier schema
- Valida `req.body` con el schema proporcionado
- Si válido: sanitiza datos y continúa
- Si inválido: retorna 400 con errores detallados

### Paso 2: Crear schemas de validación para Users

Crear `src/modules/users/users.schema.ts`:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

**Schemas definidos:**
- `registerSchema` - Validación para registro (email, name, password)
- `loginSchema` - Validación para login (email, password)
- `updateUserSchema` - Validación para actualizar usuario (campos opcionales)

**Tipos TypeScript:**
- Generados automáticamente desde schemas con `z.infer<>`
- Type-safety completo en toda la app

### Paso 3: Crear service de usuarios

Crear `src/modules/users/users.service.ts`:

```typescript
import { prisma } from '../../config/db.js';

export async function createUser(email: string, name: string, passwordHash: string) {
  return prisma.user.create({ 
    data: { email, name, passwordHash }, 
    select: { id: true, email: true, name: true, createdAt: true } 
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: number) {
  return prisma.user.findUnique({ 
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true }
  });
}

export async function listUsers() {
  return prisma.user.findMany({ 
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { id: 'asc' }
  });
}

export async function updateUser(id: number, data: { name?: string; email?: string }) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, createdAt: true }
  });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({ where: { id } });
}
```

**Funciones del service:**
- `createUser` - Crear usuario (usado en registro)
- `findUserByEmail` - Buscar por email (usado en login)
- `findUserById` - Buscar por ID
- `listUsers` - Listar todos (sin passwordHash)
- `updateUser` - Actualizar datos
- `deleteUser` - Eliminar usuario

**Características:**
- Usa Prisma Client con type-safety
- `select` para excluir `passwordHash` en respuestas
- Queries optimizadas

### Paso 4: Crear controllers de usuarios

Crear `src/modules/users/users.controller.ts`:

```typescript
import type { Request, Response } from 'express';
import { listUsers, findUserById, updateUser, deleteUser } from './users.service.js';

export async function listUsersCtrl(_req: Request, res: Response) {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateUserCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const user = await updateUser(id, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }
    res.status(500).json({ message: error.message });
  }
}

export async function deleteUserCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    await deleteUser(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}
```

**Controllers:**
- Reciben Request, responden Response
- Validan parámetros (ID numérico)
- Manejan errores específicos de Prisma:
  - `P2025` - Registro no encontrado (404)
  - `P2002` - Constraint unique violation (409)
- Responses con códigos HTTP apropiados

### Paso 5: Crear rutas de usuarios

Crear `src/modules/users/users.routes.ts`:

```typescript
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema } from './users.schema.js';
import { listUsersCtrl, getUserCtrl, updateUserCtrl, deleteUserCtrl } from './users.controller.js';

const router = Router();

router.get('/', listUsersCtrl);
router.get('/:id', getUserCtrl);
router.patch('/:id', validate(updateUserSchema), updateUserCtrl);
router.delete('/:id', deleteUserCtrl);

export default router;
```

**Rutas definidas:**
- `GET /` - Listar todos los usuarios
- `GET /:id` - Obtener usuario por ID
- `PATCH /:id` - Actualizar usuario (con validación Zod)
- `DELETE /:id` - Eliminar usuario

### Paso 6: Integrar rutas en app

Editar `src/app.ts` y añadir:

```typescript
import usersRoutes from './modules/users/users.routes.js';

// Después de los middlewares
app.use('/api/users', usersRoutes);
```

### Paso 7: Compilar y probar

```bash
npm run build
npm start
```

### Paso 8: Probar endpoints

```bash
# Listar usuarios (vacío por ahora)
curl http://localhost:3000/api/users
# []

# Validación: actualizar con datos inválidos
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","name":"A"}'
# {"errors":{"fieldErrors":{"name":["El nombre debe tener al menos 2 caracteres"],"email":["Email inválido"]}}}
```

### ✅ Resultado v0.4.0

- ✅ Middleware de validación genérico
- ✅ Schemas Zod con mensajes en español
- ✅ Types TypeScript desde Zod
- ✅ CRUD completo de usuarios
- ✅ Manejo de errores de Prisma
- ✅ Validación automática en rutas

**Archivos creados:**
- `src/middleware/validate.ts` - Middleware genérico
- `src/modules/users/users.schema.ts` - Schemas Zod
- `src/modules/users/users.service.ts` - Lógica de negocio
- `src/modules/users/users.controller.ts` - Controllers HTTP
- `src/modules/users/users.routes.ts` - Definición de rutas

**Endpoints disponibles:**
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

---

## v0.5.0 - Módulo Auth (registro/login)

**Objetivo:** Implementar autenticación completa con registro, login, hash de contraseñas con bcrypt y generación de JWT.

### Paso 1: Crear service de autenticación

Crear `src/modules/auth/auth.service.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createUser, findUserByEmail } from '../users/users.service.js';

export async function register(email: string, name: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email ya registrado');
  }
  
  const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await createUser(email, name, hash);
  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
  
  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Credenciales inválidas');
  }
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error('Credenciales inválidas');
  }
  
  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
  
  return { 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      createdAt: user.createdAt
    }, 
    token 
  };
}
```

**Función register:**
1. Verifica que email no exista
2. Hashea contraseña con bcrypt (10 rounds por defecto)
3. Crea usuario en DB con hash
4. Genera JWT con id y email
5. Retorna usuario (sin password) + token

**Función login:**
1. Busca usuario por email
2. Si no existe, error genérico (seguridad)
3. Compara contraseña con hash usando bcrypt
4. Si no coincide, error genérico
5. Genera JWT
6. Retorna usuario + token

**Seguridad:**
- Password nunca se almacena en texto plano
- Hash con bcrypt (resistente a ataques de fuerza bruta)
- Mensaje genérico "Credenciales inválidas" (evita enumerar usuarios)
- JWT firmado con secret (verificable)

### Paso 2: Crear controller de autenticación

Crear `src/modules/auth/auth.controller.ts`:

```typescript
import type { Request, Response } from 'express';
import { register, login } from './auth.service.js';
import { registerSchema, loginSchema } from '../users/users.schema.js';

export async function registerCtrl(req: Request, res: Response) {
  try {
    const { email, name, password } = registerSchema.parse(req.body);
    const data = await register(email, name, password);
    res.status(201).json(data);
  } catch (e: any) {
    if (e.message === 'Email ya registrado') {
      return res.status(409).json({ message: e.message });
    }
    res.status(400).json({ message: e.message });
  }
}

export async function loginCtrl(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const data = await login(email, password);
    res.json(data);
  } catch (e: any) {
    if (e.message === 'Credenciales inválidas') {
      return res.status(401).json({ message: e.message });
    }
    res.status(400).json({ message: e.message });
  }
}
```

**Controllers:**
- Validan entrada con schemas Zod
- Llaman a service correspondiente
- Manejan errores con códigos HTTP apropiados:
  - `201` - Created (registro exitoso)
  - `200` - OK (login exitoso)
  - `409` - Conflict (email duplicado)
  - `401` - Unauthorized (credenciales incorrectas)
  - `400` - Bad Request (validación fallida)

### Paso 3: Crear rutas de autenticación

Crear `src/modules/auth/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { registerCtrl, loginCtrl } from './auth.controller.js';

const router = Router();

router.post('/register', registerCtrl);
router.post('/login', loginCtrl);

export default router;
```

**Rutas públicas (sin autenticación):**
- `POST /register` - Registrar nuevo usuario
- `POST /login` - Login y obtener JWT

### Paso 4: Integrar rutas en app

Editar `src/app.ts` y añadir:

```typescript
import authRoutes from './modules/auth/auth.routes.js';

// Antes de las rutas de users
app.use('/api/auth', authRoutes);
```

### Paso 5: Compilar y probar

```bash
npm run build
npm start
```

### Paso 6: Probar registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
```

**Respuesta (201):**
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2025-11-04T11:34:54.797Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Paso 7: Probar login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Respuesta (200):**
```json
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Paso 8: Probar casos de error

```bash
# Email duplicado
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email":"test@example.com","name":"Test","password":"12345678"}'
# {"message":"Email ya registrado"}

# Credenciales incorrectas
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
# {"message":"Credenciales inválidas"}

# Validación de contraseña
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email":"new@example.com","name":"User","password":"123"}'
# {"message":"...La contraseña debe tener al menos 8 caracteres..."}
```

### Paso 9: Verificar hash en base de datos

```bash
docker exec node-server-postgres psql -U postgres -d app_db \
  -c 'SELECT "passwordHash" FROM "User" WHERE id=1'
```

**Resultado:**
```
                       passwordHash                         
------------------------------------------------------------
 $2b$10$rZPej6od4rb4gqp.d4T/9OmIryEsduI8u4YmrFCv4RTiAC72pG3Jm
```

El hash comienza con `$2b$10$` (bcrypt, 10 rounds).

### ✅ Resultado v0.5.0

- ✅ Registro de usuarios con hash bcrypt
- ✅ Login con verificación de contraseñas
- ✅ Generación de JWT (válido 7 días)
- ✅ Payload JWT: { sub, email, iat, exp }
- ✅ Manejo de errores (409, 401, 400)
- ✅ Validación con Zod integrada
- ✅ Contraseñas nunca en texto plano

**Archivos creados:**
- `src/modules/auth/auth.service.ts` - Lógica de autenticación
- `src/modules/auth/auth.controller.ts` - Controllers HTTP
- `src/modules/auth/auth.routes.ts` - Rutas públicas

**Endpoints disponibles:**
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login

**Flujo de autenticación:**
1. Usuario se registra → recibe token
2. Usuario guarda token (localStorage, cookie, etc)
3. Usuario incluye token en requests subsecuentes

---

## v0.6.0 - Middleware de autenticación

**Objetivo:** Crear middleware para verificar JWT, proteger rutas de usuarios y añadir endpoint `/me` para perfil autenticado.

### Paso 1: Crear middleware de autenticación JWT

Crear `src/middleware/auth.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      user?: { sub: number; email: string };
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  const token = header.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    
    if (
      typeof payload === 'object' && 
      payload !== null && 
      'sub' in payload && 
      'email' in payload &&
      typeof payload.sub === 'number' &&
      typeof payload.email === 'string'
    ) {
      req.user = { sub: payload.sub, email: payload.email };
      next();
    } else {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
```

**Qué hace el middleware:**
1. Lee header `Authorization`
2. Verifica formato `Bearer <token>`
3. Extrae token
4. Verifica JWT con `jwt.verify()` usando secret
5. Valida que payload tenga `sub` y `email`
6. Inyecta `req.user` con datos del usuario
7. Permite continuar con `next()`
8. Si falla, retorna 401

**Type-safety:**
- Extiende tipos de Express para incluir `req.user`
- TypeScript sabe que `req.user` existe en rutas protegidas

### Paso 2: Añadir endpoint /me al controller

Editar `src/modules/users/users.controller.ts` y añadir:

```typescript
import { findUserByEmail } from './users.service.js';

export async function meCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
```

**Endpoint /me:**
- Lee usuario desde `req.user` (inyectado por middleware)
- Busca usuario actualizado en DB
- Retorna datos del perfil (sin password)

### Paso 3: Proteger rutas de usuarios

Editar `src/modules/users/users.routes.ts`:

```typescript
import { auth } from '../../middleware/auth.js';
import { meCtrl } from './users.controller.js';

// Todas las rutas requieren autenticación
router.get('/', auth, listUsersCtrl);
router.get('/me', auth, meCtrl);
router.get('/:id', auth, getUserCtrl);
router.patch('/:id', auth, validate(updateUserSchema), updateUserCtrl);
router.delete('/:id', auth, deleteUserCtrl);
```

**Cambios:**
- Todas las rutas ahora usan middleware `auth`
- Nueva ruta `GET /me` para perfil autenticado
- Orden importante: `/me` antes de `/:id` (evita conflicto)

### Paso 4: Compilar y probar

```bash
npm run build
npm start
```

### Paso 5: Probar acceso sin token (debe fallar)

```bash
curl http://localhost:3000/api/users
# {"message":"No autorizado"}
```

### Paso 6: Obtener token y probar con autenticación

```bash
# Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Listar usuarios con token
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
# [{"id":1,"email":"test@example.com","name":"Test User",...}]
```

### Paso 7: Probar endpoint /me

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta (200):**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Test User",
  "createdAt": "2025-11-04T11:34:54.797Z"
}
```

### Paso 8: Probar con token inválido

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer invalid_token_12345"
# {"message":"Token inválido"}
```

### ✅ Resultado v0.6.0

- ✅ Middleware JWT funcional
- ✅ Todas las rutas de users protegidas
- ✅ Endpoint `GET /api/users/me`
- ✅ Extensión de tipos Express para `req.user`
- ✅ Validación de formato Bearer token
- ✅ Manejo de errores de autenticación

**Archivos creados/modificados:**
- `src/middleware/auth.ts` - Middleware JWT (nuevo)
- `src/modules/users/users.controller.ts` - Añadido `meCtrl`
- `src/modules/users/users.routes.ts` - Rutas protegidas

**Rutas protegidas (requieren JWT):**
- `GET /api/users` - Listar usuarios
- `GET /api/users/me` - Perfil autenticado
- `GET /api/users/:id` - Usuario por ID
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

**Rutas públicas:**
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /health` - Health check

**Flujo de uso:**
1. Usuario hace login → recibe JWT
2. Cliente guarda JWT en localStorage/cookie
3. Cliente incluye JWT en header: `Authorization: Bearer <token>`
4. Middleware valida JWT
5. Si válido, añade `req.user` y permite acceso
6. Controller accede a `req.user.sub` y `req.user.email`

---

## v0.7.0 - Mejoras en Users (actualizar perfil y cambiar contraseña)

**Objetivo:** Añadir endpoints para que un usuario autenticado pueda actualizar su propio perfil y cambiar su contraseña de forma segura.

### Paso 1: Añadir nuevos schemas de validación

Editar `src/modules/users/users.schema.ts` y añadir:

```typescript
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

**Schemas añadidos:**
- `updateProfileSchema` - Para actualizar name/email del perfil propio
- `changePasswordSchema` - Para cambiar contraseña (requiere contraseña actual)

**Diferencia con updateUserSchema:**
- `updateProfileSchema` - Usuario actualiza SU propio perfil (usa ID del token)
- `updateUserSchema` - Admin actualiza cualquier usuario (usa ID del parámetro)

### Paso 2: Añadir funciones al service

Editar `src/modules/users/users.service.ts` y añadir imports y funciones:

```typescript
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

export async function updateProfile(userId: number, data: { name?: string; email?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, createdAt: true }
  });
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Contraseña actual incorrecta');
  }
  
  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });
  
  return { message: 'Contraseña actualizada correctamente' };
}
```

**Función updateProfile:**
- Actualiza name y/o email del usuario por ID
- Usa ID extraído del JWT (req.user.sub)
- Retorna usuario actualizado sin passwordHash

**Función changePassword:**
1. Busca usuario por ID
2. Valida contraseña actual con `bcrypt.compare()`
3. Si inválida, lanza error (retorna 400)
4. Si válida, hashea nueva contraseña con bcrypt
5. Actualiza passwordHash en base de datos
6. Retorna mensaje de éxito

**Seguridad:**
- Usuario no puede cambiar contraseña sin conocer la actual
- Previene que alguien con sesión robada cambie la contraseña
- Nueva contraseña también hasheada con bcrypt

### Paso 3: Añadir controllers

Editar `src/modules/users/users.controller.ts` y añadir:

```typescript
import { updateProfile, changePassword } from './users.service.js';

export async function updateProfileCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const user = await updateProfile(req.user.sub, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }
    res.status(500).json({ message: error.message });
  }
}

export async function changePasswordCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const { currentPassword, newPassword } = req.body;
    const result = await changePassword(req.user.sub, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}
```

**updateProfileCtrl:**
- Lee user ID desde `req.user.sub` (inyectado por middleware auth)
- No necesita ID en parámetros (usa ID del token)
- Maneja error de email duplicado (P2002)

**changePasswordCtrl:**
- Lee user ID desde `req.user.sub`
- Extrae currentPassword y newPassword del body
- Maneja error de contraseña incorrecta con 400

### Paso 4: Añadir rutas

Editar `src/modules/users/users.routes.ts`:

```typescript
import { updateProfileSchema, changePasswordSchema } from './users.schema.js';
import { updateProfileCtrl, changePasswordCtrl } from './users.controller.js';

router.patch('/me', auth, validate(updateProfileSchema), updateProfileCtrl);
router.patch('/me/password', auth, validate(changePasswordSchema), changePasswordCtrl);
```

**Orden de rutas importante:**
```typescript
router.get('/me', auth, meCtrl);
router.patch('/me', auth, validate(updateProfileSchema), updateProfileCtrl);
router.patch('/me/password', auth, validate(changePasswordSchema), changePasswordCtrl);
router.get('/:id', auth, getUserCtrl);
```

**Por qué este orden:**
- Rutas específicas (`/me`, `/me/password`) ANTES de rutas dinámicas (`/:id`)
- Si `/:id` va primero, Express matchearía `/me` como ID = "me"
- Rutas más específicas siempre primero

### Paso 5: Compilar y verificar

```bash
npm run build
```

**Debe compilar sin errores.**

### Paso 6: Probar actualización de perfil

```bash
npm start

# Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Actualizar perfil
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Updated Name"}'
```

**Respuesta esperada (200):**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Updated Name",
  "createdAt": "2025-11-04T11:34:54.797Z"
}
```

### Paso 7: Probar cambio de contraseña

```bash
curl -X PATCH http://localhost:3000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currentPassword":"password123","newPassword":"newpassword456"}'
```

**Respuesta esperada (200):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

### Paso 8: Verificar nueva contraseña funciona

```bash
# Login con nueva contraseña
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"newpassword456"}'
```

**Debe retornar token correctamente.**

### Paso 9: Probar caso de error - contraseña incorrecta

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"newpassword456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X PATCH http://localhost:3000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currentPassword":"wrongpassword","newPassword":"another123"}'
```

**Respuesta esperada (400):**
```json
{
  "message": "Contraseña actual incorrecta"
}
```

### ✅ Resultado v0.7.0

- ✅ Endpoint para actualizar perfil propio
- ✅ Endpoint para cambiar contraseña
- ✅ Validación de contraseña actual con bcrypt
- ✅ Schemas Zod con validaciones
- ✅ Usuario solo modifica su propio perfil
- ✅ Manejo de errores (email duplicado, contraseña incorrecta)
- ✅ Nueva contraseña hasheada correctamente

**Archivos modificados:**
- `src/modules/users/users.schema.ts` - Añadidos 2 schemas
- `src/modules/users/users.service.ts` - Añadidas 2 funciones
- `src/modules/users/users.controller.ts` - Añadidos 2 controllers
- `src/modules/users/users.routes.ts` - Añadidas 2 rutas

**Rutas añadidas:**
- `PATCH /api/users/me` - Actualizar perfil (requiere JWT)
- `PATCH /api/users/me/password` - Cambiar contraseña (requiere JWT)

**Flujo de actualización de perfil:**
1. Usuario autenticado envía PATCH /api/users/me
2. Middleware auth valida JWT y añade req.user
3. Middleware validate valida body con updateProfileSchema
4. Controller lee user ID desde req.user.sub
5. Service actualiza usuario por ID
6. Retorna usuario actualizado

**Flujo de cambio de contraseña:**
1. Usuario envía currentPassword y newPassword
2. Middleware auth valida JWT
3. Middleware validate valida schema
4. Controller extrae req.user.sub
5. Service busca usuario y valida contraseña actual
6. Si válida, hashea nueva contraseña y actualiza
7. Retorna mensaje de éxito

**Seguridad mejorada:**
- Usuario no puede modificar otros perfiles (usa ID del token)
- Cambio de contraseña requiere conocer contraseña actual
- Protección contra sesiones robadas
- Email único validado por Prisma
- Todas las contraseñas hasheadas con bcrypt

---

## v0.8.0 - Seguridad adicional (rate limiting y logging)

**Objetivo:** Mejorar la seguridad de la API implementando rate limiting para prevenir abuso y un sistema de logging profesional con Winston.

### Paso 1: Instalar dependencias

```bash
npm install express-rate-limit winston
```

**Dependencias:**
- `express-rate-limit` - Middleware para limitar peticiones por IP
- `winston` - Sistema de logging profesional con niveles y transportes

### Paso 2: Crear logger con Winston

Crear `src/utils/logger.ts`:

```typescript
import winston from 'winston';
import { env } from '../config/env.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
});
```

**Configuración del logger:**
- **Niveles**: error (0), warn (1), info (2), http (3), debug (4)
- **Colores**: error rojo, warn amarillo, info verde, http magenta, debug azul
- **Formato**: timestamp + nivel + mensaje
- **Transports**:
  - Console: todos los logs con colores
  - logs/error.log: solo errores
  - logs/all.log: todos los logs
- **Nivel por entorno**:
  - Development: debug (todos)
  - Production: warn (solo advertencias y errores)

### Paso 3: Crear middleware de logging de requests

Crear `src/middleware/requestLogger.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
}
```

**Qué hace:**
1. Registra tiempo de inicio de la petición
2. Escucha evento 'finish' de la respuesta
3. Calcula duración de la petición
4. Registra log con nivel según código HTTP:
   - 500+: error (rojo)
   - 400-499: warn (amarillo)
   - 200-399: http (magenta)

### Paso 4: Crear rate limiters

Crear `src/middleware/rateLimiter.ts`:

```typescript
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
```

**generalLimiter:**
- Ventana: 15 minutos
- Máximo: 100 peticiones
- Aplica a toda la API
- Headers estándar (RateLimit-*)

**authLimiter:**
- Ventana: 15 minutos
- Máximo: 5 peticiones
- `skipSuccessfulRequests: true` - Solo cuenta intentos fallidos
- Protege contra brute force en login/registro
- Aplica solo a rutas de auth

**Headers de respuesta:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1604424000
```

### Paso 5: Actualizar app.ts

Editar `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(generalLimiter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);

app.use(errorHandler);

export default app;
```

**Cambios:**
- Eliminado morgan (reemplazado por requestLogger personalizado)
- Añadido `express.json({ limit: '10mb' })` - Límite de payload
- Añadido requestLogger para logging
- Añadido generalLimiter para toda la API
- Añadido authLimiter específico para rutas de auth

**Orden de middlewares importante:**
1. helmet (seguridad)
2. cors
3. json parser con límite
4. requestLogger (antes de limiters para registrar todo)
5. generalLimiter
6. Rutas con limiters específicos
7. errorHandler (último)

### Paso 6: Actualizar index.ts con logger

Editar `src/index.ts`:

```typescript
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API escuchando en http://localhost:${env.PORT}`);
  logger.info(`Entorno: ${env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});
```

**Mejoras:**
- Logs en startup con info de puerto y entorno
- Logs en graceful shutdown (SIGTERM/SIGINT)
- Más verbosidad en proceso de cierre

### Paso 7: Actualizar error handler

Editar `src/middleware/error.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);
  logger.error(err.stack);
  
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error interno' });
}
```

**Mejoras:**
- Log de error con método y path
- Log de stack trace completo
- Útil para debugging

### Paso 8: Crear carpeta de logs y actualizar .gitignore

```bash
mkdir -p logs
```

Añadir a `.gitignore`:

```
logs/
```

**Por qué ignorar logs:**
- Archivos pueden ser grandes
- Contienen información sensible
- Se regeneran en cada entorno

### Paso 9: Compilar y verificar

```bash
npm run build
```

**Debe compilar sin errores.**

### Paso 10: Probar logging

```bash
npm start
```

**Logs en consola:**
```
2025-11-04 13:27:55 info: API escuchando en http://localhost:3000
2025-11-04 13:27:55 info: Entorno: development
```

**Probar endpoint:**
```bash
curl http://localhost:3000/health
```

**Log esperado:**
```
2025-11-04 13:28:01 http: GET /health 200 2ms
```

### Paso 11: Probar rate limiting general

```bash
# Hacer muchas peticiones rápidas
for i in {1..105}; do
  curl -s http://localhost:3000/health > /dev/null
  echo "Request $i"
done
```

**Resultado esperado:**
- Primeras 100: funcionan (200)
- Siguientes: bloqueadas (429)

**Respuesta al exceder límite:**
```json
{
  "message": "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos"
}
```

### Paso 12: Probar rate limiting de auth

```bash
# Intentar login 7 veces con credenciales incorrectas
for i in {1..7}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@test.com","password":"wrongpass123"}'
  echo "\nIntento $i"
done
```

**Resultado esperado:**
- Primeros 5 intentos: error de validación o credenciales
- Siguientes: rate limit (429)

**Respuesta:**
```json
{
  "message": "Demasiados intentos de autenticación, intenta de nuevo en 15 minutos"
}
```

**Logs generados:**
```
2025-11-04 13:29:15 warn: POST /login 400 1ms
2025-11-04 13:29:15 warn: POST /login 400 1ms
2025-11-04 13:29:15 warn: POST /login 400 1ms
2025-11-04 13:29:15 warn: POST /login 400 1ms
2025-11-04 13:29:15 warn: POST /login 400 1ms
2025-11-04 13:29:15 warn: POST /login 429 1ms
2025-11-04 13:29:15 warn: POST /login 429 1ms
```

### Paso 13: Verificar archivos de log

```bash
# Ver últimos logs
tail -10 logs/all.log

# Ver solo errores
tail -10 logs/error.log

# Ver logs en tiempo real
tail -f logs/all.log
```

**Contenido ejemplo de logs/all.log:**
```
2025-11-04 13:27:55 info: API escuchando en http://localhost:3000
2025-11-04 13:27:55 info: Entorno: development
2025-11-04 13:28:01 http: GET /health 200 2ms
2025-11-04 13:29:15 warn: POST /login 401 45ms
2025-11-04 13:29:20 http: GET /api/users 200 12ms
```

### ✅ Resultado v0.8.0

- ✅ Rate limiting global (100/15min)
- ✅ Rate limiting auth (5/15min, solo fallos)
- ✅ Logger Winston con 5 niveles
- ✅ Logs en archivos (all.log, error.log)
- ✅ Logs en consola con colores
- ✅ Middleware de logging de requests
- ✅ Headers de rate limit en respuestas
- ✅ Límite de payload JSON (10mb)
- ✅ Graceful shutdown con logs
- ✅ Protección contra brute force

**Archivos creados:**
- `src/utils/logger.ts` - Configuración Winston
- `src/middleware/rateLimiter.ts` - Rate limiters (2)
- `src/middleware/requestLogger.ts` - Logger de requests
- `logs/` - Carpeta de archivos de log

**Archivos modificados:**
- `src/app.ts` - Integración de middlewares
- `src/index.ts` - Logger en startup/shutdown
- `src/middleware/error.ts` - Logs de errores
- `.gitignore` - Añadida logs/

**Seguridad mejorada:**
- Protección contra brute force en auth (max 5 intentos)
- Rate limiting por IP en toda la API
- Logs de todas las peticiones para auditoría
- Logs de errores con stack trace para debugging
- Límite de tamaño de payload (previene DoS)
- Headers estándar de rate limit

**Beneficios del logging:**
- Auditoría de accesos
- Debugging de errores
- Monitoreo de performance (duración de requests)
- Detección de patrones de abuso
- Logs persistentes en archivos

**Rate limiting efectivo:**
- Previene brute force attacks
- Protege recursos de la API
- Distribuye carga equitativamente
- Headers informativos para clientes

---

## v0.9.0 - Testing con Jest y Supertest

**Objetivo:** Implementar un sistema de testing completo con Jest y Supertest para validar el comportamiento de todos los endpoints de la API.

### Paso 1: Instalar dependencias de testing

```bash
npm install -D jest ts-jest @types/jest supertest @types/supertest
```

**Dependencias:**
- `jest` - Framework de testing de JavaScript
- `ts-jest` - Preset de Jest para TypeScript
- `@types/jest` - Tipos TypeScript para Jest
- `supertest` - Librería para testing HTTP
- `@types/supertest` - Tipos TypeScript para Supertest

### Paso 2: Configurar Jest

Crear `jest.config.js`:

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
```

**Configuración:**
- **preset**: `ts-jest/presets/default-esm` - Soporte para ES modules
- **testEnvironment**: `node` - Entorno Node.js
- **extensionsToTreatAsEsm**: `['.ts']` - Archivos .ts como ES modules
- **moduleNameMapper**: Mapea imports `.js` a archivos `.ts`
- **transform**: Configura ts-jest con ESM habilitado
- **roots**: Buscar tests en `src/`
- **testMatch**: Patrones de archivos de test
- **collectCoverageFrom**: Archivos para cobertura
- **coverageDirectory**: Carpeta de reportes de cobertura

### Paso 3: Crear tests de autenticación

Crear `src/tests/auth.test.ts`:

```typescript
import request from 'supertest';
import app from '../app';

describe('Auth Endpoints', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('debe fallar con email duplicado', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email ya registrado');
    });

    it('debe fallar con email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
    });

    it('debe fallar con contraseña corta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'new@example.com', password: '123' });

      expect(res.status).toBe(400);
    });

    it('debe fallar con nombre corto', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'new@example.com', name: 'A' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginUser = {
      email: `login${Date.now()}@example.com`,
      name: 'Login User',
      password: 'password123',
    };

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send(loginUser);
    });

    it('debe hacer login correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginUser.email, password: loginUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(loginUser.email);
    });

    it('debe fallar con contraseña incorrecta', async () => {
      const failUser = {
        email: `fail${Date.now()}@example.com`,
        name: 'Fail User',
        password: 'correctpass123',
      };
      await request(app).post('/api/auth/register').send(failUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: failUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('debe fallar con email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `noexiste${Date.now()}@example.com`, password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });
  });
});
```

**Tests de Auth:**
- **Registro exitoso**: Verifica que se crea usuario y se retorna token
- **Email duplicado**: Verifica error 409 al registrar email existente
- **Validación**: Verifica errores 400 con datos inválidos
- **Login exitoso**: Verifica que se puede hacer login con credenciales correctas
- **Login fallido**: Verifica errores con contraseña incorrecta o email inexistente

**Buenas prácticas:**
- Usuarios únicos con `Date.now()` para evitar conflictos
- Assertions específicas con `expect()`
- Verificar status codes HTTP correctos
- Verificar estructura de respuestas
- No exponer datos sensibles (passwordHash)

### Paso 4: Crear tests de usuarios

Crear `src/tests/users.test.ts`:

```typescript
import request from 'supertest';
import app from '../app';

describe('Users Endpoints', () => {
  let authToken: string;
  let userId: number;
  
  const testUser = {
    email: `testuser${Date.now()}@example.com`,
    name: 'Test User',
    password: 'password123',
  };

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  describe('GET /api/users', () => {
    it('debe listar usuarios con autenticación', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('No autorizado');
    });

    it('debe fallar con token inválido', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token inválido');
    });
  });

  describe('GET /api/users/me', () => {
    it('debe obtener perfil del usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('debe actualizar perfil propio', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(401);
    });

    it('debe fallar con email inválido', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/users/me/password', () => {
    it('debe cambiar contraseña correctamente', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          currentPassword: 'password123', 
          newPassword: 'newpassword456' 
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Contraseña actualizada correctamente');

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'newpassword456' });

      expect(loginRes.status).toBe(200);
    });

    it('debe fallar con contraseña actual incorrecta', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          currentPassword: 'wrongpassword', 
          newPassword: 'newpassword789' 
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Contraseña actual incorrecta');
    });

    it('debe fallar sin autenticación', async () => {
      const res = await request(app)
        .patch('/api/users/me/password')
        .send({ 
          currentPassword: 'password123', 
          newPassword: 'newpassword456' 
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('debe obtener usuario por ID', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
    });

    it('debe fallar con ID inexistente', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
```

**Tests de Users:**
- **Autenticación requerida**: Verifica que endpoints están protegidos
- **Perfil autenticado**: Verifica GET /me con JWT
- **Actualizar perfil**: Verifica PATCH /me
- **Cambiar contraseña**: Verifica validación y cambio exitoso
- **Obtener por ID**: Verifica GET /:id
- **Errores**: Verifica respuestas con IDs inexistentes, tokens inválidos, etc.

**Setup con `beforeAll`:**
- Crea usuario de prueba antes de ejecutar tests
- Guarda token y userId para usar en tests
- Evita repetir código de registro en cada test

### Paso 5: Deshabilitar rate limiting en tests

Actualizar `src/app.ts` para deshabilitar rate limiting en entorno de test:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

if (env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

if (env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}

app.use('/api/users', usersRoutes);

app.use(errorHandler);

export default app;
```

**Cambios:**
- Importar `env` de config
- Condicional `if (env.NODE_ENV !== 'test')` para rate limiters
- Permite ejecutar tests sin límite de peticiones
- No afecta funcionamiento en desarrollo/producción

### Paso 6: Configurar scripts de test

Actualizar `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc -p .",
    "start": "node dist/index.js",
    "test": "NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --watch",
    "test:coverage": "NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --coverage"
  }
}
```

**Scripts:**
- **test**: Ejecutar todos los tests una vez
- **test:watch**: Ejecutar tests en modo watch (re-ejecuta al cambiar archivos)
- **test:coverage**: Ejecutar tests y generar reporte de cobertura

**Variables:**
- `NODE_ENV=test` - Configura entorno como test
- `NODE_OPTIONS=--experimental-vm-modules` - Habilita soporte experimental para ES modules en Jest

### Paso 7: Actualizar .gitignore

Actualizar `.gitignore`:

```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
.vscode/
.idea/
*.swp
*.swo
.env.test
.env.production
logs/
*.tsbuildinfo
```

**Añadido:**
- `*.tsbuildinfo` - Archivos de información de compilación de TypeScript

### Paso 8: Ejecutar tests

```bash
npm test
```

**Salida esperada:**

```
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        1.3 s
Ran all test suites.
```

**Tests ejecutados:**
- 8 tests de Auth (registro y login)
- 13 tests de Users (CRUD y autenticación)
- Total: 21 tests pasados

### Paso 9: Ver cobertura de código

```bash
npm run test:coverage
```

**Qué hace:**
- Ejecuta todos los tests
- Analiza qué líneas de código fueron ejecutadas
- Genera reporte en `coverage/`
- Muestra tabla con porcentajes de cobertura

**Abrir reporte HTML:**

```bash
open coverage/lcov-report/index.html
```

**Métricas de cobertura:**
- **Statements**: Porcentaje de sentencias ejecutadas
- **Branches**: Porcentaje de ramas if/else ejecutadas
- **Functions**: Porcentaje de funciones llamadas
- **Lines**: Porcentaje de líneas ejecutadas

### Paso 10: Tests en modo watch

```bash
npm run test:watch
```

**Qué hace:**
- Ejecuta tests inicialmente
- Observa cambios en archivos
- Re-ejecuta tests automáticamente al guardar
- Modo interactivo con opciones (filtrar, re-run, etc)

**Útil para:**
- Desarrollo con TDD (Test Driven Development)
- Debugging de tests
- Desarrollo iterativo

### Resumen v0.9.0

**Tests implementados: 21**

#### Auth Tests (8)
- ✓ Registro exitoso
- ✓ Email duplicado
- ✓ Email inválido
- ✓ Contraseña corta
- ✓ Nombre corto
- ✓ Login exitoso
- ✓ Contraseña incorrecta
- ✓ Email inexistente

#### Users Tests (13)
- ✓ Listar con auth
- ✓ Listar sin auth
- ✓ Token inválido
- ✓ Perfil autenticado
- ✓ Perfil sin auth
- ✓ Actualizar perfil
- ✓ Actualizar sin auth
- ✓ Email inválido en update
- ✓ Cambiar contraseña
- ✓ Cambiar con contraseña incorrecta
- ✓ Cambiar sin auth
- ✓ Obtener por ID
- ✓ ID inexistente

**Archivos creados:**
- `jest.config.js` - Configuración Jest
- `src/tests/auth.test.ts` - Tests de autenticación
- `src/tests/users.test.ts` - Tests de usuarios

**Archivos modificados:**
- `src/app.ts` - Deshabilitar rate limiting en tests
- `package.json` - Scripts de testing
- `.gitignore` - Añadido *.tsbuildinfo

**Comandos útiles:**
```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Tests en modo watch
npm run test:coverage # Tests con cobertura
```

**Beneficios del testing:**
- Validación automatizada de funcionalidad
- Detección temprana de bugs
- Refactoring seguro
- Documentación viva del comportamiento
- Confianza en deployments
- Cobertura de código medible

---

## v1.0.0 - Producción y documentación

**Objetivo:** Preparar la API para producción con documentación OpenAPI/Swagger, Docker optimizado y configuración para deployment.

### Paso 1: Instalar dependencias de Swagger

```bash
npm install swagger-ui-express swagger-jsdoc @types/swagger-ui-express
npm install -D @types/swagger-jsdoc
```

**Dependencias:**
- `swagger-ui-express` - Interfaz Swagger UI para Express
- `swagger-jsdoc` - Generación de especificación OpenAPI desde JSDoc
- `@types/swagger-ui-express` - Tipos TypeScript
- `@types/swagger-jsdoc` - Tipos TypeScript

### Paso 2: Configurar OpenAPI/Swagger

Crear `src/config/swagger.ts`:

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Express + PostgreSQL',
      version: '1.0.0',
      description: 'API REST con autenticación JWT, validación Zod, rate limiting y testing completo',
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
            id: { type: 'integer', description: 'ID del usuario' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 2 },
            password: { type: 'string', minLength: 8 },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string', description: 'JWT token' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticación' },
      { name: 'Users', description: 'Gestión de usuarios' },
    ],
  },
  apis: ['./src/modules/*/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

**Configuración:**
- **OpenAPI 3.0.0**: Especificación estándar
- **Schemas**: Definiciones de tipos reutilizables
- **Security**: JWT Bearer token
- **Tags**: Organización de endpoints
- **Servers**: URL del servidor

### Paso 3: Integrar Swagger UI en Express

Actualizar `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/error.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

if (env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

if (env.NODE_ENV !== 'test') {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}

app.use('/api/users', usersRoutes);

app.use(errorHandler);

export default app;
```

**Cambios:**
- Importar `swaggerUi` y `swaggerSpec`
- Deshabilitar CSP de Helmet para Swagger UI
- Montar Swagger UI en `/api-docs`

### Paso 4: Crear Dockerfile optimizado

Crear `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN mkdir -p logs && chown -R node:node /app

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "dist/index.js"]
```

**Multi-stage build:**
- **Stage 1 (builder)**:
  - Instala todas las dependencias (dev + prod)
  - Genera Prisma client
  - Compila TypeScript
- **Stage 2 (production)**:
  - Imagen limpia con solo dependencias de producción
  - Copia solo archivos compilados
  - Usuario `node` (no-root)
  - `dumb-init` para manejo correcto de señales

**Optimizaciones:**
- Imagen base: `node:20-alpine` (pequeña)
- Solo dependencias de producción
- Multi-stage reduce tamaño final
- Usuario no-root para seguridad
- Carpeta `logs/` creada con permisos correctos

### Paso 5: Crear .dockerignore

Crear `.dockerignore`:

```
node_modules
dist
coverage
logs
*.log
.env
.env.test
.env.production
.git
.gitignore
README.md
.DS_Store
*.md
.vscode
.idea
```

**Qué hace:**
- Excluye archivos innecesarios del build
- Reduce tamaño del contexto Docker
- Acelera builds
- Evita copiar secretos

### Paso 6: Crear Docker Compose para producción

Crear `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-app_db}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/${POSTGRES_DB:-app_db}
      JWT_SECRET: ${JWT_SECRET}
      BCRYPT_SALT_ROUNDS: ${BCRYPT_SALT_ROUNDS:-10}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

volumes:
  pgdata:

networks:
  app-network:
    driver: bridge
```

**Características:**
- **Health checks**: Espera a que PostgreSQL esté listo
- **Depends on**: API inicia después de la BD
- **Restart policy**: Reinicia automáticamente en fallos
- **Network privada**: Comunicación segura entre servicios
- **Volúmenes**: Persistencia de datos
- **Variables de entorno**: Configuración externa

### Paso 7: Crear archivo de ejemplo para variables de entorno

Crear `env.production.example`:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://postgres:postgres@db:5432/app_db
BCRYPT_SALT_ROUNDS=10

POSTGRES_PASSWORD=postgres
POSTGRES_DB=app_db
```

**Uso:**
```bash
cp env.production.example .env.production
nano .env.production
```

### Paso 8: Probar Swagger localmente

```bash
npm run build
npm start
```

Abrir navegador en: `http://localhost:3000/api-docs`

**Qué verás:**
- Interfaz interactiva de Swagger UI
- Lista de todos los endpoints
- Schemas de request/response
- Posibilidad de probar endpoints desde el navegador
- Autenticación JWT integrada

### Paso 9: Construir imagen Docker

```bash
docker build -t api-express:1.0.0 .
```

**Qué hace:**
- Ejecuta multi-stage build
- Instala dependencias
- Compila TypeScript
- Genera Prisma client
- Crea imagen optimizada

**Ver tamaño:**
```bash
docker images api-express:1.0.0
```

### Paso 10: Deployment con Docker Compose

**Crear archivo .env.production:**
```bash
cp env.production.example .env.production
nano .env.production
```

**Configurar JWT_SECRET:**
```bash
export JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env.production
```

**Iniciar servicios:**
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Ver logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f api
```

**Ejecutar migraciones:**
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

**Verificar salud:**
```bash
curl http://localhost:3000/health
```

### Paso 11: Comandos de gestión Docker

**Ver contenedores:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

**Parar servicios:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Parar y eliminar volúmenes:**
```bash
docker-compose -f docker-compose.prod.yml down -v
```

**Reiniciar API:**
```bash
docker-compose -f docker-compose.prod.yml restart api
```

**Ver logs en tiempo real:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Ejecutar comando en contenedor:**
```bash
docker-compose -f docker-compose.prod.yml exec api sh
```

### Resumen v1.0.0

**Documentación Swagger:**
- ✓ OpenAPI 3.0.0 completo
- ✓ UI interactiva en `/api-docs`
- ✓ Todos los endpoints documentados
- ✓ Schemas reutilizables
- ✓ Autenticación JWT configurada

**Docker:**
- ✓ Dockerfile multi-stage optimizado
- ✓ Imagen base Alpine (ligera)
- ✓ Usuario no-root
- ✓ dumb-init para señales
- ✓ .dockerignore configurado

**Docker Compose:**
- ✓ PostgreSQL 16 con health checks
- ✓ API con restart automático
- ✓ Network privada
- ✓ Volúmenes persistentes
- ✓ Variables de entorno

**Archivos creados:**
- `src/config/swagger.ts` - Configuración OpenAPI
- `Dockerfile` - Imagen Docker
- `.dockerignore` - Exclusiones build
- `docker-compose.prod.yml` - Orquestación
- `env.production.example` - Variables ejemplo

**Archivos modificados:**
- `src/app.ts` - Integración Swagger UI
- `package.json` - Dependencias Swagger

**Endpoints nuevos:**
- `GET /api-docs` - Documentación Swagger UI

**Comandos de deployment:**
```bash
docker build -t api-express:1.0.0 .
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

**URLs importantes:**
- Health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`
- API base: `http://localhost:3000/api`

**Lista de comprobación para producción:**
- ✓ JWT_SECRET seguro y único
- ✓ Variables de entorno configuradas
- ✓ Migraciones ejecutadas
- ✓ Health checks funcionando
- ✓ Logs monitorizados
- ✓ Backups de base de datos configurados
- ✓ HTTPS configurado (reverse proxy)
- ✓ Límites de rate limiting ajustados
- ✓ Monitoreo configurado

---

## 📊 Estado actual del proyecto

### Estructura completa

```
node-server/
├── prisma/
│   ├── migrations/           # Migraciones SQL versionadas
│   └── schema.prisma         # Schema de base de datos
├── src/
│   ├── config/
│   │   ├── db.ts            # Cliente Prisma
│   │   ├── env.ts           # Variables de entorno
│   │   └── swagger.ts       # Configuración OpenAPI
│   ├── middleware/
│   │   ├── auth.ts          # Verificación JWT
│   │   ├── error.ts         # Manejo de errores
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   ├── requestLogger.ts # Logger de requests
│   │   └── validate.ts      # Validación Zod
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   └── users/
│   │       ├── users.controller.ts
│   │       ├── users.routes.ts
│   │       ├── users.schema.ts
│   │       └── users.service.ts
│   ├── tests/
│   │   ├── auth.test.ts     # Tests de autenticación
│   │   └── users.test.ts    # Tests de usuarios
│   ├── utils/
│   │   └── logger.ts        # Winston logger
│   ├── app.ts               # Configuración Express
│   └── index.ts             # Servidor
├── docs/
│   └── API_EXAMPLES.md      # Ejemplos de uso
├── logs/                    # Archivos de log
│   ├── all.log             # Todos los logs
│   └── error.log           # Solo errores
├── coverage/                # Reportes de cobertura
├── Dockerfile               # Imagen Docker optimizada
├── .dockerignore            # Exclusiones Docker
├── docker-compose.yml       # PostgreSQL desarrollo
├── docker-compose.prod.yml  # Deployment producción
├── jest.config.js           # Configuración Jest
├── package.json
├── tsconfig.json
├── .env.example
├── env.production.example   # Variables producción
├── .gitignore
├── CHANGELOG.md
└── README.md
```

### Tecnologías implementadas

✅ **Backend**
- Express con TypeScript
- ES Modules (import/export)
- Graceful shutdown

✅ **Base de datos**
- PostgreSQL 16 en Docker
- Prisma ORM
- Migraciones versionadas

✅ **Autenticación**
- JWT (7 días de expiración)
- bcrypt para passwords
- Middleware de protección

✅ **Validación**
- Zod schemas
- Mensajes en español
- Types TypeScript generados

✅ **Seguridad**
- Helmet (headers HTTP)
- CORS configurado
- Rate limiting (express-rate-limit)
- Winston logger profesional
- Passwords hasheadas
- Mensajes genéricos de error

✅ **Testing**
- Jest + Supertest
- 21 tests de integración
- Tests de Auth y Users
- Coverage reports

✅ **Documentación**
- OpenAPI 3.0.0 completo
- Swagger UI interactiva (/api-docs)
- Schemas documentados
- Ejemplos de uso

✅ **Deployment**
- Dockerfile multi-stage
- Docker Compose producción
- Health checks
- Restart automático

✅ **DX (Developer Experience)**
- Hot reload con nodemon
- Type-safety completo
- Código modular
- Logs con morgan

### Endpoints API

**Públicos:**
- `GET /health` - Health check
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login

**Protegidos (requieren JWT):**
- `GET /api/users` - Listar usuarios
- `GET /api/users/me` - Perfil autenticado
- `PATCH /api/users/me` - Actualizar perfil propio
- `PATCH /api/users/me/password` - Cambiar contraseña
- `GET /api/users/:id` - Usuario por ID
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

**Documentación:**
- `GET /api-docs` - Swagger UI interactiva

### Proyecto completado

✅ **v1.0.0 - API REST completa y lista para producción**

El proyecto ha alcanzado su versión 1.0.0 con todas las funcionalidades implementadas:
- API REST completa con autenticación JWT
- Base de datos PostgreSQL con Prisma ORM
- Validación de datos con Zod
- Rate limiting y logging profesional
- Testing completo con Jest
- Documentación OpenAPI/Swagger
- Docker y Docker Compose listos para deployment

---

## v1.0.1 - Fix: Documentación Swagger completa

**Objetivo:** Corregir la documentación OpenAPI/Swagger para que todos los endpoints aparezcan correctamente en Swagger UI.

### Problema detectado

La documentación Swagger no mostraba ningún endpoint en `/api-docs` debido a dos problemas:

1. Las rutas no tenían anotaciones JSDoc `@swagger`
2. La configuración de `swagger.ts` buscaba archivos `.ts` en lugar de `.js` compilados

### Cambios realizados

#### 1. Anotaciones JSDoc en `src/modules/auth/auth.routes.ts`

```typescript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', validate(registerSchema), registerCtrl);
```

Documentados: `POST /api/auth/register` y `POST /api/auth/login`

#### 2. Anotaciones JSDoc en `src/modules/users/users.routes.ts`

Documentados todos los endpoints de usuarios:
- `GET /api/users` - Listar usuarios
- `GET /api/users/me` - Perfil propio
- `PATCH /api/users/me` - Actualizar perfil
- `PATCH /api/users/me/password` - Cambiar contraseña
- `GET /api/users/{id}` - Obtener usuario
- `PATCH /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario

#### 3. Fix en `src/config/swagger.ts`

```typescript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options: swaggerJsdoc.Options = {
  definition: { /* ... */ },
  apis: [join(__dirname, '../modules/**/*.routes.js')],
};
```

Cambio clave: usar rutas absolutas con `join(__dirname, ...)` apuntando a archivos `.js` compilados.

### Verificación

```bash
curl http://localhost:3000/api-docs
```

Ahora Swagger UI muestra correctamente:
- 2 endpoints de Auth
- 7 endpoints de Users
- Documentación completa con request/response schemas
- Botón "Authorize" para probar endpoints protegidos

### Reconstruir y desplegar

```bash
npm run build
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml up -d api
```

### Resumen

✅ **Swagger UI completamente funcional**
- Todos los endpoints documentados
- Schemas reutilizables definidos
- Security schemes (JWT) configurados
- Listo para probar la API desde el navegador

---

## v1.0.2 - Fix: tsx para ES Modules en desarrollo

**Objetivo:** Solucionar el error de `ts-node` al ejecutar `npm run dev` con ES Modules e imports con extensión `.js`.

### Problema detectado

Al ejecutar `npm run dev`, `ts-node` fallaba con:

```
Error: Cannot find module '/path/to/src/app.js' imported from /path/to/src/index.ts
```

**Causa:** `ts-node` tiene soporte limitado para ES Modules cuando se usan imports con extensión `.js` (que es el estándar correcto para TypeScript con `"type": "module"`).

### ¿Por qué usamos `.js` en imports TypeScript?

Cuando usas ES Modules (`"type": "module"` en `package.json`), TypeScript **requiere** que uses extensiones `.js` en los imports, incluso para archivos `.ts`:

```typescript
import { errorHandler } from './middleware/error.js';
```

**Razón:** TypeScript no reescribe rutas de importación durante la compilación. Si escribes `.ts`, funcionaría en desarrollo pero fallaría en producción porque Node.js buscaría archivos `.ts` en `dist/`.

**Documentación oficial:** [TypeScript Handbook - ES Modules with Node.js](https://www.typescriptlang.org/docs/handbook/esm-node.html)

> *"In TypeScript files, use `.js` extensions in imports"*

### Solución: Usar `tsx` en lugar de `ts-node`

`tsx` es un ejecutor TypeScript moderno que soporta ES Modules nativamente.

#### Cambios realizados

**1. Instalar `tsx`:**

```bash
npm install --save-dev tsx
```

**2. Actualizar `nodemon.json`:**

```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "tsx src/index.ts"
}
```

Cambio: `"exec": "ts-node src/index.ts"` → `"exec": "tsx src/index.ts"`

### Verificación

```bash
npm run dev
```

Ahora el servidor arranca correctamente sin errores:

```
info: API escuchando en http://localhost:3000
info: Entorno: development
```

### Comparación: ts-node vs tsx

| Característica | ts-node | tsx |
|----------------|---------|-----|
| ES Modules | ⚠️ Requiere configuración compleja | ✅ Soporte nativo |
| Imports `.js` | ❌ Falla sin config especial | ✅ Funciona out-of-the-box |
| Velocidad | Más lento | Más rápido (usa esbuild) |
| Configuración | Compleja para ESM | Mínima |

### Resumen

✅ **`npm run dev` funciona correctamente**
- `tsx` reemplaza a `ts-node` para mejor soporte de ES Modules
- Los imports `.js` son el estándar correcto para TypeScript + ES Modules
- No requiere configuración adicional
- Más rápido en desarrollo

---

## 🛠️ Comandos útiles

### Desarrollo

```bash
npm run dev              # Modo desarrollo con hot-reload
npm run build            # Compilar TypeScript
npm start                # Ejecutar producción

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura

# Base de datos
docker-compose up -d     # Iniciar PostgreSQL
docker-compose down      # Parar PostgreSQL
docker-compose logs -f   # Ver logs

# Prisma
npx prisma studio        # UI para ver/editar datos
npx prisma migrate dev   # Nueva migración
npx prisma generate      # Regenerar cliente
npx prisma db push       # Push sin migración (dev)
npx prisma db seed       # Ejecutar seeds

# Git
git tag                  # Ver versiones
git checkout v0.3.0      # Cambiar a versión
git diff v0.2.0 v0.3.0   # Ver cambios
```

### Testing

```bash
# Probar health
curl http://localhost:3000/health

# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","name":"User","password":"password123"}'

# Login y guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}' \
  | jq -r '.token')

# Usar token
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Notas importantes

### Seguridad

⚠️ **Antes de producción:**
- Cambiar `JWT_SECRET` por un valor seguro y largo
- Configurar CORS con dominio específico
- Añadir rate limiting
- Usar HTTPS
- Variables de entorno en sistema seguro (AWS Secrets Manager, etc)
- Backups automáticos de base de datos

### Performance

🚀 **Optimizaciones:**
- Connection pooling de Prisma (automático)
- Índices en columnas frecuentes (email ya tiene)
- Paginación en listados grandes
- Caching con Redis (futuro)
- CDN para archivos estáticos

### Base de datos

💾 **Gestión:**
- Migraciones siempre versionadas con Git
- Nunca editar migraciones ejecutadas
- Backups antes de cambios mayores
- Probar migraciones en staging primero

---

## 🤝 Contribuir

Este proyecto es educativo. Para añadir features:

1. Crear rama desde main
2. Implementar cambio
3. Hacer commit descriptivo
4. Pull request con explicación

---

## 📚 Recursos

- [Express Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev/)
- [JWT.io](https://jwt.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📄 Licencia

ISC - Proyecto educativo

---

**Creado con fines educativos - OPTATIVA 2025-26**
