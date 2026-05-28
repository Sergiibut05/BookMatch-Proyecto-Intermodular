# API y Endpoints

### Base URL

* **Desarrollo:** `http://localhost:3000/api` (puerto según `PORT` en `.env`).
* **Producción:** usar la URL pública real del backend (p. ej. despliegue en Vercel u otro). El valor `https://api.bookmatch.com/api` era solo **ejemplo**; sustituir por el host vigente.

### Autenticación

* **Rutas bajo** `/api/auth/*` (register, login, forgot-password): el cliente envía datos en el **cuerpo JSON** (p. ej. `idToken` de Firebase en register/login, `email` en forgot-password). **No** usan el patrón `Authorization: Bearer` en la implementación actual.
* **Resto de rutas protegidas:** header `Authorization: Bearer <firebase_id_token>`.
* **Webhook Stripe** `POST /api/payments/webhook`: sin Bearer; validación por firma `stripe-signature` y cuerpo **raw** (registrado en `app.ts` antes de `express.json()`).

### Formato de respuestas (real en el código)

No hay un envoltorio único `{ data, message }` en todos los endpoints. Lo habitual es:

* **Éxito:** JSON del recurso (objeto o array) o `{ sessionId, url }` en checkout, etc.
* **Error:** muchas rutas responden `{ "message": "..." }`; algunas añaden `errors` (Zod) o códigos Prisma en el mensaje.
* **204:** sin cuerpo (p. ej. borrado de usuario).

Para el contrato exacto por ruta, usar **Swagger** en `/api-docs` y la página **Módulos y Funcionalidades** (referencia de rutas alineada con el repo).

### Códigos de estado HTTP

| Código | Significado                                              |
| ------ | -------------------------------------------------------- |
| 200    | OK                                                       |
| 201    | Created                                                  |
| 204    | Sin contenido                                            |
| 400    | Validación / datos inválidos                             |
| 401    | No autenticado                                           |
| 403    | Sin permisos                                             |
| 404    | No encontrado                                            |
| 409    | Conflicto (p. ej. email duplicado)                       |
| 429    | Rate limit                                               |
| 500    | Error de servidor                                        |
| 503    | Servicio no disponible (p. ej. IA sin N8N\_WEBHOOK\_URL) |

### Rutas fuera del prefijo `/api` o especiales

| Método | Ruta                      | Notas                                                                                |
| ------ | ------------------------- | ------------------------------------------------------------------------------------ |
| GET    | /health                   | Salud del proceso                                                                    |
| GET    | /api-docs                 | Swagger UI                                                                           |
| POST   | /api/ai-chat/send-message | Chat/IA (Firestore + n8n); **sin** middleware auth en router — revisar en producción |

### Documentación interactiva

<!\[CDATA\[http://localhost:3000/api-docs\]\]>

Stack backend: **Express 5**, **TypeScript**, **Prisma**, **PostgreSQL** (ver `BookMatch-Backend/package.json`).

### Pagos — cuerpo de las peticiones (Abril 2026)

**POST** `/api/payments/create-checkout-session` (Bearer)

| Campo      | Obligatorio    | Descripción                                                                                     |
| ---------- | -------------- | ----------------------------------------------------------------------------------------------- |
| bookId     | Sí             | ID del libro                                                                                    |
| quantity   | No (default 1) | Cantidad                                                                                        |
| successUrl | No             | Tras pago OK; por defecto FRONTEND\_URL \+ /payment-success?session\_id={CHECKOUT\_SESSION\_ID} |
| cancelUrl  | No             | Cancelación; por defecto FRONTEND\_URL \+ /book-details/{id}                                    |

**POST** `/api/payments/create-checkout-session-cart` — `items[]` obligatorio; opcionales `successUrl` y `cancelUrl` (cancel por defecto: `FRONTEND_URL` \+ `/home`).

**GET** `/api/payments/success` — query `session_id` (no path param).

Más detalle: **Sistema de Pagos con Stripe**, **Changelog Reciente**, y `payments.routes.ts` en el repo.

### Referencia de todas las rutas

Ver página **Módulos y Funcionalidades** (tablas actualizadas frente a `BookMatch-Backend/src/app.ts` y routers).