---
description: BookMatch — secretos, .env y entornos. No subir claves; Firebase cliente vs Admin SDK. @bookmatch-secrets-env o al editar environments / env.example.
globs:
  - BookMatch-Angular/src/environments/*.ts
  - BookMatch-Backend/env.production.example
alwaysApply: false
---

# BookMatch — secretos y variables de entorno

**Invocación:** **@bookmatch-secrets-env** o al editar los archivos del glob.

## Reglas de oro

- **Nunca** commitear `.env`, `.env.local`, ni pegar **secretos** en Confluence, Jira, PRs o prompts.
- **Rotar** claves si hubo filtración (historial de git, wiki, capturas).
- El hook del repo bloquea **`git add`** si la orden incluye rutas con **`.env`**; no lo desactives sin consenso del equipo.

## Backend (`BookMatch-Backend`)

- Secretos solo en **`.env`** local o en el gestor del hosting (Vercel, etc.).
- Variables obligatorias y validadas en **`src/config/env.ts`**: `DATABASE_URL`, Firebase Admin, `STRIPE_SECRET_KEY`, etc.
- **`STRIPE_WEBHOOK_SECRET`**, **`N8N_WEBHOOK_URL`**: sensibles o críticos; no van al frontend.
- `env.production.example` solo con **placeholders** (`your-...`, `...`), nunca valores reales.

## Frontend (`BookMatch-Angular`)

- **`environment.ts` / `environment.prod.ts`**: solo configuración **pública** de Firebase (apiKey, projectId, etc.) y clave **publicable** de Stripe (`pk_...`).
- **No** incluir `FIREBASE_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_URL`, ni tokens de servicio.

## Logs y errores

- No loguear cabeceras `Authorization` completas, cuerpos de webhook con datos sensibles ni `.env`.

## Referencias

- Instalación y despliegue en Confluence / **README**; detalle en reglas **bookmatch-backend-node** y skill **bookmatch-confluence-docs**.
