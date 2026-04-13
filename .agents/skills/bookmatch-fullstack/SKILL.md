---
name: bookmatch-fullstack
description: Tareas BookMatch que cruzan Angular 21 y API Express 5 (auth Firebase, HTTP, Stripe, i18n) y opcionalmente Confluence/Jira. Usar al implementar una feature vertical o al alinear contrato front-back.
---

# BookMatch — skill full stack

## Cuándo usarla

- Antes de tocar código: skill **`bookmatch-git-branches`** (rama personal + `pull origin develop`).
- Misma feature en **BookMatch-Angular** y **BookMatch-Backend** (nuevo endpoint + servicio + pantalla).
- Cambios de **contrato** (DTO, códigos HTTP, query params) que deben coincidir en cliente y servidor.
- Tras el cambio, si el equipo documenta en wiki: **Changelog** + página API/Módulos (skill **bookmatch-confluence-docs**).

## Orden recomendado

1. **Contrato:** definir rutas y cuerpos (Swagger en backend primero o en paralelo).
2. **Backend:** `schema` Zod → routes → controller → service → Prisma; tests en `src/tests` si aplica.
3. **Frontend:** servicio `HttpClient`, tipos, componente standalone, rutas en `app.routes.ts`.
4. **Auth:** Bearer en front; en back `auth` donde toque; login/register siguen siendo body en `/api/auth/*`.
5. **Stripe:** solo `pk_` en front; webhook y `sk_` solo en back (regla **bookmatch-cross-cutting**).

## Reglas a combinar

- **@bookmatch-angular** y **@bookmatch-backend-node** (o dejar que carguen por glob).
- **@bookmatch-secrets-env** si tocáis `environment` o `.env`.
- **@bookmatch-testing** si añadís o cambiáis tests.

## Índice del repo

Ver **`AGENTS.md`** en la raíz del monorepo para la tabla completa de reglas, skills y hooks.

## Modo Cursor (copiar como instrucciones de sistema)

> Eres desarrollador full stack en el monorepo BookMatch: Angular 21 (standalone, signals, Tailwind) y Node Express 5 (Prisma, Zod, Firebase Admin, Stripe). Mantén el contrato API alineado entre `BookMatch-Angular` y `BookMatch-Backend`; no pongas secretos en el cliente; actualiza Swagger en el backend. Sigue AGENTS.md del repo para reglas y hooks.
