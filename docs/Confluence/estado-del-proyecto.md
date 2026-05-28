# Estado del Proyecto

### Resumen técnico (mayo 2026)

* **Frontend:** Angular **21** (standalone, lazy routes).
* **Backend:** **Express 5**, TypeScript, Prisma, Firebase Admin, Stripe.
* **Documentación viva:** API y Endpoints, Módulos, `/api-docs` en el servidor.

### Funcionalidades mayormente implementadas

#### Autenticación y usuarios

* Firebase (email/contraseña y Google), sesión en cliente, **authGuard**.
* Sincronización usuario Firebase ↔ PostgreSQL en rutas con Bearer.
* Perfil, foto (Capacitor / web), Storage, actualización en Auth y BD.
* **Flujo de recuperación de contraseñas** totalmente implementado en la UI (Stripe-like).

#### Catálogo

* Home y detalle, categorías, paginación/búsqueda según UI actual.
* Reseñas donde estén cableadas en front + API.

#### Carrito y pagos

* Carrito con persistencia local, checkout Stripe (unidad y carrito), webhooks, órdenes y stock.

#### Foros

* Foros, posts, votos, comentarios anidados, imágenes, búsqueda/paginación según pantallas.

#### Pedidos

* Historial y detalle **desde la perspectiva de usuario** vía API (`GET /api/orders/history`, etc.); la API **no** expone un panel admin de pedidos completo en el sentido de “back-office”.

#### Backend transversal

* CORS con lista de orígenes, Helmet, rate limits, Zod, Winston, tests Jest en el repo.

#### Playlists e IA

* CRUD completo de Playlists (manuales y generadas por IA).
* Vistas públicas con exportación a JSON y Markdown.
* Pantalla **AI chat** rediseñada con panel lateral, memoria, drag-to-close y botón para convertir hilos en listas.
* Integración con n8n operativa (`N8N_WEBHOOK_URL`).

#### Analíticas

* Dashboard avanzado de analíticas web para admins (`Chart.js`).
* Integración real con GA4 Data API y Firebase Analytics.
* Data sintética generada localmente vía scripts de Python (`pandas`).

### Mejoras y deuda razonable

* **Trueque** automatizado y **recomendaciones** tipo descubrimiento: no como producto cerrado en la rama documentada.
* **Notificaciones push** móviles, **favoritos**, **chat tiempo real** usuario-a-usuario: pendientes / roadmap.
* **Panel admin** más allá de rutas que existan (p. ej. alta/edición de libros en Angular): ampliar según negocio.
* **Tests E2E** y más cobertura.
* **Hardening:** revisar política de `PATCH /api/users/:id` (auth sin `isAdmin`) y si `/api/ai-chat` debe exigir autenticación (ver **Autenticación y Seguridad**).

### Cómo mantener esta página

Tras cada sprint relevante, actualizar viñetas y enlazar **Jira** \+ entrada en **Changelog Reciente**.

---

**Actualización:** mayo 2026 — coherente con código y con páginas técnicas revisadas.