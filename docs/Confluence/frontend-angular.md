# Frontend - Angular

### Resumen

Frontend **Angular 21** (standalone / `loadComponent`), **TypeScript \~5.9**, **Tailwind**, **RxJS**. Auth con **Firebase** en cliente; llamadas a la API con token Bearer vía servicios HTTP. **Capacitor 7** para empaquetado móvil. i18n con **@ngx-translate** — página hija Internacionalización.

### Estructura (`src/app/`)

<![CDATA[core/ # guards, interceptors, servicios singleton (auth, API, etc.) shared/ # componentes y modelos reutilizables features/ # vistas por dominio: auth, home, catálogo, carrito, foros, perfil, ai-chat, playlists, analytics…]]>

### Rutas (`app.routes.ts`)

* `''` → `/auth/login`
* `auth/login`, `auth/register` — lazy `loadComponent`.
* **Con** `authGuard`: `home`, `admin/books/create`, `admin/books/edit/:id`, `categories`, `categories/:categoria`, `book-details/:id`, `cart`, `payment-success`, `profile`, `foro`, `foro/:id`, `foro/:forumId/tema/:postId`, `search-results`, `ai-chat`, `playlists`, `playlists/new`, `playlists/:id`, `analytics`.
* **Públicas (sin guard):** políticas y pie de página — `privacy-policy`, `cookies-policy`, `refund-policy`, `terms-and-conditions`, `frequent-questions`, `payment-methods`, `about-us`, `playlists/shared/:id`.
* `**` → redirect a `/auth/login`.

El guard `authGuard` (`core/guards/auth.guard.ts`) es **asíncrono**: espera a `AuthService.user$` y, si no hay sesión, redirige a login con `returnUrl`.

### Servicios (patrones reales)

* **AuthService** — Firebase sign-in/out, observable de usuario, obtención de token para cabeceras.
* **CatalogService** — listados, filtros, detalle de libro (según implementación actual).
* **CartService** — estado del carrito (p. ej. signals) y operaciones añadir/quitar/cantidad.
* **PaymentService** — `createCheckoutSession(bookId, quantity?)`, `createCheckoutSessionCart(items)`, `redirectToCheckout(url)`, `getCheckoutSession(sessionId)`, `verifyPaymentSuccess(sessionId)` → llama a `GET .../payments/success?session_id=` en backend.
* **StorageService** — subida a Firebase Storage (avatars, portadas de playlists) si está en uso.
* **PlaylistService** — CRUD de playlists, arrastrar y soltar libros.
* **AiChatService** — Lógica de mensajería (n8n webhooks) y gestión de modo "playlist".
* **AnalyticsService** — Recuperación de métricas formateadas para Chart.js.
* **TranslationService** / **TranslateService** — idioma y claves i18n.

### UI y Arquitectura Avanzada

* **Analíticas (Chart.js)**: Integración estilo PowerBI en la vista `AnalyticsComponent` (restringida a administradores).
* **AI Chat**: El módulo `ai-chat` cuenta con un panel lateral colapsable, historial persistente, interpolación de variables locales para el contexto, y un panel secundario (`playlist draft`) para co-crear catálogos con IA.
* **Playlists**: Interfaces avanzadas mediante Drag & Drop (CDK) y encuestas dinámicas por IA con "polling" (reintentos automáticos tras confirmación del backend).
* **Diseño / UX (Emil Design)**: Fuerte dependencia en microanimaciones (`slideUp`, `spin`), botones interactivos, modales integrados en DOM sin recargas, y manejo neutral de mensajes (ej. recuperación de contraseñas).

### Estilo

* **Tailwind** \+ estilos por componente (SCSS donde exista).
* Diseño responsive.

### Capacitor

`capacitor.config.ts` define `appId`, `appName`, `webDir: 'dist'`. Tras `ng build`:

<!\[CDATA\[npx cap sync npx cap open ios npx cap open android\]\]>

### Documentación generada

[Compodoc en Vercel](https://book-match-docs.vercel.app/) (si el equipo lo mantiene).

---

**Actualización:** mayo 2026 — rutas actualizadas para cubrir módulos de Playlists, Analíticas, diseño Emil y rediseño de AI Chat.