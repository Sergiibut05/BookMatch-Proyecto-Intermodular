# Módulos y Funcionalidades

### Nota de exactitud (Abril 2026)

Esta página está **alineada con el código** del backend en `BookMatch-Backend/src` (montajes en `app.ts` y routers bajo `modules/`). Si el API cambia, actualizar aquí y **Changelog Reciente**.

---

### Módulo de Autenticación (`/api/auth`)

**Contrato:** `POST` con JSON que incluye `idToken` (string, token de Firebase). No usa el header `Authorization`; ese se usa en el resto de rutas protegidas.

| Método | Ruta                      | Descripción                                                                      | Auth          |
| ------ | ------------------------- | -------------------------------------------------------------------------------- | ------------- |
| POST   | /api/auth/register        | Sincroniza/crea usuario en PostgreSQL tras validar el idToken con Firebase Admin | Body: idToken |
| POST   | /api/auth/login           | Valida token y devuelve datos de sesión/perfil según implementación              | Body: idToken |
| POST   | /api/auth/forgot-password | Recuperación de contraseña (email en body); respuesta genérica por seguridad     | Body: email   |

---

### Módulo de Usuarios (`/api/users`)

| Método | Ruta               | Descripción                                                              | Auth                                                    |
| ------ | ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| GET    | /api/users/me      | Perfil del usuario autenticado                                           | Bearer                                                  |
| PATCH  | /api/users/me      | Actualiza el **propio** perfil                                           | Bearer                                                  |
| GET    | /api/users/profile | Datos desde req.user (middleware); puede solaparse con /me en el cliente | Bearer                                                  |
| GET    | /api/users         | Lista usuarios                                                           | Bearer + **admin**                                      |
| GET    | /api/users/:id     | Usuario por ID                                                           | Bearer                                                  |
| PATCH  | /api/users/:id     | Actualiza usuario por ID                                                 | Bearer (**no exige admin en router**; revisar política) |
| DELETE | /api/users/:id     | Elimina usuario                                                          | Bearer + **admin**                                      |

---

### Módulo de Catálogo (`/api/catalog-books`)

Las rutas GET listadas requieren **Bearer** en el código actual.

| Método | Ruta                           | Descripción                                                                                                                         | Auth               |
| ------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| GET    | /api/catalog-books             | Lista: query page, limit, search, minPrice, maxPrice, minRating, categoryId, sortBy (newest, price\_asc, price\_desc, alphabetical) | Bearer             |
| GET    | /api/catalog-books/categories  | Categorías                                                                                                                          | Bearer             |
| GET    | /api/catalog-books/:id         | Detalle de libro                                                                                                                    | Bearer             |
| POST   | /api/catalog-books             | Crear libro                                                                                                                         | Bearer + **admin** |
| PATCH  | /api/catalog-books/:id         | Actualizar libro                                                                                                                    | Bearer + **admin** |
| DELETE | /api/catalog-books/:id         | Eliminar libro                                                                                                                      | Bearer + **admin** |
| POST   | /api/catalog-books/:id/reviews | Añadir reseña                                                                                                                       | Bearer             |
| DELETE | /api/catalog-books/reviews/:id | Borrar reseña por **ID de reseña**                                                                                                  | Bearer             |

---

### Módulo de Pagos (`/api/payments`)

Webhook registrado en `app.ts` **antes** de `express.json()`, cuerpo **raw** para firma Stripe.

| Método | Ruta                                       | Descripción                                                         | Auth       |
| ------ | ------------------------------------------ | ------------------------------------------------------------------- | ---------- |
| POST   | /api/payments/webhook                      | Eventos Stripe                                                      | No (firma) |
| POST   | /api/payments/create-checkout-session      | Checkout un libro; bookId, quantity opc., successUrl/cancelUrl opc. | Bearer     |
| POST   | /api/payments/create-checkout-session-cart | Carrito; items\[\], URLs opc.                                       | Bearer     |
| GET    | /api/payments/success                      | Query session\_id                                                   | Bearer     |
| GET    | /api/payments/session/:sessionId           | Detalle sesión                                                      | Bearer     |

---

### Módulo de Pedidos (`/api/orders`)

| Método | Ruta                | Descripción                                                               | Auth   |
| ------ | ------------------- | ------------------------------------------------------------------------- | ------ |
| POST   | /api/orders         | Crear pedido (esquema propio; distinto del flujo Stripe→Order en webhook) | Bearer |
| GET    | /api/orders/history | Historial del usuario                                                     | Bearer |

**No montado:** `GET /api/orders`, `GET /api/orders/:id`, `PATCH` pedidos.

---

### Foros, posts, comentarios, votos

**Foros** `/api/forums`: GET lista y GET por id **sin** auth en router; POST/PATCH/DELETE con Bearer.

**Posts** bajo `/api/forums/:forumId/posts`: GET sin auth; POST/PATCH/DELETE con Bearer. Parámetro de post en ruta: `:id`.

**Comentarios:** GET y POST en `/api/forums/:forumId/posts/:postId/comments` (GET sin auth). PATCH y DELETE en `/api/comments/:id` (Bearer).

**Votos:** POST, DELETE, GET en `/api/forums/:forumId/posts/:postId/votes` (GET lista el voto del usuario; requiere Bearer).

---

### IA / Chat (`/api/ai-chat`)

| Método | Ruta                      | Descripción                                                                                                            | Auth                                             |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| POST   | /api/ai-chat/send-message | Body: userId, conversationId, content. Firestore + webhook n8n (N8N\_WEBHOOK\_URL). **503** si webhook no configurado. | Sin auth en router; **endurecer en producción**. |

---

### Otros

* `GET /health` — salud del servicio.
* `GET /api-docs` — Swagger UI.

### Referencias

* **API y Endpoints** — convenciones HTTP y tabla pagos.
* **Sistema de Pagos con Stripe** — flujo detallado.
* **Changelog Reciente**.