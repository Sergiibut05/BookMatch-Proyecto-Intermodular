# Frontend - Angular

### Resumen

Frontend **Angular 21** (standalone / `loadComponent`), **TypeScript \~5.9**, **Tailwind**, **RxJS**. Auth con **Firebase** en cliente; llamadas a la API con token Bearer vía servicios HTTP. **Capacitor 7** para empaquetado móvil. i18n con **@ngx-translate** — página hija Internacionalización.

### Estructura (`src/app/`)

<!\[CDATA\[core/ # guards, interceptors, servicios singleton (auth, API, etc.) shared/ # componentes y modelos reutilizables features/ # vistas por dominio: auth, home, catálogo, carrito, foros, perfil, ia, …\]\]>

### Rutas (`app.routes.ts`)

* `''` → `/auth/login`
* `auth/login`, `auth/register` — lazy `loadComponent`.
* **Con** `authGuard`: `home`, `admin/books/create`, `admin/books/edit/:id`, `categories`, `categories/:categoria`, `book-details/:id`, `cart`, `payment-success`, `profile`, `foro`, `foro/:id`, `foro/:forumId/tema/:postId`, `search-results`, `ai-chat`.
* **Públicas (sin guard):** políticas y pie de página — `privacy-policy`, `cookies-policy`, `refund-policy`, `terms-and-conditions`, `frequent-questions`, `payment-methods`, `about-us`.
* `**` → redirect a `/auth/login`.

El guard `authGuard` (`core/guards/auth.guard.ts`) es **asíncrono**: espera a `AuthService.user$` y, si no hay sesión, redirige a login con `returnUrl`.

### Servicios (patrones reales)

* **AuthService** — Firebase sign-in/out, observable de usuario, obtención de token para cabeceras.
* **CatalogService** — listados, filtros, detalle de libro (según implementación actual).
* **CartService** — estado del carrito (p. ej. signals) y operaciones añadir/quitar/cantidad.
* **PaymentService** — `createCheckoutSession(bookId, quantity?)`, `createCheckoutSessionCart(items)`, `redirectToCheckout(url)`, `getCheckoutSession(sessionId)`, `verifyPaymentSuccess(sessionId)` → llama a `GET .../payments/success?session_id=` en backend.
* **StorageService** — subida a Firebase Storage (avatars, etc.) si está en uso.
* **TranslationService** / **TranslateService** — idioma y claves i18n.

### Estilo

* **Tailwind** \+ estilos por componente (SCSS donde exista).
* Diseño responsive.

### Capacitor

`capacitor.config.ts` define `appId`, `appName`, `webDir: 'dist'`. Tras `ng build`:

<!\[CDATA\[npx cap sync npx cap open ios npx cap open android\]\]>

### Documentación generada

[Compodoc en Vercel](https://book-match-docs.vercel.app/) (si el equipo lo mantiene).

---

**Actualización:** abril 2026 — rutas y versiones alineadas con `app.routes.ts` y `package.json`; eliminadas rutas que no existen como paths de primer nivel (`profile-edit`, `purchase-history` pueden vivir dentro de otros componentes).