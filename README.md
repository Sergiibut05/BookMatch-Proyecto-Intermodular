# 📚 BookMatch – Proyecto Intermodular

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Angular](https://img.shields.io/badge/Angular-20.3-red)
![Firebase](https://img.shields.io/badge/Firebase-11-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

---

## 🎯 Descripción

**BookMatch** es una plataforma web y móvil que combina compra de libros nuevos/usados con trueque digital y recomendaciones personalizadas. El MVP se centra en construir la base técnica: autenticación con Firebase, catálogo inicial y servicios backend listos para escalar.

---

## 🚦 Estado del Proyecto

### ✅ Entregado en este sprint
- Proyecto Angular 20 configurado con estructura `core / shared / features`.
- Autenticación completa con Firebase (email/contraseña y Google), persistencia de sesión y logout.
- Formularios reactivos para login y registro con validaciones y mensajes dinámicos.
- AuthGuard operativo y header reutilizable con contexto de usuario autenticado.
- Home con grid de libros consumiendo el backend protegido.
- Backend Express + TypeScript modularizado con middleware de seguridad, Swagger y Prisma.
- Esquema de datos para usuarios, categorías, libros y pedidos; endpoints `/api/catalog-books` y `/api/users` protegidos por token de Firebase.

### 🔄 En curso / siguientes pasos
- Vista de perfil básico y navegación extendida.
- Sincronización y pruebas integrales del flujo Firebase → backend.
- Refinar documentación técnica y casos de QA.

---

## 🗂️ Estructura del repositorio

```
BookMatch-Proyecto-Intermodular/
├── BookMatch-Angular/        # Frontend (Angular standalone)
│   └── src/app/
│       ├── core/             # Servicios singleton, guards
│       ├── shared/           # Componentes y modelos reutilizables
│       └── features/         # Login, registro, home, etc.
├── BookMatch-Backend/        # Backend (Express + Prisma)
│   ├── src/
│   │   ├── config/           # Env, Prisma, Swagger
│   │   ├── middleware/       # Auth, rate limiting, errores
│   │   └── modules/          # Auth, users, catalog-books
│   └── prisma/               # Esquema y migraciones
└── JiraTasks.md              # Propuestas de tareas para Jira
```

---

## 🧰 Requisitos previos

- Node.js 20.x (incluye npm 10) – [Descargar](https://nodejs.org/)
- Git – [Descargar](https://git-scm.com/)
- Cuenta de Firebase con acceso al proyecto `bookmatch-522d5`
- URL de la base de datos PostgreSQL (hosteada en Render para el equipo)

---

## 🚀 Puesta en marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular.git
cd BookMatch-Proyecto-Intermodular
```

### 2. Configurar el backend (`BookMatch-Backend`)

```bash
cd BookMatch-Backend
npm install
```

1. Crea un archivo `.env` (puedes basarte en `env.production.example`) con tus credenciales:
   ```env
   PORT=3000
   NODE_ENV=development

   DATABASE_URL="postgresql://USUARIO:PASS@HOST:PUERTO/DATABASE?schema=public"

   FIREBASE_PROJECT_ID=bookmatch-522d5
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bookmatch-522d5.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_EN_BASE64_ESCAPADA\n-----END PRIVATE KEY-----\n"
   ```
   > Usa la URL proporcionada por Render para `DATABASE_URL`. No es necesario Docker en local.

2. Genera el cliente de Prisma y aplica migraciones (sobre la base remota):
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

3. Ejecuta el servidor:
   ```bash
   npm run dev   # nodemon (recomendado en desarrollo)
   # o
   npm start     # requiere build previo con npm run build
   ```

   El backend quedará disponible en `http://localhost:3000`. La documentación Swagger está en `http://localhost:3000/api-docs`.

### 3. Configurar el frontend (`BookMatch-Angular`)

```bash
cd ../BookMatch-Angular
npm install
```

1. Verifica que `src/environments/environment.ts` tenga las credenciales de Firebase correctas. Si necesitas credenciales distintas, crea un archivo `.env.local` o modifica los entornos correspondientes.
2. Arranca el servidor de desarrollo:
   ```bash
   npm start        # alias de ng serve
   # o
   ng serve --port 4300
   ```

   La app se sirve en `http://localhost:4200`.

---

## 🔐 Variables clave

- **Frontend:** `environment.ts` y `environment.prod.ts` contienen la configuración de Firebase (apiKey, authDomain, etc.).
- **Backend:** `.env` controla el puerto, `DATABASE_URL` y credenciales de Firebase Admin. No se versiona; cada colaborador debe crear el suyo.

---

## 📡 Endpoints principales

| Método | Ruta                    | Descripción                      | Auth |
|--------|-------------------------|----------------------------------|------|
| GET    | `/health`               | Health check                     | ❌   |
| POST   | `/api/auth/register`    | Sincroniza usuario Firebase      | Token Firebase |
| POST   | `/api/auth/login`       | Valida y devuelve perfil básico  | Token Firebase |
| GET    | `/api/catalog-books`    | Lista catálogo de libros         | Token Firebase |
| POST   | `/api/catalog-books`    | Crea libro                       | Token Firebase |
| GET    | `/api/users/me`         | Perfil del usuario autenticado   | Token Firebase |

> El middleware `auth` valida el `Authorization: Bearer <idToken>` contra Firebase y sincroniza el usuario en PostgreSQL.

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

## 🔧 Scripts útiles

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
```

---

## 🗺️ Roadmap MVP

1. Configuración de base (repositorio, Firebase, PostgreSQL) ✅  
2. Registro e inicio de sesión con formularios reactivos ✅  
3. Catálogo inicial de libros y vista protegida 🔄  
4. Perfil de usuario y flujos de trueque ⏳  
5. Recomendaciones IA y pagos en iteraciones futuras ⏳

---

## 🤝 Contribución

- El equipo trabaja con Jira para la planificación de sprints.
- Usa ramas por feature (`feature/nombre`) y Pull Requests en GitHub.
- Documenta los cambios relevantes en `JiraTasks.md` cuando no exista ticket previo.

---

## 📞 Contacto

- Repositorio: [BookMatch-Proyecto-Intermodular](https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular)
- Proyecto Firebase: `bookmatch-522d5`

---

# 🚀 Guía de Setup y Seeding de Base de Datos

Esta guía detalla los pasos necesarios para configurar el entorno, instalar las dependencias y ejecutar el script de "seeding" (llenado de datos) que conecta con Google Books API e inserta 1000 libros en la base de datos PostgreSQL usando Prisma.

## 📋 1. Requisitos Previos

* **Node.js** instalado (v16 o superior).
* **PostgreSQL** corriendo y una base de datos creada.
* **Google Books API Key** válida.

## 🛠️ 2. Instalación de Dependencias

Ejecuta los siguientes comandos en la terminal dentro de la raíz del proyecto:

```bash
# 1. Iniciar proyecto (si no tienes package.json)
npm init -y

# 2. Instalar dependencias de producción
npm install @prisma/client axios dotenv slugify

# 3. Instalar dependencias de desarrollo
npm install -D prisma@6.18.0 typescript ts-node @types/node

# 4. Inicializar configuración de TypeScript
npx tsc --init
```
---

**Última actualización:** Noviembre 2025  
**Versión del documento:** 0.3.0 (Sprint MVP en curso)
