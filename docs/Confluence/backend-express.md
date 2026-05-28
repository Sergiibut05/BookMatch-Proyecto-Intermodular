# Backend - Express

### Resumen

API **Express 5** \+ **TypeScript**, Prisma y Firebase Admin. Punto de entrada HTTP: `src/app.ts` (montaje de rutas y middleware). Detalle de cada prefijo `/api/...` en **Módulos y Funcionalidades** y contratos en **API y Endpoints** / `/api-docs`.

### Despliegue en producción (mayo 2026)

* **Principal:** **AWS EC2** (Ubuntu) + **Docker** (`BookMatch-Backend/Dockerfile`, `docker-compose`) + **Caddy** (TLS) + dominio `https://api.<dominio>`; PostgreSQL en **Supabase**. Guía operativa: página **Deployment y producción** (espacio PM).
* **CI:** `.github/workflows/deploy-ec2-backend.yml` — push a `main` con cambios en `BookMatch-Backend/**` → SSH al servidor → `git pull` \+ `docker compose build` \+ `up -d`.
* **Alternativa:** mismo backend desplegable en **Vercel** (`vercel.json`); ver **Deployment** para matices (p. ej. prefijo `/api` en el cliente).

### Montaje en `app.ts` (orden relevante)

1. **CORS** y **Helmet** (`contentSecurityPolicy: false` en Helmet; `crossOriginResourcePolicy` cross-origin).
2. **HPP** (`hpp()`).
3. `POST /api/payments/webhook` con `express.raw({ type: 'application/json' })` **antes** de `express.json()` (firma Stripe).
4. `express.json({ limit: '10mb' })`, `requestLogger`.
5. En entorno no test: `generalLimiter` global; `authLimiter` solo en `/api/auth`.
6. `GET /health` → `{ ok: true }`.
7. `/api-docs` — Swagger UI.
8. Routers bajo `/api`: `auth`, `users`, `catalog-books`, `payments`, `orders`, `forums`, `comments`, `playlists`, `trades`, `ai-chat`, `analytics` (contrastar `src/app.ts` en el repo).
9. `errorHandler` al final.

### Estructura de carpetas (`src/`)

<!\[CDATA\[src/ ├── app.ts, index.ts ├── config/ # env, db, swagger ├── middleware/ # auth, validate, rateLimiter, error, requestLogger, isAdmin ├── modules/ # dominio: auth, users, catalog-books, payments, orders, │ # forums, posts, comments, votes (montaje jerárquico, ver repo) ├── routes/ │ └── ai-chat.routes.ts ├── services/ # correo, etc. ├── utils/ # logger, firebaseAdmin, plantillas └── tests/ # Jest\]\]>

### Middleware (comportamiento real)

#### `auth` (`middleware/auth.ts`)

* Exige cabecera `Authorization: Bearer <firebase-id-token>`.
* Verifica con **Firebase Admin**, obtiene el usuario de Firebase y llama a `syncUserFromFirebase` (Prisma).
* Asigna `req.user` con `id`, `uid`, `email`, `role` (por defecto `USER`).
* Respuestas 401 con cuerpo `{ message: '...' }` si falla.

#### `validate(schema)` (`middleware/validate.ts`)

* Usa `schema.safeParse(req.body)` (Zod).
* Si falla: **400** con `{ message, errors: parsed.error.flatten() }`.
* Si el schema devuelve un objeto con clave `body`, reemplaza `req.body` con ese fragmento; si no, con `parsed.data` completo.

#### Rate limiting (`middleware/rateLimiter.ts`)

* `generalLimiter`: aplicado a toda la app salvo `NODE_ENV=test`.
* `authLimiter`: aplicado solo al prefijo `/api/auth` (login/registro masivo).

#### `errorHandler` (`middleware/error.ts`)

* Registra error con **Winston**.
* Responde `status` de `err.status` o **500**.
* Cuerpo JSON: `{ message: err.message || 'Error interno' }`.

#### `requestLogger`

* **Morgan** escribiendo en el stream de **Winston** (`http`).

### Logging (Winston)

Configuración en `utils/logger.ts`: niveles `error`, `warn`, `info`, `http`, `debug`; salida a consola y a `logs/*.log` según entorno.

### Validación de datos

Esquemas Zod en `*.schema.ts` por módulo; en rutas se combinan `auth` / `isAdmin` (donde exista) + `validate(schema)`.

### Prisma

Cliente en `config/db.ts` (export `prisma`). Migraciones y `schema.prisma` en `prisma/`.

### Documentación OpenAPI

Generada con **swagger-jsdoc** y servida en `/api-docs`; mantenerla al día al cambiar rutas.

---

**Actualización:** mayo 2026 — despliegue EC2/Docker/Caddy + CI; montaje de routers alineado a `app.ts` (incl. playlists, trades, analytics).