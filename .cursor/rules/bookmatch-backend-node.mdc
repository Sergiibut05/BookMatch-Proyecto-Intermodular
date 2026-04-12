---
description: BookMatch API Node — Express 5, Prisma, Zod, ESM, seguridad, clean code. Archivos bajo BookMatch-Backend o @bookmatch-backend-node.
globs: BookMatch-Backend/**/*.ts
alwaysApply: false
---

# BookMatch — backend Node (Express + TypeScript)

**Invocación:** aplica con archivos bajo `BookMatch-Backend/` o con **@bookmatch-backend-node**.

## Stack del repositorio (referencia)

| Área | Tecnología |
|------|------------|
| Runtime | Node.js, **ESM** (`"type": "module"`) |
| HTTP | **Express 5**, TypeScript |
| ORM / BD | **Prisma 6** + **PostgreSQL** |
| Validación | **Zod** (`*.schema.ts` + middleware `validate`) |
| Auth | **Firebase Admin** (Bearer en rutas protegidas) |
| Pagos | **Stripe** (Checkout + webhook raw) |
| Docs API | **swagger-jsdoc** + **swagger-ui-express** (`/api-docs`) |
| Seguridad transversal | **helmet**, **cors** (lista de orígenes), **hpp**, **express-rate-limit** |
| Logs | **Winston** + **morgan** (request logger) |
| Tests | **Jest** (`NODE_ENV=test`) |
| Email / util | **nodemailer**, **axios**, **cloudinary** (según feature) |

Imports internos: sufijo **`.js`** en rutas TypeScript compiladas a ESM (como en el código actual).

## Estructura modular

- Por dominio: `modules/<nombre>/` con **routes → controller → service**; esquemas Zod en **`*schema.ts`**.
- Montaje global en **`src/app.ts`**: orden crítico — **webhook Stripe** con `express.raw` **antes** de `express.json()`.
- Rutas sueltas puntuales en `src/routes/` (p. ej. `ai-chat.routes.ts`) si no encajan en un módulo de negocio.
- Configuración central: **`src/config/env.ts`** (obligatoriedad de variables), **`config/db.ts`** (Prisma), **`config/swagger.ts`**.

## Convenciones de código

- **Clean code:** funciones cortas, nombres explícitos, sin duplicar lógica entre controller y service (el controller orquesta HTTP; el service, reglas y Prisma).
- **Errores:** usar el **error handler** central; propagar `status` cuando sea HTTP esperado; no filtrar stack traces sensibles al cliente en producción.
- **Logs:** estructurados cuando tenga sentido; **nunca** loguear tokens, cookies, `FIREBASE_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, cuerpos completos de pagos con PII innecesaria.
- **Variables de entorno:** leer solo vía **`env`** validado; no usar `process.env` disperso en servicios nuevos.

## Validación y contratos

- Entrada: **Zod** en schemas; respuestas coherentes con lo ya usado en el módulo (`message`, `errors.flatten()`, etc.).
- Cualquier ruta nueva documentada en **Swagger** (bloques `@swagger` en routes) para mantener `/api-docs` útil.

## Prisma

- Consultas en **services**; transacciones donde haya varias escrituras relacionadas.
- Migraciones: `prisma migrate`; no editar a mano historial de migraciones ya aplicadas en equipo.
- `DATABASE_URL` y **`DIRECT_URL`** según `schema.prisma`.

## Seguridad

- Rutas protegidas: middleware **`auth`** (Bearer). Valorar **`isAdmin`** solo donde el producto lo exija.
- CORS: añadir orígenes solo cuando sea necesario y acordado.
- Webhook Stripe: verificar firma con **`STRIPE_WEBHOOK_SECRET`** en producción.

## Tests

- Tests en `src/tests/` o junto al patrón existente; ejecutar `npm test` en `BookMatch-Backend` tras cambios en lógica crítica.

## Documentación

- Cambios de API: actualizar **Módulos** / **API** en Confluence si el equipo mantiene esa wiki; mantener Swagger sincronizado.
