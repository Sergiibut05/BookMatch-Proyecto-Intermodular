# Instalación y Configuración

### 1\. Clonar el repositorio

<!\[CDATA\[git clone https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular.git cd BookMatch-Proyecto-Intermodular\]\]>

_(Si el remoto cambia, usar la URL del equipo.)_

### 2\. Backend (`BookMatch-Backend`)

#### 2.1\. Dependencias

<!\[CDATA\[cd BookMatch-Backend npm install\]\]>

#### 2.2\. Variables de entorno (`.env` en la raíz del backend)

El archivo **no se versiona**. En el repo hay un ejemplo mínimo en `env.production.example`; para desarrollo local necesitáis al menos lo que exige `src/config/env.ts` y Prisma:

**Obligatorias (backend arranca):**

<!\[CDATA\[PORT=3000 NODE\_ENV=development # Prisma — las dos suelen ser la misma URL en local DATABASE\_URL="postgresql://USUARIO:PASS@HOST:5432/DATABASE?schema=public" DIRECT\_URL="postgresql://USUARIO:PASS@HOST:5432/DATABASE?schema=public" FIREBASE\_PROJECT\_ID=tu-proyecto FIREBASE\_CLIENT\_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com FIREBASE\_PRIVATE\_KEY="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY----- " STRIPE\_SECRET\_KEY=sk\_test\_... FRONTEND\_URL=http://localhost:4200\]\]>

**Muy recomendable con Stripe webhooks:**

<!\[CDATA\[STRIPE\_WEBHOOK\_SECRET=whsec\_...\]\]>

**Opcional:**

<!\[CDATA\[N8N\_WEBHOOK\_URL=https://.../webhook/... # chat IA; si falta, el endpoint IA responde 503\]\]>

**Solo para ejecutar el seed (si aplica):**

<!\[CDATA\[GOOGLE\_BOOKS\_API\_KEY=... CLOUDINARY\_CLOUD\_NAME=... CLOUDINARY\_API\_KEY=... CLOUDINARY\_API\_SECRET=...\]\]>

> **Seguridad:** no pegar en Confluence ni en tickets claves reales de Firebase, Stripe ni la base de datos. Copiar valores solo en `.env` local o en el gestor de secretos del despliegue.

#### 2.3\. Stripe (test)

Dashboard → Developers → API keys: `STRIPE_SECRET_KEY` (backend) y clave publicable (frontend). Para webhooks, ver **Sistema de Pagos con Stripe** y **Deployment**.

#### 2.4\. Firebase Admin

Consola Firebase → Project settings → Service accounts → generar clave JSON; mapear a `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (saltos de línea como `` en `.env`).

#### 2.5\. Prisma

<!\[CDATA\[npx prisma generate npx prisma migrate dev # desarrollo: aplica y crea migraciones # o en CI/producción: # npx prisma migrate deploy\]\]>

#### 2.6\. Seeding (opcional)

<!\[CDATA\[npx tsx prisma/seed.ts\]\]>

Requiere `GOOGLE_BOOKS_API_KEY` y, si queréis subida de imágenes en el proceso, variables Cloudinary. Puede tardar bastante (rate limiting a la API). Detalle en la página **Estrategia de Seeding**.

#### 2.7\. Arranque

<!\[CDATA\[npm run dev # desarrollo (nodemon) npm run build && npm start # producción local\]\]>
* **API:** `http://localhost:3000/api`
* **Swagger:** `http://localhost:3000/api-docs`
* **Health:** `http://localhost:3000/health`

### 3\. Frontend (`BookMatch-Angular`)

#### 3.1\. Dependencias

<!\[CDATA\[cd ../BookMatch-Angular npm install\]\]>

#### 3.2\. Entorno (`src/environments/environment.ts`)

Configurar **objeto** `firebase` con los datos del **proyecto Firebase** (Consola → Project settings → Your apps). **No** copiar secretos del Admin SDK aquí (solo config pública del cliente).

<!\[CDATA\[export const environment = { production: false, firebase: { apiKey: '...', authDomain: '....firebaseapp.com', projectId: '...', storageBucket: '....appspot.com', messagingSenderId: '...', appId: '...', // ...resto según la consola }, stripePublishableKey: 'pk\_test\_...', apiUrl: 'http://localhost:3000/api' };\]\]>

#### 3.3\. Servidor de desarrollo

<!\[CDATA\[npm start # equivale a ng serve; por defecto http://localhost:4200\]\]>

---

**Actualización:** abril 2026 — variables según `env.ts` y `schema.prisma`; eliminación de credenciales públicas en la wiki; **Angular 21** en el frontend del monorepo.