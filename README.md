# 📚 BookMatch - Proyecto Intermodular

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Angular](https://img.shields.io/badge/Angular-20.3-red)
![Firebase](https://img.shields.io/badge/Firebase-11.10-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## 🎯 Descripción del Proyecto

**BookMatch** es una aplicación móvil y web que combina la compra de libros (nuevos y de segunda mano) con un sistema innovador de recomendaciones personalizadas mediante inteligencia artificial y una plataforma de trueque digital entre lectores.

La idea surge de la necesidad de fomentar la lectura y adaptarse a las nuevas tendencias de consumo sostenible, uniendo tres conceptos clave:
- 📖 **Lectura y cultura**
- 💻 **Digitalización**
- ♻️ **Economía circular**

---

## 🚀 Estado Actual del Proyecto

### ✅ Completado

#### Frontend (Angular)
- [x] Configuración inicial del proyecto Angular 20
- [x] Integración con Firebase Authentication
- [x] Integración con Firebase Realtime Database
- [x] Sistema de autenticación completo:
  - Login con email/contraseña
  - Registro de usuarios
  - Login con Google OAuth
  - Guards de protección de rutas
  - Persistencia de sesión con localStorage
- [x] Animación de carga (Splash Screen)
- [x] Estructura de carpetas escalable (core, shared, features)
- [x] Componentes standalone modernos
- [x] Diseño responsive y UI moderna con Tailwind CSS
- [x] Integración con backend API
- [x] Componente home con catálogo de libros

#### Backend (Node.js)
- [x] Configuración inicial Node.js + Express + TypeScript
- [x] Integración con Prisma ORM
- [x] PostgreSQL con Docker
- [x] Schema completo de base de datos:
  - User, CatalogBook, UserBook, Category, Order, OrderItem, Review
  - Relaciones many-to-many para categorías
- [x] Arquitectura Clean (routes → controllers → services → repositories)
- [x] API REST básica:
  - GET `/api/catalog` - Listar libros
  - GET `/api/catalog/:id` - Obtener libro por ID
  - POST `/api/catalog` - Crear libro (protegido)
- [x] Middleware de autenticación Firebase Admin
- [x] Script de seed con 150 libros de prueba
- [x] CORS configurado
- [x] Health check endpoint

### 🔄 En Progreso

- [ ] CRUD completo de libros (PUT, DELETE)
- [ ] Gestión de categorías
- [ ] Sincronización Firebase → PostgreSQL (usuarios)
- [ ] Sistema de trueque digital
- [ ] Sistema de recomendaciones con IA (n8n)
- [ ] Sistema de pedidos y pagos (Stripe/PayPal)
- [ ] Sistema de reseñas
- [ ] Comunidad lectora (foros)
- [ ] Perfil de usuario completo
- [ ] Sistema de notificaciones
- [ ] Validación de datos con express-validator

### 📅 Planificado

Ver el backlog completo en [Jira](https://tu-jira-url.atlassian.net)

---

## 🏗️ Arquitectura del Proyecto

```
BookMatch-Proyecto-Intermodular/
│
├── BookMatch-Angular/          # Frontend Web (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Servicios singleton, guards, interceptors
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts
│   │   │   │   └── services/
│   │   │   │       ├── auth.service.ts
│   │   │   │       └── catalog.service.ts
│   │   │   │
│   │   │   ├── shared/        # Componentes reutilizables
│   │   │   │   ├── components/
│   │   │   │   │   └── loader/
│   │   │   │   └── models/
│   │   │   │
│   │   │   ├── features/      # Módulos funcionales
│   │   │   │   ├── auth/      # Login y registro
│   │   │   │   ├── home/      # Dashboard principal
│   │   │   │   ├── books/     # (Próximamente)
│   │   │   │   ├── trueque/   # (Próximamente)
│   │   │   │   └── profile/   # (Próximamente)
│   │   │   │
│   │   │   └── app.routes.ts  # Configuración de rutas
│   │   │
│   │   └── environments/      # Variables de entorno
│   │
│   └── package.json
│
├── Node-Backend/              # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/            # Configuraciones (Prisma, etc.)
│   │   ├── controllers/       # Controladores HTTP
│   │   ├── database/          # Abstracción de BD
│   │   ├── middleware/       # Middlewares (auth, etc.)
│   │   ├── repositories/      # Acceso a datos
│   │   ├── routes/            # Definición de rutas REST
│   │   ├── services/          # Lógica de negocio
│   │   └── app.ts             # Punto de entrada
│   ├── prisma/
│   │   └── schema.prisma      # Schema de Prisma
│   ├── docker-compose.yml     # Docker para PostgreSQL
│   ├── .env.example           # Template de variables de entorno
│   └── README.md              # Documentación del backend
│
└── README.md                   # Este archivo
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 20.3** - Framework principal
- **TypeScript 5.9** - Lenguaje de programación
- **SCSS** - Preprocesador CSS
- **RxJS** - Programación reactiva

### Backend y Servicios
- **Node.js + Express** - Servidor REST API
- **TypeScript** - Lenguaje de programación
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional (Docker)
- **Firebase Authentication** - Gestión de usuarios
- **Firebase Admin SDK** - Verificación de tokens en el backend
- **n8n** - Automatización y recomendaciones IA (próximamente)

### Herramientas de Desarrollo
- **Angular CLI** - Herramientas de desarrollo
- **Git/GitHub** - Control de versiones
- **Jira** - Gestión de proyecto (Scrum)
- **Figma** - Diseño UI/UX
- **VS Code/Cursor** - Editor de código

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v20 o superior) - [Descargar](https://nodejs.org/)
- **npm** (v10 o superior) - Viene con Node.js
- **Angular CLI** - Se instalará con el proyecto
- **Git** - [Descargar](https://git-scm.com/)

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** (v20 o superior) - [Descargar](https://nodejs.org/)
- **npm** (v10 o superior) - Viene con Node.js
- **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop) (para PostgreSQL del backend)
- **Git** - [Descargar](https://git-scm.com/)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular.git
cd BookMatch-Proyecto-Intermodular
```

### 2. Configurar el Backend

```bash
cd Node-Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Copia .env.example a .env y edita los valores
cp .env.example .env  # Si existe, o créalo manualmente

# Iniciar PostgreSQL con Docker
docker-compose up -d

# Configurar Prisma
npx prisma generate
npx prisma db push
# Editar PostgreSql con Prisma Studio
$env:DATABASE_URL="postgresql://bookmatch_user:bookmatch_pass@localhost:5432/bookmatch_db?schema=public"; npx prisma studio


# (Opcional) Poblar datos de prueba
npm run seed:150

# Iniciar el servidor
npm run dev
```

El backend estará disponible en: `http://localhost:3000`

### 3. Configurar el Frontend

```bash
cd BookMatch-Angular

# Instalar dependencias
npm install

# Iniciar la aplicación
npm start
# o
ng serve
```

El frontend estará disponible en: `http://localhost:4200`

#### Modo Desarrollo con puerto personalizado
```bash
ng serve --port 4300
```

#### Build para Producción

**Frontend:**
```bash
cd BookMatch-Angular
npm run build
# o
ng build --configuration production
```

**Backend:**
```bash
cd Node-Backend
npm run build
npm start
```

Los archivos se generarán en `dist/` respectivo de cada proyecto

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm test
# o
ng test

# Ejecutar tests con coverage
ng test --code-coverage
```

---

## 📱 Funcionalidades Actuales

### 🔐 Autenticación
- ✅ Registro con email y contraseña
- ✅ Login con email y contraseña
- ✅ Login con Google OAuth
- ✅ Cierre de sesión
- ✅ Protección de rutas con Guards
- ✅ Validación de formularios reactivos
- ✅ Manejo de errores de Firebase

### 🎨 Interfaz
- ✅ Splash screen animado con libro 3D
- ✅ Diseño moderno con gradientes
- ✅ Formularios con validación en tiempo real
- ✅ Animaciones y transiciones suaves
- ✅ Tailwind CSS integrado
- ✅ Componente home con grid de libros

### 📚 Backend API
- ✅ API REST con Express
- ✅ Base de datos PostgreSQL con Prisma
- ✅ Autenticación Firebase Admin
- ✅ Endpoints de catálogo funcionando
- ✅ 150 libros de prueba disponibles

---

## 👥 Equipo de Desarrollo

| Rol | Responsabilidades |
|-----|-------------------|
| **Samuel** | Backend + QA + Scrum Master<br>• Responsable técnico del backend (API, trueque, BD)<br>• Documentación API (Swagger)<br>• QA técnico y gestión de tareas |
| **Lucas** | UX/UI Lead + Contenido Visual + QA Visual<br>• Diseño de interfaz en Figma<br>• Recursos gráficos<br>• Recomendaciones IA con n8n<br>• Apoyo frontend/backend |
| **Sergii** | Frontend Developer (Web + Mobile)<br>• Desarrollo web en Angular<br>• App móvil en Kotlin (Android Studio)<br>• Integración Firebase y API backend |

---

## 📊 Metodología de Trabajo

El proyecto sigue la metodología **Scrum** con sprints de **1 mes** de duración:

- **Sprint 1** ✅ - Configuración inicial del sistema y base de datos
- **Sprint 2** ✅ - Registro e inicio de sesión
- **Sprint 3** 🔄 - Catálogo básico de libros / Gestión de perfil
- **Sprint 4** 📅 - Sistema de trueque digital / Notificaciones
- **Sprint 5** 📅 - Sistema de recomendaciones IA / Comunidad lectora

---

## 🎯 Objetivos SMART

### 1. Lanzamiento del MVP funcional
- **S**: MVP con registro, compra y trueque
- **M**: Uso básico medido con testers
- **A**: Tecnologías disponibles (Firebase, Angular, Kotlin)
- **R**: Validar idea y fomentar lectura sostenible
- **T**: 3 meses

### 2. Sistema de recomendaciones IA
- **S**: Recomendaciones personalizadas basadas en IA
- **M**: Relevancia de sugerencias observada con testers
- **A**: Uso de n8n y análisis de datos
- **R**: Mejorar experiencia e impulsar economía circular
- **T**: 2 meses post-MVP

### 3. Comunidad lectora
- **S**: Foros, reseñas e intercambios
- **M**: Participación y ejemplos de interacciones
- **A**: Usuarios de prueba (compañeros/conocidos)
- **R**: Evaluar valor de función social
- **T**: 3 meses desde activación

---

## 🔧 Scripts Disponibles

### Frontend (BookMatch-Angular)

```bash
npm start              # Inicia servidor de desarrollo
ng serve               # Alternativa
npm run build          # Build para producción
npm test               # Tests unitarios
```

### Backend (Node-Backend)

```bash
npm run dev            # Inicia servidor con nodemon (auto-reload)
npm run build          # Compila TypeScript
npm start              # Ejecuta el build compilado
npm run seed:150       # Añade 150 libros de prueba
npx prisma studio      # Abre Prisma Studio (UI para BD)
```

---

## 🔧 Configuración Detallada del Backend

### Variables de Entorno

Crea el archivo `.env` en `Node-Backend/` con las siguientes variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookmatch_db
DB_USER=bookmatch_user
DB_PASSWORD=bookmatch_pass

# Prisma (formato específico)
DATABASE_URL="postgresql://bookmatch_user:bookmatch_pass@localhost:5432/bookmatch_db?schema=public"

# Firebase Admin SDK
FIREBASE_PROJECT_ID=bookmatch-522d5
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bookmatch-522d5.iam.gserviceaccount.com

# Opcional: n8n (para recomendaciones IA)
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=

# Opcional: Stripe (para pagos)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Opcional: Email (Gmail/Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

**⚠️ IMPORTANTE**: El archivo `.env` **NO** se sube a Git. Cada colaborador debe crear su propio `.env` local.

### Configuración de Firebase Admin

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: `bookmatch-522d5`
3. Configuración del proyecto ⚙️ → **Cuentas de servicio**
4. Haz clic en **"Generar nueva clave privada"**
5. Se descargará un archivo JSON con las credenciales
6. Abre el JSON y copia estos valores al `.env`:
   - **FIREBASE_PROJECT_ID**: `project_id` del JSON
   - **FIREBASE_PRIVATE_KEY**: `private_key` del JSON (incluye `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
   - **FIREBASE_CLIENT_EMAIL**: `client_email` del JSON

**Importante**: La clave privada tiene saltos de línea (`\n`). En el `.env`, escríbela entre comillas dobles o escapa los saltos de línea.

### Configuración de PostgreSQL con Docker

Cada colaborador tiene su propia instancia de PostgreSQL local usando Docker.

**Iniciar PostgreSQL:**
```bash
cd Node-Backend
docker-compose up -d
```

**Detener PostgreSQL:**
```bash
docker-compose down
```

**Ver los datos (Prisma Studio):**
```bash
npx prisma studio
```

**Ver logs de PostgreSQL:**
```bash
docker logs bookmatch-postgres
```

**⚠️ Nota**: Los datos se guardan en un volumen de Docker, así que no se pierden al detener el contenedor. Solo se perderían si ejecutas `docker-compose down -v` (que elimina los volúmenes).

### Estructura del Proyecto Backend

```
Node-Backend/
├── src/
│   ├── config/              # Configuraciones (Prisma client, etc.)
│   ├── controllers/         # Controladores (manejan HTTP)
│   ├── database/            # Abstracción de BD
│   │   ├── interfaces/     # Interfaces genéricas
│   │   └── implementations/ # Implementaciones específicas
│   ├── middleware/          # Middlewares (auth, validación, errores)
│   ├── models/              # Modelos de datos
│   ├── repositories/        # Acceso a datos (envuelve Prisma)
│   ├── routes/              # Definición de rutas REST
│   ├── services/            # Lógica de negocio
│   └── app.ts               # Punto de entrada
├── prisma/
│   ├── schema.prisma        # Schema de Prisma
│   └── migrations/          # Migraciones de BD
├── scripts/                 # Scripts útiles (seed, etc.)
├── docker-compose.yml       # Docker Compose para PostgreSQL
├── .env.example             # Template de variables de entorno
├── .gitignore
├── package.json
└── tsconfig.json
```

### Endpoints de la API

#### Públicos (sin autenticación)

- `GET /health` - Health check del servidor
- `GET /api/catalog` - Listar todos los libros del catálogo
- `GET /api/catalog/:id` - Obtener libro por ID

#### Protegidos (requieren autenticación)

- `POST /api/catalog` - Crear libro nuevo
  - Header requerido: `Authorization: Bearer <firebase_token>`

---

## 🐛 Solución de Problemas

### Error: Cannot find module '@angular/fire'
```bash
npm install firebase @angular/fire
```

### Error: Module resolution
Verifica que `tsconfig.json` tenga:
```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

### Error: Puerto ya en uso
```bash
ng serve --port 4300
```

### Backend: Error "Cannot connect to PostgreSQL"

1. Verifica que Docker esté corriendo:
   ```bash
   docker ps
   ```

2. Inicia PostgreSQL:
   ```bash
   cd Node-Backend
   docker-compose up -d
   ```

3. Verifica las variables de entorno en `.env`

### Backend: Error "Missing required environment variable: DATABASE_URL"

Asegúrate de tener `DATABASE_URL` en tu `.env`:
```env
DATABASE_URL="postgresql://bookmatch_user:bookmatch_pass@localhost:5432/bookmatch_db?schema=public"
```

### Backend: Error "Prisma Client not generated"

Ejecuta:
```bash
cd Node-Backend
npx prisma generate
```

### Backend: Error "Invalid Firebase token"

1. Verifica que las credenciales de Firebase Admin estén correctas en `.env`
2. Asegúrate de que el token del frontend sea válido
3. Verifica los logs del servidor para más detalles

### Frontend: Error Module resolution
Verifica que `tsconfig.json` tenga:
```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

### Error: Puerto ya en uso
```bash
ng serve --port 4300
```

---

## 📚 Recursos y Documentación

### Frontend
- [Angular Documentation](https://angular.dev)
- [RxJS Documentation](https://rxjs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Backend
- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### General
- [Firebase Documentation](https://firebase.google.com/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## 🤝 Contribuir

Este es un proyecto académico intermodular. Las contribuciones del equipo se coordinan a través de:

1. **Jira** - Gestión de tareas y sprints
2. **GitHub** - Control de versiones
3. **Discord** - Comunicación del equipo

### Workflow de Git


---

## 📝 Licencia

Este proyecto es parte de un trabajo académico intermodular.

---

## 📞 Contacto

Para más información sobre el proyecto:
- **Repositorio**: [BookMatch-Proyecto-Intermodular](https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular)

---

## ⭐ Agradecimientos

- Profesores y tutores del proyecto intermodular
- Beta testers

---

**Última actualización:** Noviembre 2025

**Versión:** 0.2.0 (Backend integrado - MVP en desarrollo)

---

## 📖 Documentación Adicional

- **Frontend**: Ver [BookMatch-Angular/README.md](./BookMatch-Angular/README.md) para documentación del frontend

