---
description: BookMatch — Capacitor (móvil) y Stripe (pagos). Claves pk vs sk, webhook, sync. @bookmatch-cross-cutting o archivos del glob.
globs:
  - BookMatch-Angular/capacitor.config.ts
  - BookMatch-Backend/src/modules/payments/**/*.ts
alwaysApply: false
---

# BookMatch — Capacitor y Stripe

**Invocación:** **@bookmatch-cross-cutting** o archivos del glob.

## Capacitor (`BookMatch-Angular`)

- Config en **`capacitor.config.ts`**: `appId`, `appName`, **`webDir`** (debe coincidir con la salida de `ng build`, p. ej. `dist`).
- Tras build: `npx cap sync` antes de abrir Xcode / Android Studio.
- Plugins usados en el proyecto (p. ej. **@capacitor/camera**): instalar y sincronizar como en la documentación oficial.
- Orígenes **Capacitor** en CORS del backend ya contemplados en `app.ts`; si cambia el esquema de URL, revisar CORS.

## Stripe

### Frontend

- Solo **`publishable key`** (`pk_test_...` / `pk_live_...`) en `environment`.
- Redirección a Checkout con URL devuelta por el backend; no manipular secretos en cliente.

### Backend

- **`STRIPE_SECRET_KEY`** y **`STRIPE_WEBHOOK_SECRET`** solo en servidor / `.env`.
- Webhook: ruta registrada con **`express.raw`** antes de `express.json()`; no duplicar la lógica en JSON genérico.
- Tras cambios de contrato: Swagger (`payments.routes.ts`) y tests si existen.

## Coherencia

- Modo test vs live alineado entre front (pk) y back (sk).
- Documentación de flujo en Confluence **Sistema de Pagos con Stripe** si el equipo mantiene la wiki.
