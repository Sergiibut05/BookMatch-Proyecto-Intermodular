# Changelog

## v1.0.0 - Producción y documentación

### Añadido
- Documentación OpenAPI/Swagger completa
- Swagger UI disponible en /api-docs
- Dockerfile optimizado con multi-stage build
- docker-compose.prod.yml para deployment
- .dockerignore para builds eficientes
- env.production.example con variables para producción
- Health checks en Docker Compose
- Restart policy para contenedores

### Documentación Swagger
- Especificación OpenAPI 3.0.0
- Todos los endpoints documentados
- Schemas de request/response
- Autenticación JWT configurada
- Tags para organización
- Ejemplos de uso

### Docker
- **Dockerfile multi-stage**:
  - Stage 1 (builder): Instalación y compilación
  - Stage 2 (production): Imagen optimizada
- **Imagen base**: node:20-alpine
- **Usuario no-root**: Ejecución como usuario `node`
- **dumb-init**: Manejo correcto de señales
- **Prisma client**: Incluido en imagen final

### Docker Compose Producción
- Servicio PostgreSQL 16 con health checks
- Servicio API con restart automático
- Network privada para servicios
- Volúmenes persistentes
- Variables de entorno configurables
- Dependencias entre servicios

### Archivos creados
- `src/config/swagger.ts` - Configuración OpenAPI
- `Dockerfile` - Imagen Docker optimizada
- `.dockerignore` - Exclusiones de build
- `docker-compose.prod.yml` - Orquestación producción
- `env.production.example` - Variables de entorno

### Archivos modificados
- `src/app.ts` - Integración Swagger UI
- `package.json` - Nuevas dependencias

### Dependencias nuevas
- `swagger-ui-express` - UI para documentación
- `swagger-jsdoc` - Generación de spec OpenAPI
- `@types/swagger-ui-express` - Tipos TypeScript
- `@types/swagger-jsdoc` - Tipos TypeScript

### Endpoints
- `GET /api-docs` - Documentación Swagger UI interactiva
- `GET /health` - Health check (sin auth)

### Deployment Docker
```bash
docker build -t api-express .
docker-compose -f docker-compose.prod.yml up -d
```

### Seguridad en producción
- NODE_ENV=production
- Helmet con CSP deshabilitado solo para Swagger
- Secrets via variables de entorno
- Usuario no-root en contenedor
- Health checks para disponibilidad

---

## v0.9.0 - Testing con Jest y Supertest

### Añadido
- Jest configurado para TypeScript y ES modules
- Supertest para tests de integración HTTP
- Tests completos para módulo Auth (registro y login)
- Tests completos para módulo Users (CRUD y perfil)
- Scripts de test: test, test:watch, test:coverage
- Cobertura de código con Jest

### Tests implementados

#### Auth Tests (src/tests/auth.test.ts)
- ✓ Registro de nuevo usuario exitoso
- ✓ Fallo con email duplicado
- ✓ Validación de email inválido
- ✓ Validación de contraseña corta
- ✓ Validación de nombre corto
- ✓ Login exitoso
- ✓ Fallo con contraseña incorrecta
- ✓ Fallo con email inexistente

#### Users Tests (src/tests/users.test.ts)
- ✓ Listar usuarios con autenticación
- ✓ Fallo sin autenticación
- ✓ Fallo con token inválido
- ✓ Obtener perfil del usuario autenticado (/me)
- ✓ Actualizar perfil propio
- ✓ Cambiar contraseña con validación
- ✓ Fallo al cambiar contraseña con contraseña actual incorrecta
- ✓ Obtener usuario por ID
- ✓ Fallo con ID inexistente

### Configuración Jest
- Preset: `ts-jest/presets/default-esm`
- Soporte para ES modules con TypeScript
- Test environment: node
- Coverage en carpeta `coverage/`

### Testing en modo test
- Rate limiting deshabilitado en NODE_ENV=test
- Logger configurado para test
- Tests aislados con usuarios únicos por test

### Dependencias nuevas
- `jest` - Framework de testing
- `ts-jest` - Preset TypeScript para Jest
- `@types/jest` - Tipos para Jest
- `supertest` - Testing HTTP
- `@types/supertest` - Tipos para Supertest

### Scripts nuevos
```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Tests en modo watch
npm run test:coverage # Tests con reporte de cobertura
```

### Archivos creados
- `jest.config.js` - Configuración Jest
- `src/tests/auth.test.ts` - Tests de autenticación
- `src/tests/users.test.ts` - Tests de usuarios

### Archivos modificados
- `src/app.ts` - Deshabilitar rate limiting en tests
- `package.json` - Scripts de testing
- `.gitignore` - Añadido *.tsbuildinfo

### Resultado de tests
```
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
```

---

## v0.8.0 - Seguridad adicional (rate limiting y logging)

### Añadido
- Rate limiting global (100 requests por 15 minutos)
- Rate limiting para autenticación (5 intentos por 15 minutos)
- Logger Winston con niveles (error, warn, info, http, debug)
- Logs en archivos (logs/all.log y logs/error.log)
- Middleware de logging de requests personalizado
- Límite de tamaño de payload JSON (10mb)
- Mejora en graceful shutdown con logs

### Seguridad mejorada
- Protección contra brute force en endpoints de auth
- Rate limiting por IP
- Headers de rate limit en respuestas (RateLimit-*)
- Logs de todas las peticiones HTTP
- Logs de errores con stack trace
- Carpeta logs/ ignorada en Git

### Dependencias nuevas
- `express-rate-limit` - Rate limiting
- `winston` - Sistema de logging profesional

### Rate limiters configurados
- **generalLimiter**: 100 requests/15min para toda la API
- **authLimiter**: 5 requests/15min para /api/auth/* (solo cuenta fallos)

### Logger Winston
- **Niveles**: error, warn, info, http, debug
- **Transports**:
  - Console con colores
  - Archivo logs/all.log (todos los logs)
  - Archivo logs/error.log (solo errores)
- **Formato**: timestamp + nivel + mensaje

### Archivos creados
- `src/utils/logger.ts` - Configuración Winston
- `src/middleware/rateLimiter.ts` - Rate limiters
- `src/middleware/requestLogger.ts` - Logger de requests
- `logs/` - Carpeta de archivos de log

### Archivos modificados
- `src/app.ts` - Integración de middlewares
- `src/index.ts` - Logger en startup y shutdown
- `src/middleware/error.ts` - Logs de errores
- `.gitignore` - Añadida carpeta logs/

---

## v0.7.0 - Mejoras en Users (actualizar perfil y cambiar contraseña)

### Añadido
- Endpoint para actualizar perfil propio sin especificar ID
- Endpoint para cambiar contraseña con validación de contraseña actual
- Schemas Zod para actualizar perfil y cambiar contraseña
- Funciones en service para updateProfile y changePassword
- Validación de contraseña actual con bcrypt.compare

### Endpoints nuevos
- `PATCH /api/users/me` - Actualizar perfil propio (requiere JWT)
- `PATCH /api/users/me/password` - Cambiar contraseña (requiere JWT)

### Seguridad
- Cambio de contraseña requiere contraseña actual
- Hash de nueva contraseña con bcrypt
- Validación de contraseña actual antes de actualizar
- Usuario solo puede actualizar su propio perfil mediante /me

### Schemas Zod
- `updateProfileSchema` - name y email opcionales
- `changePasswordSchema` - currentPassword y newPassword (min 8)

### Flujo de actualización de perfil
1. Usuario autenticado envía PATCH a /api/users/me
2. Middleware auth extrae user id desde JWT
3. Service actualiza usuario por ID del token
4. Retorna usuario actualizado

### Flujo de cambio de contraseña
1. Usuario envía contraseña actual y nueva
2. Service busca usuario por ID del token
3. Verifica contraseña actual con bcrypt.compare
4. Si válida, hashea nueva contraseña
5. Actualiza passwordHash en base de datos
6. Retorna mensaje de éxito

### Archivos modificados
- `src/modules/users/users.schema.ts` - Añadidos schemas
- `src/modules/users/users.service.ts` - Añadidas funciones
- `src/modules/users/users.controller.ts` - Añadidos controllers
- `src/modules/users/users.routes.ts` - Añadidas rutas

---

## v0.6.0 - Middleware de autenticación

### Añadido
- Middleware de autenticación JWT
- Verificación de tokens en header Authorization
- Extensión de tipos Express para incluir req.user
- Endpoint `/api/users/me` para obtener perfil autenticado
- Protección de todas las rutas de users con JWT

### Rutas protegidas
- `GET /api/users` - Requiere JWT
- `GET /api/users/me` - Requiere JWT (nuevo)
- `GET /api/users/:id` - Requiere JWT
- `PATCH /api/users/:id` - Requiere JWT
- `DELETE /api/users/:id` - Requiere JWT

### Seguridad
- Validación de formato Bearer token
- Verificación de firma JWT con secret
- Validación de payload (sub, email)
- Mensajes de error claros: "No autorizado" / "Token inválido"

### Middleware auth
- Lee header Authorization
- Verifica formato "Bearer <token>"
- Valida token con jwt.verify()
- Inyecta req.user con { sub, email }
- Retorna 401 si falla la autenticación

### Flujo de uso
1. Usuario hace login → recibe JWT
2. Cliente guarda JWT
3. Cliente envía JWT en header: `Authorization: Bearer <token>`
4. Middleware valida JWT
5. Si válido, permite acceso y añade req.user
6. Controller puede acceder a req.user.email, req.user.sub

### Archivos principales
- `src/middleware/auth.ts` - Middleware JWT
- `src/modules/users/users.controller.ts` - Añadido meCtrl
- `src/modules/users/users.routes.ts` - Rutas protegidas

---

## v0.5.0 - Módulo Auth (registro/login)

### Añadido
- Módulo de autenticación completo
- Registro de usuarios con hash de contraseñas (bcrypt)
- Login con verificación de contraseñas
- Generación de JWT con expiración de 7 días
- Auth service con manejo de errores específicos
- Auth controller con validación Zod integrada
- Rutas de autenticación

### Endpoints nuevos
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login y generación de JWT

### Seguridad implementada
- Hash de contraseñas con bcrypt (10 rounds por defecto)
- JWT firmado con secret desde variables de entorno
- Payload JWT: sub (user id), email, iat, exp
- Validación de datos de entrada con Zod
- Mensajes de error genéricos para seguridad

### Manejo de errores
- Email duplicado (409 Conflict)
- Credenciales inválidas (401 Unauthorized)
- Validación de entrada (400 Bad Request)

### Archivos principales
- `src/modules/auth/auth.service.ts` - Lógica de negocio
- `src/modules/auth/auth.controller.ts` - Controladores HTTP
- `src/modules/auth/auth.routes.ts` - Rutas de auth

### Flujo de autenticación
1. Usuario se registra con email, name, password
2. Sistema valida datos con Zod
3. Sistema hashea contraseña con bcrypt
4. Sistema crea usuario en base de datos
5. Sistema genera JWT
6. Usuario recibe token para autenticar futuras peticiones

---

## v0.4.0 - Validación con Zod

### Añadido
- Middleware genérico de validación con Zod
- Esquemas de validación para users (register, login, update)
- Types de TypeScript generados desde esquemas Zod
- CRUD completo de usuarios con validación
- Controladores de users con manejo de errores de Prisma
- Rutas de users: GET, PATCH, DELETE
- Documentación de ejemplos de API

### Endpoints nuevos
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PATCH /api/users/:id` - Actualizar usuario (con validación)
- `DELETE /api/users/:id` - Eliminar usuario

### Validación implementada
- Email válido
- Nombre mínimo 2 caracteres
- Password mínimo 8 caracteres
- Mensajes de error en español

### Archivos principales
- `src/middleware/validate.ts` - Middleware genérico
- `src/modules/users/users.schema.ts` - Esquemas Zod
- `src/modules/users/users.service.ts` - Lógica de negocio
- `src/modules/users/users.controller.ts` - Controladores
- `src/modules/users/users.routes.ts` - Rutas
- `docs/API_EXAMPLES.md` - Ejemplos de uso

---

## v0.3.0 - PostgreSQL + Docker con Prisma

### Añadido
- `docker-compose.yml` con PostgreSQL 16
- Prisma ORM configurado
- Modelo `User` en schema de Prisma
- Cliente Prisma en `src/config/db.ts`
- Migración inicial creada
- Tabla `User` en base de datos

### Comandos útiles

**Levantar base de datos:**
```bash
docker-compose up -d
```

**Ver logs de PostgreSQL:**
```bash
docker-compose logs -f postgres
```

**Parar base de datos:**
```bash
docker-compose down
```

**Crear nueva migración:**
```bash
npx prisma migrate dev --name nombre_migracion
```

**Ver base de datos con Prisma Studio:**
```bash
npx prisma studio
```

**Regenerar cliente Prisma:**
```bash
npx prisma generate
```

### Estructura de base de datos

**Tabla User:**
- `id` (INT, PK, autoincrement)
- `email` (TEXT, unique)
- `name` (TEXT)
- `passwordHash` (TEXT)
- `createdAt` (TIMESTAMP)

---

## v0.2.0 - Express básico

### Añadido
- Servidor Express configurado
- Variables de entorno con validación
- Middlewares: helmet, cors, morgan
- Endpoint `/health`
- Manejo global de errores

---

## v0.1.0 - Proyecto base

### Añadido
- Inicialización de proyecto npm
- Configuración TypeScript
- Estructura de carpetas modular
- Scripts de desarrollo y build
- Configuración de nodemon

