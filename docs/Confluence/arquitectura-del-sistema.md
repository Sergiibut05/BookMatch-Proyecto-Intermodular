# Arquitectura del Sistema

### Arquitectura General

### Flujo de Autenticación

<!\[CDATA\[Usuario → Angular Frontend ↓ Firebase Auth (Email/Password o Google) ↓ Token JWT generado ↓ Backend valida token (Firebase Admin SDK) ↓ Sincronización Firebase User ↔ PostgreSQL User ↓ Acceso a rutas protegidas\]\]>

### Flujo de Pago

<!\[CDATA\[Usuario selecciona libro/carrito ↓ Frontend → Backend: Crear sesión Stripe ↓ Backend → Stripe: Crear Checkout Session ↓ Usuario redirigido a Stripe Checkout ↓ Usuario completa pago ↓ Stripe → Backend: Webhook (evento checkout.session.completed) ↓ Backend crea Order en PostgreSQL ↓ Backend actualiza stock de libros ↓ Backend envía email de confirmación (opcional) ↓ Usuario redirigido a /payment-success\]\]>

# Arquitectura del sistema: aplicación full-stack

Documentación técnica de la plataforma: aplicación **full-stack** pensada para web y móvil (Capacitor).

## 1\. Estructura de capas

| **Capa**               | **Responsabilidad principal**                   | **Tecnologías clave**                        |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- |
| **Cliente (frontend)** | UI y lógica en el navegador / WebView.          | **Angular 21** (standalone), **Capacitor 7** |
| **API backend**        | Reglas de negocio, persistencia, integraciones. | **Express 5**, **TypeScript**, **Node.js**   |
| **Base de datos**      | Persistencia relacional.                        | **PostgreSQL**, **Prisma ORM**               |
| **Servicios externos** | Auth, pagos, medios.                            | **Firebase**, **Stripe**, **Cloudinary**     |

## 2\. Detalle del cliente (frontend)

### A. Angular 21 (standalone)

* **Enfoque:** componentes **standalone**, lazy loading y menos acoplamiento que con `NgModule` clásico.
* **Organización típica:** `features/` (auth, catálogo, carrito, foros…), `shared/`, `core/` (servicios singleton, guards, interceptors).

### B. Capacitor 7 (móvil)

* Empaqueta la misma base Angular en apps nativas; acceso a cámara, almacenamiento local, etc.

## 3\. Detalle del API backend

* **Express 5 + TypeScript:** módulos por dominio bajo `src/modules/`; montaje central en `src/app.ts`.
* **Middleware:** `auth` (Bearer + Firebase Admin + sync usuario en BD), `validate` (Zod), rate limit (`/api/auth` más restrictivo), Helmet, CORS, logger, manejador de errores.
* **Webhook Stripe:** ruta `POST /api/payments/webhook` registrada con `express.raw` **antes** de `express.json()` para verificar la firma.
* **Documentación interactiva:** `/api-docs` (Swagger UI).
* **IA (opcional):** `POST /api/ai-chat/send-message` proxy a n8n si `N8N_WEBHOOK_URL` está definida (ver **API y Endpoints**).

## 4\. Base de datos y persistencia

| **Componente**           | **Descripción**                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **PostgreSQL**           | Motor relacional principal.                                                                   |
| **Prisma**               | Acceso tipado y migraciones.                                                                  |
| **Dominios principales** | Usuarios, catálogo (libros, categorías, reseñas), pedidos, foros (posts, comentarios, votos). |

## 5\. Servicios externos

| **Servicio**         | **Uso**                                                    |
| -------------------- | ---------------------------------------------------------- |
| **Firebase**         | Auth (cliente); verificación de tokens (Admin en backend). |
| **Stripe**           | Checkout y webhooks.                                       |
| **Cloudinary**       | Imágenes (donde aplique).                                  |
| **Google Books API** | Seeding / metadatos (ver página de seeding).               |

## 6\. Flujos críticos (resumen)

### A. Autenticación

1. El usuario inicia sesión en el cliente con Firebase.
2. El cliente envía el **ID token** en `Authorization: Bearer` a rutas protegidas.
3. El backend verifica el token y sincroniza el usuario en PostgreSQL si hace falta.

### B. Pago y pedido

1. El cliente pide crear sesión de Checkout al backend.
2. Redirección a Stripe; al completar, Stripe notifica vía **webhook**.
3. El backend crea el pedido, ajusta stock y el cliente vuelve al frontend (URLs de éxito/cancelación configurables en checkout).

---

**Nota:** Detalle de rutas HTTP en **Módulos y Funcionalidades** y **API y Endpoints** (auditoría abril 2026 frente al código).