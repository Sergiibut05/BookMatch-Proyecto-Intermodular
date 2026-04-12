---
description: BookMatch — Prisma schema, migraciones y URLs DIRECT_URL/DATABASE_URL. @bookmatch-prisma o carpeta prisma.
globs: BookMatch-Backend/prisma/**/*
alwaysApply: false
---

# BookMatch — Prisma y PostgreSQL

**Invocación:** **@bookmatch-prisma** o archivos bajo `BookMatch-Backend/prisma/`.

## Datasource

- `schema.prisma` usa **`url`** = `DATABASE_URL` y **`directUrl`** = `DIRECT_URL`.
- En local suelen ser la **misma** cadena; en hosting con pooler pueden diferir.

## Migraciones

- Desarrollo: `npx prisma migrate dev --name descripcion_clara`.
- CI / producción: `npx prisma migrate deploy`.
- **No** editar migraciones ya aplicadas en equipo ni borrar historial compartido.
- `migrate reset` solo en máquina local y sabiendo que **borra datos**.

## Cliente

- Tras cambios en schema: `npx prisma generate` (o `npm install` / postinstall en backend).
- Consultas y transacciones en **services** del backend, no en controllers.

## Seed

- `prisma/seed.ts`: variables `GOOGLE_BOOKS_API_KEY`, opcionalmente Cloudinary; ver skill Confluence / página de seeding.

## Nombres y mapas

- Respetar `@@map` y `@map` existentes para no romper tablas en producción.

## Documentación

- Modelos resumidos en Confluence; fuente de verdad: **`schema.prisma`**.
