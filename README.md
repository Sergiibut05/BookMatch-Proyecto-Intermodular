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
- Automatización para poblar la base de datos con +1000 libros reales desde Google Books.

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
- **Google Books API Key** (necesaria solo si vas a ejecutar el script de seeding)

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
   GOOGLE_BOOKS_API_KEY="TU_API_KEY_AQUI"
   ```
   > Usa la URL proporcionada por Render para `DATABASE_URL`. No es necesario Docker en local.

2. Genera el cliente de Prisma y aplica migraciones (sobre la base remota):
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

3. Inicializar el Catálogo **(Solo primera vez):**
   Ejecuta este script **una única vez** al montar el proyecto para llenar la base de datos con el catálogo estático de libros.
   ```bash
   npx tsx seed.ts
   ```

4. Ejecuta el servidor:
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
- **Backend:** `.env` controla el puerto, `DATABASE_URL`, credenciales de Firebase Admin y `GOOGLE_BOOKS_API_KEY`: Necesaria solo para ejecutar `seed.ts`. No se versiona; cada colaborador debe crear el suyo.

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
npx tsx seed.ts      # Poblar base de datos (Requiere API Key)
```

---

## Guía de Setup y Seeding de Base de Datos

Esta guía detalla los pasos necesarios para configurar el entorno, instalar las dependencias y ejecutar el script de "seeding" (llenado de datos) que conecta con Google Books API e inserta 1000 libros en la base de datos PostgreSQL usando Prisma.

## ¿Qué hace el script de Seeding (`seed.ts`)?

Este script actúa como un **robot bibliotecario automatizado**. Su objetivo es poblar la base de datos desde cero, conectándose a una fuente externa (Google Books API) y mapeando los datos a la estructura relacional compleja de Prisma (`Category`, `CatalogBook`, `CatalogBookCategory`).

A continuación se detalla el flujo de ejecución paso a paso:

### 1. Sincronización de Categorías (Setup)
El script comienza leyendo una lista predefinida de categorías (con IDs fijos del 1 al 47).

* **Lógica `Upsert`:** Utiliza la función `upsert` de Prisma. Esto significa que **Actualiza** si la categoría ya existe o la **Inserta** si es nueva.
* **Integridad de Datos:** Garantiza que las categorías siempre tengan los mismos IDs (ej: "Terror" siempre será ID 1). Esto es vital para evitar errores en el frontend y mantener las relaciones Padre-Hijo intactas.

### 2. Búsqueda y Recolección (API de Google)
El script itera sobre cada categoría (excepto "Novedades") y realiza peticiones a la API de Google Books.

* **Query Inteligente:** Busca por temática específica (`subject:Fantasía`, `subject:Ciencia`).
* **Filtrado de Calidad (Data Hygiene):** No se guardan todos los resultados. El script descarta el libro si:
    * No tiene un **ISBN** válido (requerido por el esquema `CatalogBook` como `@unique`).
    * No tiene **Título** o **Autor**.
* **Normalización de Datos:**
    * **Imágenes:** Convierte enlaces `http` a `https` para evitar alertas de seguridad en el navegador.
    * **Precios Simulados:** Dado que la API de Google es una biblioteca (no una tienda), raramente devuelve precios. El script genera un **precio aleatorio (12.00€ - 45.00€)** y un stock aleatorio para permitir pruebas funcionales de carrito y checkout.

### 3. Persistencia en Base de Datos (Prisma)
Una vez procesados los datos en memoria, se guardan respetando las relaciones SQL:

1.  **Tabla `CatalogBook`:** Se guarda el libro. Si el ISBN ya existe (porque el libro aparece en dos categorías distintas), se reutiliza el registro existente en lugar de duplicarlo.
2.  **Tabla Intermedia `CatalogBookCategory`:** Se crea el vínculo explícito.
    * *Ejemplo:* "Vincular el Libro ID 505 con la Categoría ID 6".
3.  **Rate Limiting:** El script incluye pausas programadas (`setTimeout`) entre peticiones para evitar que Google bloquee la IP por exceso de tráfico.

### 4. La Lógica Especial de "Novedades" (ID 47)
La categoría "Novedades" no se busca en Google para evitar resultados irrelevantes. Se genera procedimentalmente al final del script:

1.  **Recolección:** El script selecciona los últimos **100 libros** que se acaban de insertar en la base de datos (de cualquier género).
2.  **Barajado (Shuffle):** Mezcla estos libros aleatoriamente.
3.  **Selección y Vinculación:** Toma 40 libros de esa mezcla y crea relaciones en `CatalogBookCategory` apuntando al `categoryId: 47`.
    * *Resultado:* La sección "Novedades" muestra una mezcla ecléctica y fresca de Fantasía, Historia, Thriller, etc.

### Resumen del Resultado
Al finalizar la ejecución (aprox. 2-3 minutos), la base de datos contiene:

* ✅ **45 Categorías** estructuradas jerárquicamente.
* ✅ **~1000 Libros** reales con metadatos completos.
* ✅ **Relaciones M:N** correctamente establecidas.
* ✅ **Datos de E-commerce** (Precios y Stock) listos para pruebas.

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

**Última actualización:** Noviembre 2025  
**Versión del documento:** 0.3.0 (Sprint MVP en curso)
