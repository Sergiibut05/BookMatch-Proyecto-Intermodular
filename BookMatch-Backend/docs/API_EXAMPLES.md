# Ejemplos de uso de la API

## Endpoints disponibles

### Health Check
```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{"ok": true}
```

---

## Auth

### Registro de usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2025-11-04T11:34:54.797Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2025-11-04T11:34:54.797Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Casos de error

**Email ya registrado (409):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email":"test@example.com","name":"Test","password":"12345678"}'

# {"message":"Email ya registrado"}
```

**Credenciales inválidas (401):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# {"message":"Credenciales inválidas"}
```

**Validación de contraseña (400):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -d '{"email":"new@example.com","name":"User","password":"123"}'

# {"message":"...La contraseña debe tener al menos 8 caracteres..."}
```

---

## Users (Rutas protegidas con JWT)

Todas las rutas de usuarios requieren autenticación con JWT. Incluye el header `Authorization: Bearer <token>`.

### Obtener perfil del usuario autenticado
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Test User",
  "createdAt": "2025-11-04T11:34:54.797Z"
}
```

### Actualizar perfil propio
```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Nuevo Nombre","email":"nuevo@email.com"}'
```

**Response (200):**
```json
{
  "id": 1,
  "email": "nuevo@email.com",
  "name": "Nuevo Nombre",
  "createdAt": "2025-11-04T11:34:54.797Z"
}
```

### Cambiar contraseña
```bash
curl -X PATCH http://localhost:3000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"currentPassword":"password123","newPassword":"newpassword456"}'
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

### Casos de error - Cambio de contraseña

**Contraseña actual incorrecta (400):**
```bash
curl -X PATCH http://localhost:3000/api/users/me/password \
  -d '{"currentPassword":"wrongpassword","newPassword":"newpass123"}'

# {"message":"Contraseña actual incorrecta"}
```

### Listar usuarios
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener usuario por ID
```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Actualizar usuario
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Nuevo Nombre","email":"nuevo@email.com"}'
```

### Eliminar usuario
```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Acceso sin token (401)
```bash
curl http://localhost:3000/api/users

# {"message":"No autorizado"}
```

### Token inválido (401)
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer invalid_token"

# {"message":"Token inválido"}
```

---

## Validación con Zod

La API valida automáticamente los datos de entrada usando Zod.

### Ejemplo de validación fallida

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","name":"A"}'
```

**Response (400):**
```json
{
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "name": ["El nombre debe tener al menos 2 caracteres"],
      "email": ["Email inválido"]
    }
  }
}
```

### Ejemplo de validación exitosa

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez"}'
```

**Response (200):**
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "name": "Juan Pérez",
  "createdAt": "2024-11-04T11:30:00.000Z"
}
```

---

## Manejo de errores

### Usuario no encontrado (404)
```bash
curl http://localhost:3000/api/users/999
```

**Response:**
```json
{
  "message": "Usuario no encontrado"
}
```

### Email duplicado (409)
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"email":"email@existente.com"}'
```

**Response:**
```json
{
  "message": "El email ya está en uso"
}
```

---

## Rate Limiting

La API implementa rate limiting para proteger contra abuso:

### Límite general
- **100 requests por 15 minutos** desde la misma IP
- Aplica a toda la API

### Límite de autenticación
- **5 intentos por 15 minutos** en endpoints de auth
- Solo cuenta intentos fallidos
- Aplica a `/api/auth/register` y `/api/auth/login`

### Headers de respuesta
Todas las respuestas incluyen headers de rate limit:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1604424000
```

### Ejemplo de límite excedido (429)
```bash
# Después de 5 intentos fallidos de login
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@test.com","password":"wrong"}'

# Response:
# {"message":"Demasiados intentos de autenticación, intenta de nuevo en 15 minutos"}
```

---

## Logging

La API utiliza Winston para logging profesional:

### Niveles de log
- `error` - Errores (500+)
- `warn` - Advertencias (400-499)
- `info` - Información general
- `http` - Requests HTTP (200-399)
- `debug` - Debug (solo en desarrollo)

### Archivos de log
- `logs/all.log` - Todos los logs
- `logs/error.log` - Solo errores

### Formato de logs
```
2025-11-04 13:27:55 info: API escuchando en http://localhost:3000
2025-11-04 13:27:56 http: GET /health 200 2ms
2025-11-04 13:27:57 warn: POST /login 401 45ms
2025-11-04 13:27:58 error: GET /users 500 12ms
```

