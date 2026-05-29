<div align="center">

![Angular](https://img.shields.io/badge/Angular-21-C8956C?style=for-the-badge&logo=angular&logoColor=white&labelColor=1C1410)
&nbsp;
![Express](https://img.shields.io/badge/Express-5-A0785A?style=for-the-badge&logo=express&logoColor=white&labelColor=1C1410)
&nbsp;
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-D4B896?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1C1410)
&nbsp;
![Prisma](https://img.shields.io/badge/Prisma-6-8B6F47?style=for-the-badge&logo=prisma&logoColor=white&labelColor=1C1410)
&nbsp;
![Firebase](https://img.shields.io/badge/Firebase-11-C8956C?style=for-the-badge&logo=firebase&logoColor=white&labelColor=1C1410)

<br/>

# BookMatch — Monorepo Principal

**Web + Backend + Docs**

<br/>

<a href="https://www.bookmatch.club/">
  <img src="https://img.shields.io/badge/Web-bookmatch.club-C8956C?style=for-the-badge&labelColor=1C1410"/>
</a>
&nbsp;
<a href="https://api.bookmatch.club/api-docs">
  <img src="https://img.shields.io/badge/API-Swagger_UI-A0785A?style=for-the-badge&labelColor=1C1410"/>
</a>
&nbsp;
<a href="https://book-match-docs.vercel.app/">
  <img src="https://img.shields.io/badge/Compodoc-Docs_Angular-D4B896?style=for-the-badge&labelColor=1C1410"/>
</a>
&nbsp;
<a href="https://github.com/SamuelMarquezRuiz/BookMatch-Android">
  <img src="https://img.shields.io/badge/Android-BookMatch--Android-8B6F47?style=for-the-badge&logo=android&logoColor=white&labelColor=1C1410"/>
</a>

</div>

---

## Índice

1. [Descripción](#descripción)
2. [Estructura del repositorio](#estructura-del-repositorio)
3. [Arquitectura del sistema](#arquitectura-del-sistema)
4. [Despliegue en producción](#despliegue-en-producción)
5. [Puesta en marcha local](#puesta-en-marcha-local)
6. [Endpoints de la API](#endpoints-de-la-api)
7. [Flujo de pagos con Stripe](#flujo-de-pagos-con-stripe)
8. [Sistema de Analytics](#sistema-de-analytics)
9. [IA y Playlists (n8n)](#ia-y-playlists-n8n)
10. [Seeding de la base de datos](#seeding-de-la-base-de-datos)
11. [Seguridad](#seguridad)
12. [Testing](#testing)
13. [Scripts útiles](#scripts-útiles)
14. [Dependencias principales](#dependencias-principales)
15. [Changelog](#changelog)

---

## Descripción

**BookMatch** es una plataforma web y móvil para comprar, vender e intercambiar libros. Este repositorio contiene el **frontend Angular 21**, el **backend Express 5** y la **documentación técnica** del proyecto.

> Ver el README del [repositorio de presentación](https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular) para la descripción completa del proyecto, la aportación por módulo académico y los enlaces de producción.

---

## Estructura del repositorio

```
BookMatch-Proyecto-Intermodular/
├── BookMatch-Angular/                  # Frontend Angular 21 (standalone)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                   # Guards, interceptors, servicios singleton
│   │   │   │   ├── guards/auth.guard.ts
│   │   │   │   └── services/
│   │   │   │       ├── auth.service.ts
│   │   │   │       ├── catalog.service.ts
│   │   │   │       ├── payment.service.ts
│   │   │   │       ├── storage.service.ts
│   │   │   │       └── users.service.ts
│   │   │   ├── shared/                 # Componentes y modelos reutilizables
│   │   │   │   ├── components/
│   │   │   │   │   ├── header/
│   │   │   │   │   ├── footer/
│   │   │   │   │   ├── carousel/
│   │   │   │   │   ├── loader/
│   │   │   │   │   ├── comment-thread/
│   │   │   │   │   └── phone-input/
│   │   │   │   └── models/
│   │   │   ├── features/               # Pantallas de la aplicación
│   │   │   │   ├── auth/               # Login, registro, recuperación
│   │   │   │   ├── landing/            # Página de inicio pública
│   │   │   │   ├── home/               # Catálogo con grid de libros
│   │   │   │   ├── book-details/       # Detalle del libro + botón compra
│   │   │   │   ├── book-form/          # Formulario creación/edición libro
│   │   │   │   ├── categories/         # Filtrado por categoría
│   │   │   │   ├── categories-selector/
│   │   │   │   ├── search-results/     # Resultados de búsqueda
│   │   │   │   ├── cart-view/          # Carrito de compras
│   │   │   │   ├── payment-success/    # Confirmación de pago Stripe
│   │   │   │   ├── playlists/          # Listas manuales + generadas por IA
│   │   │   │   ├── ai-chat/            # Chat con IA (n8n)
│   │   │   │   ├── forum-index/        # Índice de foros
│   │   │   │   ├── forum-topic-list/   # Posts de un foro
│   │   │   │   ├── post-detail/        # Detalle de post + comentarios
│   │   │   │   ├── trueque/            # Intercambio de libros
│   │   │   │   ├── profile/            # Perfil del usuario + foto
│   │   │   │   └── profile-edit/       # Edición de perfil
│   │   │   └── pages/
│   │   │       └── analytics/          # Dashboard analítico (admin)
│   │   ├── assets/
│   │   │   └── i18n/                   # Traducciones ES/EN (ngx-translate)
│   │   └── environments/
│   │       ├── environment.ts          # Desarrollo (Firebase + Stripe + API URL)
│   │       └── environment.prod.ts     # Producción
│   ├── n8n/workflows/                  # Definiciones de workflows n8n exportadas
│   └── capacitor.config.ts
│
├── BookMatch-Backend/                  # API REST (Express 5 + TypeScript)
│   ├── src/
│   │   ├── app.ts                      # Montaje Express, middleware global
│   │   ├── index.ts                    # Entry point
│   │   ├── config/                     # Variables de entorno, Prisma client, Swagger
│   │   ├── middleware/                 # auth, validate (Zod), errorHandler, rateLimit
│   │   └── modules/                   # Un módulo por dominio de negocio
│   │       ├── auth/                   # Firebase JWT sync
│   │       ├── users/                  # Perfil y gestión de usuarios
│   │       ├── catalog-books/          # Catálogo + reseñas + categorías
│   │       ├── orders/                 # Pedidos e historial
│   │       ├── payments/               # Stripe Checkout + Webhook
│   │       ├── playlists/              # Playlists manuales + IA
│   │       ├── analytics/              # GA4 Data API + dashboard
│   │       ├── forums/                 # Foros
│   │       ├── posts/                  # Posts en foros
│   │       ├── comments/               # Comentarios en posts
│   │       ├── votes/                  # Votos en posts
│   │       ├── trades/                 # Módulo de trueque
│   │       └── user-books/             # Biblioteca personal del usuario
│   ├── prisma/
│   │   ├── schema.prisma               # Schema completo de la BD
│   │   └── migrations/                 # Migraciones versionadas
│   ├── scripts/                        # Python analytics
│   │   ├── seed_analytics.py           # Genera datos sintéticos (pandas + numpy)
│   │   ├── ga4_analytics.py            # Consulta GA4 Data API
│   │   └── requirements.txt
│   ├── seed.ts                         # Seeding desde Google Books API (~1000 libros)
│   ├── Dockerfile                      # Build multi-etapa Node + Prisma + Python/venv
│   ├── docker-compose.yml
│   └── env.production.example          # Plantilla de variables (sin secretos)
│
├── docs/
│   ├── Confluence/                     # Exportación local de la wiki técnica
│   └── *.md                            # Contratos de API adicionales
│
└── .github/
    └── workflows/
        └── deploy-ec2-backend.yml      # CI/CD: push main → SSH EC2 → docker compose
```

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│  Clientes                                                   │
│  ┌─────────────────────────┐  ┌────────────────────────┐   │
│  │  Angular 21             │  │  Kotlin + Compose      │   │
│  │  Tailwind · Capacitor   │  │  Room · Hilt · Retrofit│   │
│  └───────────┬─────────────┘  └───────────┬────────────┘   │
└──────────────┼────────────────────────────┼────────────────┘
               │  REST HTTPS                │  Retrofit
               ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend — Express 5 · TypeScript · ESM                     │
│                                                             │
│  Middleware: auth (Firebase JWT) · Zod · Helmet · CORS      │
│             Rate Limit · Winston · Error handler            │
│                                                             │
│  Módulos: auth · users · catalog-books · orders             │
│           payments · playlists · analytics · ai-chat        │
│           forums · posts · comments · votes · trades        │
│                                                             │
│  Integraciones: Firebase Admin · Stripe · n8n · SMTP        │
│  ORM: Prisma 6 → PostgreSQL (Supabase)                      │
│  Docs: Swagger UI /api-docs                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   PostgreSQL               Firebase Storage
   (Supabase)               Avatares · Portadas IA
```

**Flujo de autenticación:**
1. Cliente inicia sesión con Firebase (email/Google).
2. Firebase devuelve un ID token JWT.
3. El cliente envía `Authorization: Bearer <idToken>` en cada request protegido.
4. El middleware `auth` verifica el token con Firebase Admin SDK y sincroniza el usuario en PostgreSQL.

---

## Despliegue en producción

| Capa | Servicio | Detalle |
|---|---|---|
| **Frontend** | Vercel | `environment.prod.ts` — `apiUrl: 'https://api.bookmatch.club/api'` |
| **API** | AWS EC2 (Ubuntu) | Docker (Node + Prisma + Python/venv) · Caddy (TLS) · `127.0.0.1:3000` |
| **Base de datos** | Supabase (PostgreSQL) | `DATABASE_URL` (pooler) + `DIRECT_URL` (migraciones directas) |
| **CI/CD backend** | GitHub Actions | Push a `main` con cambios en `BookMatch-Backend/**` → SSH → `docker compose up -d` |

### Despliegue en EC2

```bash
cd BookMatch-Backend

# Variables en .env solo en el servidor (nunca en git)
docker compose build
docker compose up -d

# Migraciones cuando cambia el schema:
docker compose run --rm api npx prisma migrate deploy
```

CI/CD automático: `.github/workflows/deploy-ec2-backend.yml` — secretos del repo: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.

---

## Puesta en marcha local

### 1 — Backend

```bash
cd BookMatch-Backend
npm install

# Crear .env desde la plantilla
cp env.production.example .env
# → editar con tus credenciales de Firebase, Stripe y Supabase

# Generar Prisma Client y aplicar migraciones
npx prisma generate
npx prisma migrate deploy

# Seed del catálogo (~1000 libros desde Google Books API)
npx tsx seed.ts

# Seed de datos analíticos (requiere Python 3 + pip)
cd scripts
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_analytics.py
cd ..

# Arrancar en desarrollo
npm run dev
# → http://localhost:3000
# → Swagger: http://localhost:3000/api-docs
```

#### Variables de entorno mínimas (`.env`)

```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://USUARIO:PASS@HOST:PUERTO/DB?schema=public"
DIRECT_URL="postgresql://USUARIO:PASS@HOST:PUERTO/DB"   # para prisma migrate

FIREBASE_PROJECT_ID=bookmatch-522d5
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@bookmatch-522d5.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...   # opcional en desarrollo
FRONTEND_URL=http://localhost:4200
```

> El archivo `.env` **no se versiona**. El hook del repo bloquea `git add .env`.

#### Webhooks de Stripe en local

```bash
stripe login
stripe listen --forward-to localhost:3000/api/payments/webhook
# → copia el webhook secret a STRIPE_WEBHOOK_SECRET en .env
```

### 2 — Frontend

```bash
cd BookMatch-Angular
npm install

# Editar src/environments/environment.ts con:
# - Firebase config del proyecto bookmatch-522d5
# - stripePublishableKey: 'pk_test_...'
# - apiUrl: 'http://localhost:3000/api'

npm start
# → http://localhost:4200
```

### 3 — Android

```
Abrir BookMatch-Android/ en Android Studio
Sincronizar Gradle
Añadir app/google-services.json (Firebase)
Run en emulador o dispositivo Android 14+ (minSdk 34)
```

---

## Endpoints de la API

> Documentación completa interactiva: [`api.bookmatch.club/api-docs`](https://api.bookmatch.club/api-docs)

### Autenticación — `/api/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Sincroniza usuario Firebase en PostgreSQL | Body: `idToken` |
| POST | `/api/auth/login` | Valida token y devuelve perfil | Body: `idToken` |
| POST | `/api/auth/forgot-password` | Recuperación de contraseña (nodemailer) | Body: `email` |

### Usuarios — `/api/users`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/users/me` | Perfil del usuario autenticado | Bearer |
| PATCH | `/api/users/me` | Actualizar nombre, avatar, teléfono | Bearer |
| GET | `/api/users` | Lista usuarios | Bearer + admin |
| GET | `/api/users/:id` | Usuario por ID | Bearer |
| DELETE | `/api/users/:id` | Eliminar usuario | Bearer + admin |

### Catálogo — `/api/catalog-books`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/catalog-books` | Lista paginada — filtros: `page`, `limit`, `search`, `minPrice`, `maxPrice`, `minRating`, `categoryId`, `sortBy` | Bearer |
| GET | `/api/catalog-books/categories` | Lista de categorías | Bearer |
| GET | `/api/catalog-books/:id` | Detalle del libro | Bearer |
| POST | `/api/catalog-books` | Crear libro | Bearer + admin |
| PATCH | `/api/catalog-books/:id` | Actualizar libro | Bearer + admin |
| DELETE | `/api/catalog-books/:id` | Eliminar libro | Bearer + admin |
| POST | `/api/catalog-books/:id/reviews` | Añadir reseña | Bearer |
| DELETE | `/api/catalog-books/reviews/:id` | Borrar reseña propia | Bearer |

### Pedidos — `/api/orders`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/orders` | Crear pedido | Bearer |
| GET | `/api/orders/history` | Historial del usuario | Bearer |

### Pagos — `/api/payments`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/payments/create-checkout-session` | Sesión Stripe para un libro | Bearer |
| POST | `/api/payments/create-checkout-session-cart` | Sesión Stripe para carrito | Bearer |
| POST | `/api/payments/webhook` | Eventos Stripe (body raw, verifica firma) | No |
| GET | `/api/payments/success` | Verificar pago + crear Order | Bearer |
| GET | `/api/payments/session/:id` | Detalles de la sesión | Bearer |

### Playlists — `/api/playlists`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/playlists` | Playlists del usuario | Bearer |
| POST | `/api/playlists` | Crear playlist manual | Bearer |
| GET | `/api/playlists/:id` | Detalle completo | Bearer |
| PATCH | `/api/playlists/:id` | Modificar título, visibilidad, items | Bearer |
| DELETE | `/api/playlists/:id` | Eliminar playlist | Bearer |
| POST | `/api/playlists/:id/items` | Añadir libro a la lista | Bearer |
| DELETE | `/api/playlists/items/:id` | Quitar libro de la lista | Bearer |
| POST | `/api/playlists/generate` | Generar playlist vía IA (n8n) | Bearer |

### Foros, Posts, Comentarios y Votos

| Módulo | Ruta base | GET | POST/PATCH/DELETE |
|---|---|---|---|
| Foros | `/api/forums` | Sin auth | Bearer |
| Posts | `/api/forums/:forumId/posts` | Sin auth | Bearer |
| Comentarios | `/api/forums/:forumId/posts/:postId/comments` | Sin auth | Bearer |
| Votos | `/api/forums/:forumId/posts/:postId/votes` | Bearer | Bearer |

### Trueque — `/api/trades`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/trades` | Trueques del usuario (enviados y recibidos) | Bearer |
| POST | `/api/trades` | Crear propuesta de trueque | Bearer |
| POST | `/api/trades/:id/accept` | Aceptar propuesta | Bearer |
| POST | `/api/trades/:id/reject` | Rechazar propuesta | Bearer |
| POST | `/api/trades/:id/complete` | Completar intercambio | Bearer |

### Analytics — `/api/analytics`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/analytics/traffic` | Datos GA4 + métricas para dashboard | Bearer + admin |

### Utilidades

| Ruta | Descripción |
|---|---|
| `GET /health` | Health check del servicio |
| `GET /api-docs` | Swagger UI |

---

## Flujo de pagos con Stripe

```
1. Usuario pulsa "Comprar" en book-details o desde el carrito
   ↓
2. Frontend → POST /api/payments/create-checkout-session
   { bookId, quantity?, successUrl?, cancelUrl? }
   ↓
3. Backend → Stripe: crea Checkout Session con nombre, precio e imagen del libro
   ↓
4. Frontend redirige a stripe.com/checkout
   ↓
5. Usuario paga (Card / Link / PayPal) — modo test disponible
   ↓
6. Stripe → POST /api/payments/webhook  (evento: checkout.session.completed)
   Backend verifica firma STRIPE_WEBHOOK_SECRET
   ↓
7. Backend:
   ├── Crea Order en PostgreSQL con estado COMPLETED
   ├── Decrementa stock del libro
   └── Envía correo de confirmación (nodemailer + SMTP)
   ↓
8. Stripe redirige a /payment-success?session_id=...
   ↓
9. Android: deep link bookmatch://payment/success?session_id=...
```

**Tarjetas de prueba:**

| Número | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0000 0000 0002` | Pago rechazado |
| `4000 0025 0000 3155` | Requiere 3D Secure |

Datos: cualquier fecha futura · CVC `123` · CP `12345`

---

## Sistema de Analytics

El módulo de analytics (`/api/analytics`) agrega datos de tres fuentes:

1. **GA4 Data API** — métricas reales del frontend en producción (sesiones, usuarios, vistas de página).
2. **Firebase Analytics** — eventos de usuario rastreados en el frontend Angular.
3. **Datos sintéticos** generados con Python para entornos de desarrollo.

**Scripts Python** (requieren entorno virtual en `BookMatch-Backend/scripts/`):

```bash
cd BookMatch-Backend/scripts
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

python seed_analytics.py     # genera series temporales sintéticas
python ga4_analytics.py      # consulta y exporta datos de GA4
```

El endpoint `GET /api/analytics/traffic` requiere Bearer + rol `admin` y alimenta el dashboard de Chart.js en `/analytics`.

---

## IA y Playlists (n8n)

El sistema de IA delega en workflows de **n8n** mediante webhooks HTTP:

| Endpoint | Webhook n8n | Descripción |
|---|---|---|
| `POST /api/playlists/generate` | `N8N_WEBHOOK_PLAYLIST_URL` | Genera una playlist a partir de un prompt en lenguaje natural |
| `POST /api/ai-chat/send-message` | `N8N_WEBHOOK_URL` | Chat con el asistente; la conversación se persiste en Firestore |

Si las variables `N8N_WEBHOOK_URL` / `N8N_WEBHOOK_PLAYLIST_URL` no están definidas, los endpoints responden **503** (documentado en Swagger).

Los workflows están exportados en `BookMatch-Angular/n8n/workflows/` y pueden importarse directamente en cualquier instancia de n8n.

---

## Seeding de la base de datos

### Catálogo de libros (`seed.ts`)

El script conecta con la **Google Books API** y persiste ~1000 libros reales:

1. **Sincroniza 47 categorías** con IDs fijos (upsert — idempotente).
2. **Busca por categoría** con query `subject:...` en Google Books.
3. **Filtra calidad:** descarta libros sin ISBN válido, título o autor.
4. **Normaliza:** URLs `http→https`, precios aleatorios 12–45 €, stock aleatorio.
5. **Persiste:** `CatalogBook` + relación N:M `CatalogBookCategory`.
6. **Rate limiting** interno para no saturar la API de Google.
7. **Novedades (ID 47):** selecciona los últimos 100 libros insertados, los mezcla y asigna 40 a esta categoría.

```bash
npx tsx seed.ts
```

### Datos de trueque para demo (`seed_trades.py`)

Genera usuarios seed y propuestas de trueque pre-existentes para facilitar las demostraciones. Con `TRADE_DEMO_AUTO_ACCEPT_MS=5000` en `.env`, las propuestas dirigidas a usuarios seed se auto-aceptan a los 5 segundos.

---

## Seguridad

| Capa | Medida | Implementación |
|---|---|---|
| **Autenticación** | Firebase JWT | `middleware/auth.ts` — verifica con Firebase Admin SDK |
| **Autorización** | Rol `isAdmin` | Checks en servicios para rutas admin |
| **Headers** | Helmet | CSP, HSTS, X-Frame-Options, etc. |
| **Rate limiting** | express-rate-limit | `/api/auth` más restrictivo |
| **Validación** | Zod | `middleware/validate.ts` — esquemas por ruta |
| **CORS** | Lista blanca | `app.ts` — orígenes `bookmatch.club` + localhost |
| **Logs** | Winston | `utils/logger.ts` — fichero + stdout |
| **Secretos** | `.env` no versionado | Hook pre-commit bloquea `git add .env` |
| **TLS** | Caddy + Let's Encrypt | Certificado automático en producción |
| **Pagos** | Firma HMAC | `STRIPE_WEBHOOK_SECRET` — verificación en cada evento |

**Firebase Storage Rules** (configurar en Firebase Console):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}_{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.uid == userId.split('_')[0];
    }
  }
}
```

---

## Testing

```bash
# Frontend (Angular + Karma/Jasmine)
cd BookMatch-Angular
ng test

# Backend (Jest)
cd BookMatch-Backend
npm test
```

---

## Scripts útiles

### Frontend

```bash
npm start            # ng serve → http://localhost:4200
npm run build        # Build de producción → dist/
ng test              # Tests unitarios
npx @compodoc/compodoc -p tsconfig.json -s  # Docs → http://localhost:8080
```

### Backend

```bash
npm run dev          # nodemon — desarrollo
npm run build        # tsc → dist/
npm start            # node dist/index.js
npx prisma studio    # Interfaz visual de la BD
npx prisma migrate dev   # Nueva migración en desarrollo
npx prisma generate  # Regenerar Prisma Client
npx tsx seed.ts      # Poblar catálogo
```

---

## Dependencias principales

### Frontend

| Paquete | Versión | Uso |
|---|---|---|
| `@angular/core` | ^21.x | Framework Angular |
| `@angular/fire` | ^20.x | Integración Firebase |
| `@stripe/stripe-js` | ^8.x | SDK Stripe (frontend) |
| `@capacitor/core` | ^7.4 | Bridge nativo |
| `@capacitor/camera` | ^7.x | Cámara y galería |
| `firebase` | ^11.x | Auth, Storage, Firestore |
| `chart.js` | — | Gráficos analytics |
| `@ngx-translate/core` | — | Internacionalización |
| `rxjs` | ~7.8 | Programación reactiva |

### Backend

| Paquete | Versión | Uso |
|---|---|---|
| `express` | ^5.1 | Framework web |
| `@prisma/client` | ^6.x | ORM |
| `stripe` | — | SDK Stripe |
| `firebase-admin` | ^13.x | Admin SDK |
| `zod` | ^4.x | Validación de esquemas |
| `winston` | ^3.x | Logging estructurado |
| `helmet` | ^8.x | Seguridad HTTP |
| `express-rate-limit` | ^8.x | Rate limiting |
| `nodemailer` | — | Envío de correos SMTP |

---

## Changelog

### Mayo 2026 — Sprints 9 y 10

- **[SCRUM-231]** Trueque: auto-aceptación de propuestas a usuarios seed para demo.
- **[SCRUM-230]** UI: estética global con fuente Lora en footer/carrito/ai-chat, fix nav header.
- **[SCRUM-227]** Auth: UI de recuperación de contraseña en pantalla de login.
- **[SCRUM-226]** Stripe + SMTP: credenciales en producción para envío de recibos.
- **[SCRUM-220]** Trueque: rediseño visual completo con skeletons, i18n y responsividad móvil.
- **[SCRUM-197]** Épica Trueque: módulo completo (UI + API + estados).
- **[SCRUM-195]** Analytics: integración GA4 con dashboard PowerBI en Chart.js.
- **[SCRUM-181]** Playlists: portadas generadas por IA en Firebase Storage.
- **[SCRUM-175]** AI Chat: rediseño con panel lateral, memoria y conversión de hilos a listas.

### Abril 2026 — Sprint 8

- Despliegue en AWS EC2 con Docker + Caddy + Supabase.
- CI/CD GitHub Actions (`deploy-ec2-backend.yml`).
- Workflows n8n: memoria de conversación, `playlist_builder`, SQL.
- Auditoría completa de la wiki Confluence.

### Noviembre 2025 — Sprints 1–7

- Stripe Checkout completo (libro + carrito) con webhooks y creación de órdenes.
- Sistema de foros: posts, comentarios anidados, votos, subida de imágenes.
- Perfil de usuario con foto (Capacitor + Firebase Storage).
- Carrito con persistencia en localStorage.
- Playlists CRUD + integración n8n inicial.
- App Android nativa (Kotlin + Compose + Room).

---

**Última actualización:** Mayo 2026 — Trueque, rediseño UI, SCRUM-231.
