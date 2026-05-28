# Estado del Proyecto

### Resumen técnico (abr 2026)

* **Frontend:** Angular **21** (standalone, lazy routes).
* **Backend:** **Express 5**, TypeScript, Prisma, Firebase Admin, Stripe.
* **Documentación viva:** API y Endpoints, Módulos, `/api-docs` en el servidor.

### Funcionalidades mayormente implementadas

#### Autenticación y usuarios

* Firebase (email/contraseña y Google), sesión en cliente, **authGuard**.
* Sincronización usuario Firebase ↔ PostgreSQL en rutas con Bearer.
* Perfil, foto (Capacitor / web), Storage, actualización en Auth y BD.

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

#### IA (opcional)

* Pantalla **AI chat** y `POST /api/ai-chat/send-message` con proxy a **n8n** si hay `N8N_WEBHOOK_URL`; en caso contrario el backend responde **503**.

### Mejoras y deuda razonable

* **Trueque** automatizado y **recomendaciones** tipo descubrimiento: no como producto cerrado en la rama documentada.
* **Notificaciones push** móviles, **favoritos**, **chat tiempo real** usuario-a-usuario: pendientes / roadmap.
* **Panel admin** más allá de rutas que existan (p. ej. alta/edición de libros en Angular): ampliar según negocio.
* **Tests E2E** y más cobertura.
* **Hardening:** revisar política de `PATCH /api/users/:id` (auth sin `isAdmin`) y si `/api/ai-chat` debe exigir autenticación (ver **Autenticación y Seguridad**).

### Cómo mantener esta página

Tras cada sprint relevante, actualizar viñetas y enlazar **Jira** \+ entrada en **Changelog Reciente**.

---

**Actualización:** abril 2026 — coherente con código y con páginas técnicas revisadas.