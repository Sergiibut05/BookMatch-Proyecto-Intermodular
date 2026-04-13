---
name: bookmatch-backend
description: Estándares BookMatch para la API en BookMatch-Backend — Express 5 ESM, Prisma, Zod, Firebase Admin, Stripe webhook, Swagger, seguridad y clean code. Usar al implementar o revisar endpoints y servicios.
---

# BookMatch — skill backend Node

## Cuándo usarla

- Consulta **`AGENTS.md`** en la raíz del repo para el mapa completo de reglas y hooks.
- Cambios en **`BookMatch-Backend/src/`** (rutas, controllers, services, middleware, Prisma, config).
- Diseño de endpoint nuevo o ajuste de webhook / auth / validación.

## Checklist rápido

1. **Imports ESM** con extensión **`.js`** en paths relativos compilados.
2. **Capas:** `*.routes.ts` → controller → service; Zod en `*.schema.ts` + `validate()`.
3. **Env:** solo **`env`** desde `config/env.ts`; no dispersar `process.env`.
4. **Webhook Stripe:** no mover después de `express.json()`; cuerpo raw solo en esa ruta.
5. **Auth:** `auth` middleware en rutas protegidas; decidir explícitamente si hace falta `isAdmin`.
6. **Swagger:** anotar rutas nuevas/alteradas para `/api-docs`.
7. **Prisma:** lógica de BD en services; transacciones si hay varias escrituras.
8. **Seguridad:** sin logs de secretos; CORS solo orígenes acordados.
9. **Tests:** `npm test` tras lógica sensible.

## Stack de referencia (detalle)

Ver tabla en la regla **@bookmatch-backend-node**: Express 5, Prisma 6, Zod 4, Firebase Admin, Stripe, helmet, cors, rate-limit, hpp, Winston, Jest, swagger-jsdoc.

## Documentación

- Express 5 / Prisma / Zod: usar **Context7** o docs oficiales si hay dudas de API.
- Tras cambios de contrato: Confluence **API y Endpoints** / **Módulos** si el equipo actualiza la wiki.

## Regla asociada

- **@bookmatch-backend-node** / glob `BookMatch-Backend/**/*.ts`.

## Agente dedicado en Cursor (opcional)

Instrucciones de sistema sugeridas para un **modo personalizado**:

> Eres el desarrollador backend del proyecto BookMatch en BookMatch-Backend. Stack: Node ESM, Express 5, TypeScript, Prisma (PostgreSQL), Zod, Firebase Admin JWT, Stripe (Checkout + raw webhook antes de json), Swagger. Separa routes/controller/service; no loguees secretos; valida entradas con Zod; mantén app.ts orden (webhook primero).
