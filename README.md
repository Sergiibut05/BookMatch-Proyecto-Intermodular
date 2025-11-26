# 📚 BookMatch – Proyecto Intermodular

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Angular](https://img.shields.io/badge/Angular-20.3-red)
![Firebase](https://img.shields.io/badge/Firebase-11-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Stripe](https://img.shields.io/badge/Stripe-Integrado-purple)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4-blue)

---

## 🎯 Descripción

**BookMatch** es una plataforma web y móvil que combina compra de libros nuevos/usados con trueque digital y recomendaciones personalizadas. El MVP se centra en construir la base técnica: autenticación con Firebase, catálogo inicial, sistema de pagos con Stripe, gestión de perfil de usuario con fotos, y servicios backend listos para escalar.

---

## 🚦 Estado del Proyecto

### ✅ Funcionalidades Implementadas

#### Autenticación y Usuarios
- ✅ Autenticación completa con Firebase (email/contraseña y Google)
- ✅ Persistencia de sesión y logout
- ✅ Formularios reactivos para login y registro con validaciones
- ✅ AuthGuard operativo y header reutilizable
- ✅ **Perfil de usuario con gestión de foto de perfil**
  - Subida de fotos usando Capacitor (móvil) o input file (web)
  - Almacenamiento en Firebase Storage
  - Actualización automática en Firebase Auth y base de datos
  - Eliminación automática de fotos antiguas al cambiar

#### Catálogo de Libros
- ✅ Home con grid de libros consumiendo el backend protegido
- ✅ Vista de detalles de libro con imágenes, precio, stock, categorías
- ✅ Filtrado por categorías
- ✅ Paginación de resultados
- ✅ Sistema de reseñas (estructura implementada)

#### Sistema de Pagos
- ✅ **Integración completa con Stripe Checkout**
  - Pago directo de libros individuales
  - Soporte para múltiples métodos: Card, Link, PayPal
  - Dirección de envío obligatoria (países configurados)
  - Modo de prueba (test mode) configurado
  - Creación automática de órdenes en base de datos
  - Actualización automática de stock
  - Página de confirmación de pago
  - Preparado para carrito (estructura lista, pendiente de implementar)

#### Backend
- ✅ Backend Express + TypeScript modularizado
- ✅ Middleware de seguridad (auth, rate limiting, CORS, Helmet)
- ✅ Swagger/OpenAPI para documentación interactiva
- ✅ Prisma ORM con PostgreSQL
- ✅ Esquema de datos completo: usuarios, categorías, libros, pedidos, reseñas
- ✅ Endpoints protegidos con tokens de Firebase
- ✅ Sistema de logging con Winston
- ✅ Manejo de errores centralizado

### 🔄 En Curso / Próximos Pasos
- ⏳ Implementación de carrito de compras
- ⏳ Sistema de envío de correos de confirmación
- ⏳ Vista de historial de pedidos
- ⏳ Refinamiento de UI/UX
- ⏳ Tests E2E

---

## 🗂️ Estructura del Repositorio

```
BookMatch-Proyecto-Intermodular/
├── BookMatch-Angular/              # Frontend (Angular standalone)
│   └── src/app/
│       ├── core/                   # Servicios singleton, guards
│       │   ├── guards/
│       │   │   └── auth.guard.ts
│       │   └── services/
│       │       ├── auth.service.ts
│       │       ├── catalog.service.ts
│       │       ├── payment.service.ts    # Servicio de pagos Stripe
│       │       ├── storage.service.ts    # Servicio de Firebase Storage
│       │       └── users.service.ts       # Servicio de usuarios
│       ├── shared/                 # Componentes y modelos reutilizables
│       │   ├── components/
│       │   │   ├── header/
│       │   │   ├── footer/
│       │   │   ├── carousel/
│       │   │   └── loader/
│       │   └── models/
│       │       ├── catalog.model.ts
│       │       └── api.model.ts
│       └── features/               # Módulos de funcionalidad
│           ├── auth/               # Login y registro
│           ├── home/               # Página principal con catálogo
│           ├── book-details/       # Detalles de libro
│           ├── categories/          # Vista por categorías
│           ├── payment-success/     # Confirmación de pago
│           └── profile/             # Perfil de usuario con foto
├── BookMatch-Backend/              # Backend (Express + Prisma)
│   ├── src/
│   │   ├── config/                 # Env, Prisma, Swagger
│   │   ├── middleware/             # Auth, rate limiting, errores
│   │   ├── modules/                # Módulos de negocio
│   │   │   ├── auth/               # Autenticación Firebase
│   │   │   ├── users/              # Gestión de usuarios
│   │   │   ├── catalog-books/      # Catálogo de libros
│   │   │   └── payments/           # Integración con Stripe
│   │   │       ├── payments.service.ts
│   │   │       ├── payments.controller.ts
│   │   │       ├── payments.routes.ts
│   │   │       └── payments.schema.ts
│   │   └── utils/                  # Utilidades (logger, firebaseAdmin)
│   └── prisma/                     # Esquema y migraciones
└── README.md                       # Este archivo
```

---

## 🧰 Requisitos Previos

- **Node.js 20.x** (incluye npm 10) – [Descargar](https://nodejs.org/)
- **Git** – [Descargar](https://git-scm.com/)
- **Cuenta de Firebase** con acceso al proyecto `bookmatch-522d5`
- **URL de la base de datos PostgreSQL** (hosteada en Render para el equipo)
- **Cuenta de Stripe** (para pagos) – [Crear cuenta](https://stripe.com)

---

## 🚀 Puesta en Marcha

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular.git
cd BookMatch-Proyecto-Intermodular
```

### 2. Configurar el Backend (`BookMatch-Backend`)

```bash
cd BookMatch-Backend
npm install
```

#### 2.1. Crear archivo `.env`

Crea un archivo `.env` en la raíz del backend (puedes basarte en `env.production.example`):

```env
# Configuración básica
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DATABASE_URL="postgresql://USUARIO:PASS@HOST:PUERTO/DATABASE?schema=public"

# Firebase Admin SDK
FIREBASE_PROJECT_ID=bookmatch-522d5
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bookmatch-522d5.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_EN_BASE64_ESCAPADA\n-----END PRIVATE KEY-----\n"

# Stripe (TEST MODE - obtener de https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...  # Opcional en desarrollo
FRONTEND_URL=http://localhost:4200
```

> **Nota:** Usa la URL proporcionada por Render para `DATABASE_URL`. No es necesario Docker en local.

#### 2.2. Configurar Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Asegúrate de estar en **modo Test** (toggle en la parte superior)
3. Ve a **Developers → API keys**
4. Copia:
   - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY` en `.env`
   - **Publishable key** (`pk_test_...`) → se usará en el frontend

#### 2.3. Generar Prisma Client y Aplicar Migraciones

```bash
npx prisma generate
npx prisma migrate deploy
```

#### 2.4. Ejecutar el Servidor

```bash
npm run dev   # nodemon (recomendado en desarrollo)
# o
npm start     # requiere build previo con npm run build
```

El backend quedará disponible en `http://localhost:3000`. La documentación Swagger está en `http://localhost:3000/api-docs`.

### 3. Configurar el Frontend (`BookMatch-Angular`)

```bash
cd ../BookMatch-Angular
npm install
```

#### 3.1. Configurar Variables de Entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
    production: false,
    firebase: {
        apiKey: "AIzaSyBh8yIwyt8pAxG_jj3nx8Y8vDnKnrPsV14",
        authDomain: "bookmatch-522d5.firebaseapp.com",
        projectId: "bookmatch-522d5",
        storageBucket: "bookmatch-522d5.firebasestorage.app",
        messagingSenderId: "735953151639",
        appId: "1:735953151639:web:35092cd2fa7015d06f2bd2",
        databaseURL: "https://bookmatch-522d5-default-rtdb.europe-west1.firebasedatabase.app",
        measurementId: "G-YD2T0NCDTC"
    },
    // Stripe (TEST MODE - usar la Publishable key de Stripe)
    stripePublishableKey: 'pk_test_51...',
    apiUrl: 'http://localhost:3000/api'
};
```

> **Importante:** Reemplaza `stripePublishableKey` con tu clave pública de prueba de Stripe.

#### 3.2. Arrancar el Servidor de Desarrollo

```bash
npm start        # alias de ng serve
# o
ng serve --port 4300
```

La app se sirve en `http://localhost:4200`.

---

## 🔐 Variables Clave

### Frontend (`environment.ts` / `environment.prod.ts`)
- **Firebase:** Configuración completa de Firebase (Auth, Storage, Database)
- **Stripe:** `stripePublishableKey` - Clave pública de Stripe (modo test o live)
- **API:** `apiUrl` - URL del backend

### Backend (`.env`)
- **DATABASE_URL:** URL de conexión a PostgreSQL
- **FIREBASE_***:** Credenciales de Firebase Admin SDK
- **STRIPE_SECRET_KEY:** Clave secreta de Stripe (modo test o live)
- **STRIPE_WEBHOOK_SECRET:** Secret para verificar webhooks (opcional en desarrollo)
- **FRONTEND_URL:** URL del frontend para redirecciones de Stripe

> ⚠️ **Importante:** El archivo `.env` NO se versiona. Cada colaborador debe crear el suyo.

---

## 📡 Endpoints Principales

### Autenticación
| Método | Ruta                    | Descripción                      | Auth |
|--------|-------------------------|----------------------------------|------|
| POST   | `/api/auth/register`    | Sincroniza usuario Firebase      | Token Firebase |
| POST   | `/api/auth/login`       | Valida y devuelve perfil básico  | Token Firebase |

### Usuarios
| Método | Ruta                    | Descripción                      | Auth |
|--------|-------------------------|----------------------------------|------|
| GET    | `/api/users/me`         | Perfil del usuario autenticado   | ✅   |
| PATCH  | `/api/users/me`         | Actualizar perfil (nombre, email, avatar, teléfono) | ✅   |
| GET    | `/api/users`            | Lista todos los usuarios         | ✅   |
| GET    | `/api/users/:id`        | Obtener usuario por ID          | ✅   |
| PATCH  | `/api/users/:id`        | Actualizar usuario              | ✅   |
| DELETE | `/api/users/:id`        | Eliminar usuario                 | ✅   |

### Catálogo de Libros
| Método | Ruta                    | Descripción                      | Auth |
|--------|-------------------------|----------------------------------|------|
| GET    | `/api/catalog-books`    | Lista catálogo (paginado, filtros por categoría) | ✅   |
| GET    | `/api/catalog-books/:id`| Obtener libro por ID             | ✅   |
| POST   | `/api/catalog-books`    | Crear libro                      | ✅   |
| PATCH  | `/api/catalog-books/:id`| Actualizar libro                 | ✅   |
| DELETE | `/api/catalog-books/:id`| Eliminar libro                   | ✅   |

### Pagos (Stripe)
| Método | Ruta                                    | Descripción                      | Auth |
|--------|-----------------------------------------|----------------------------------|------|
| POST   | `/api/payments/create-checkout-session` | Crea sesión de pago para un libro | ✅   |
| POST   | `/api/payments/create-checkout-session-cart` | Crea sesión para carrito (preparado) | ✅   |
| POST   | `/api/payments/webhook`                 | Webhook de Stripe (sin auth)     | ❌   |
| GET    | `/api/payments/success`                 | Verifica pago y crea Order       | ✅   |
| GET    | `/api/payments/session/:sessionId`      | Obtiene detalles de sesión       | ✅   |

### Utilidades
| Método | Ruta                    | Descripción                      | Auth |
|--------|-------------------------|----------------------------------|------|
| GET    | `/health`               | Health check                     | ❌   |
| GET    | `/api-docs`             | Documentación Swagger            | ❌   |

> El middleware `auth` valida el `Authorization: Bearer <idToken>` contra Firebase y sincroniza el usuario en PostgreSQL.

---

## 💳 Sistema de Pagos con Stripe

### Características Implementadas

- ✅ **Stripe Checkout** - Página de pago alojada por Stripe
- ✅ **Múltiples métodos de pago:** Card, Link, PayPal
- ✅ **Dirección de envío obligatoria** - Configurada para múltiples países
- ✅ **Modo de prueba** - Usa tarjetas de prueba sin cobrar dinero real
- ✅ **Creación automática de órdenes** - Se crean en la BD después del pago
- ✅ **Actualización de stock** - El stock se decrementa automáticamente
- ✅ **Preparado para carrito** - Estructura lista, pendiente de implementar

### Tarjetas de Prueba

Para probar pagos en modo test, usa estas tarjetas:

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 0002` | ❌ Pago rechazado |
| `4000 0025 0000 3155` | 🔐 Requiere 3D Secure |

**Datos de prueba:**
- Cualquier fecha futura (ej: `12/25`)
- Cualquier CVC (ej: `123`)
- Cualquier código postal (ej: `12345`)

### Flujo de Pago

```
1. Usuario hace clic "Comprar con Stripe" en detalles del libro
   ↓
2. Frontend → Backend: Crea sesión de checkout
   ↓
3. Backend → Stripe: Crea sesión con datos del libro (nombre, precio, foto)
   ↓
4. Frontend redirige a Stripe Checkout
   ↓
5. Usuario ingresa datos de pago y dirección de envío
   ↓
6. Stripe procesa el pago (modo test: no cobra dinero real)
   ↓
7. Stripe redirige a /payment-success
   ↓
8. Backend verifica pago y crea Order en BD
   ↓
9. Backend actualiza stock del libro
```

### Webhooks (Opcional en Desarrollo)

Para desarrollo local, puedes usar **Stripe CLI** para reenviar webhooks:

```bash
# Instalar Stripe CLI
# Windows: https://stripe.com/docs/stripe-cli
# Mac: brew install stripe/stripe-cli/stripe

# Autenticarse
stripe login

# Iniciar listener
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Esto te dará un `webhook secret` que puedes añadir a tu `.env`.

> **Nota:** Sin Stripe CLI, el sistema funciona igual. La Order se crea cuando el usuario regresa de Stripe (fallback implementado).

---

## 👤 Gestión de Perfil de Usuario

### Características Implementadas

- ✅ **Vista de perfil** - Muestra información del usuario
- ✅ **Foto de perfil circular** - Con icono por defecto si no hay foto
- ✅ **Cambio de foto** - Usando Capacitor (móvil) o input file (web)
- ✅ **Almacenamiento en Firebase Storage** - Fotos guardadas en `avatars/`
- ✅ **Actualización automática** - Se actualiza en Firebase Auth y BD
- ✅ **Eliminación de fotos antiguas** - Se eliminan automáticamente al cambiar

### Flujo de Cambio de Foto

```
1. Usuario hace clic en botón de cámara sobre la foto
   ↓
2. Capacitor abre cámara/galería (móvil) o input file (web)
   ↓
3. Usuario selecciona/toma foto
   ↓
4. Foto se sube a Firebase Storage (carpeta avatars/)
   ↓
5. Se obtiene URL de descarga
   ↓
6. Se actualiza photoURL en Firebase Auth
   ↓
7. Se actualiza avatarUrl en la BD (PostgreSQL)
   ↓
8. Se elimina foto anterior de Firebase Storage (si existe)
```

### Tecnologías Usadas

- **Capacitor Camera** - Para tomar fotos en móvil
- **Firebase Storage** - Para almacenar imágenes
- **Firebase Auth** - Para actualizar photoURL del usuario
- **PostgreSQL** - Para guardar avatarUrl en la BD

### Permisos Necesarios

En móvil, Capacitor pedirá automáticamente permisos de cámara cuando sea necesario.

---

## 🧪 Testing

```bash
# Frontend (Angular)
cd BookMatch-Angular
ng test

# Backend (Express)
cd BookMatch-Backend
npm test           # Jest
```

---

## 🔧 Scripts Útiles

### Frontend
```bash
npm start            # Desarrollo
npm run build        # Build producción
ng test              # Tests unitarios
```

### Backend
```bash
npm run dev          # Desarrollo con nodemon
npm run build        # Compila a dist/
npm start            # Ejecuta la build
npx prisma studio    # Interfaz visual de la base de datos
npx prisma migrate dev # Crear nueva migración
npx prisma generate  # Regenerar Prisma Client
```

---

## 📦 Dependencias Principales

### Frontend
- `@angular/core` ^20.3.0 - Framework Angular
- `@angular/fire` ^20.0.1 - Integración con Firebase
- `@stripe/stripe-js` ^8.5.3 - SDK de Stripe
- `@capacitor/core` ^7.4.4 - Capacitor (aplicaciones móviles)
- `@capacitor/camera` ^7.0.2 - Plugin de cámara
- `firebase` ^11.10.0 - SDK de Firebase
- `rxjs` ~7.8.0 - Programación reactiva

### Backend
- `express` ^5.1.0 - Framework web
- `@prisma/client` ^6.18.0 - ORM Prisma
- `stripe` - SDK de Stripe
- `firebase-admin` ^13.6.0 - Firebase Admin SDK
- `zod` ^4.1.12 - Validación de esquemas
- `winston` ^3.18.3 - Sistema de logging
- `helmet` ^8.1.0 - Seguridad HTTP
- `express-rate-limit` ^8.2.1 - Rate limiting

---

## 🗺️ Roadmap MVP

1. ✅ Configuración de base (repositorio, Firebase, PostgreSQL)  
2. ✅ Registro e inicio de sesión con formularios reactivos  
3. ✅ Catálogo inicial de libros y vista protegida  
4. ✅ **Sistema de pagos con Stripe**  
5. ✅ **Gestión de perfil de usuario con fotos**  
6. 🔄 Carrito de compras  
7. ⏳ Sistema de envío de correos  
8. ⏳ Vista de historial de pedidos  
9. ⏳ Perfil de usuario y flujos de trueque  
10. ⏳ Recomendaciones IA en iteraciones futuras

---

## 🔒 Seguridad

### Implementado
- ✅ Autenticación con Firebase (JWT tokens)
- ✅ Middleware de autenticación en todas las rutas protegidas
- ✅ Rate limiting para prevenir abusos
- ✅ Helmet para headers de seguridad HTTP
- ✅ CORS configurado
- ✅ Validación de datos con Zod
- ✅ Logging de errores con Winston
- ✅ Variables de entorno para secretos
- ✅ Firebase Storage rules (configurar según necesidades)

### Firebase Storage Rules (Recomendadas)

Configura en Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}_{allPaths=**} {
      // Solo el usuario puede subir/eliminar su propia foto
      allow read: if true; // Fotos públicas
      allow write: if request.auth != null && 
                      request.auth.uid == userId.split('_')[0];
    }
  }
}
```

---

## 🤝 Contribución

- El equipo trabaja con Jira para la planificación de sprints.
- Usa ramas por feature (`feature/nombre`) y Pull Requests en GitHub.
- Documenta los cambios relevantes cuando no exista ticket previo.
- Sigue las convenciones de código establecidas.

---

## 📞 Contacto y Recursos

- **Repositorio:** [BookMatch-Proyecto-Intermodular](https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular)
- **Proyecto Firebase:** `bookmatch-522d5`
- **Documentación Swagger:** `http://localhost:3000/api-docs` (cuando el backend está corriendo)
- **Stripe Dashboard:** [dashboard.stripe.com](https://dashboard.stripe.com)

---

## 📝 Changelog Reciente

### Noviembre 2025

#### Sistema de Pagos con Stripe
- ✅ Integración completa de Stripe Checkout
- ✅ Soporte para Card, Link y PayPal
- ✅ Dirección de envío obligatoria
- ✅ Creación automática de órdenes
- ✅ Actualización automática de stock
- ✅ Página de confirmación de pago
- ✅ Modo de prueba configurado

#### Gestión de Perfil
- ✅ Componente de perfil implementado
- ✅ Subida de fotos con Capacitor
- ✅ Integración con Firebase Storage
- ✅ Actualización en Firebase Auth y BD
- ✅ Eliminación automática de fotos antiguas

#### Mejoras Generales
- ✅ Servicios modulares y reutilizables
- ✅ Manejo de errores mejorado
- ✅ UI/UX mejorada con Tailwind CSS
- ✅ Documentación actualizada

---

**Última actualización:** Noviembre 2025  
**Versión del documento:** 1.0.0 (MVP con pagos y perfil)
