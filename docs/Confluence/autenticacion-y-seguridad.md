# Autenticación y Seguridad

### Resumen

* **Cliente:** Firebase Authentication (email/contraseña, Google, etc.).
* **API protegida:** el navegador envía el **Firebase ID token** en `Authorization: Bearer <token>`; el backend lo verifica con **Firebase Admin** y rellena `req.user` tras sincronizar con **PostgreSQL** (`syncUserFromFirebase` en `users.service.ts`).
* **Rutas públicas de auth en API:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password` trabajan con **cuerpo JSON** (token o email según ruta), no con el flujo Bearer de arriba — ver **API y Endpoints** y Swagger.

### Flujo (vista rápida)

<!\[CDATA\[Usuario → Angular → Firebase Auth (idToken) → peticiones a la API con header Authorization: Bearer → middleware auth: verifyIdToken + sync a tabla users → handlers con req.user { id, uid, email, role }\]\]>

### Frontend: rutas y guard

* Rutas definidas en `app.routes.ts`: la mayoría de vistas de negocio llevan `canActivate: [authGuard]`; políticas legales (`privacy-policy`, `terms-and-conditions`, etc.) y login/registro son **sin** guard.
* `authGuard` (**funcional**, `CanActivateFn`): espera a que `AuthService.user$` emita; si no hay sesión, navega a `/auth/login` y guarda `returnUrl` en query params.

### Backend: middleware `auth` (`middleware/auth.ts`)

* Exige `Authorization: Bearer ...`.
* Verifica el token con Admin SDK; obtiene el usuario de Firebase; sincroniza/crea fila en PostgreSQL.
* Asigna `req.user` con `id` (numérico interno), `uid`, `email`, `role` (`USER` por defecto).
* Errores **401** con cuerpo `{ message: '...' }` (no `{ error }`).

### Otras medidas en `app.ts`

* **CORS:** lista blanca de orígenes (frontend Vercel, localhost, Capacitor, etc.), no `cors()` abierto.
* **Helmet:** `contentSecurityPolicy: false` (Swagger); `crossOriginResourcePolicy: cross-origin`.
* **Rate limiting:** `generalLimiter` global (excepto `NODE_ENV=test`); `authLimiter` en el prefijo `/api/auth`.
* **HPP** (`hpp()`).
* **Validación:** Zod vía `validate()` en rutas; respuestas 400 con `message` \+ `errors` según middleware.

### Datos y secretos

* Claves solo en `.env` / secret manager del hosting; nunca en el repo ni en la wiki.
* Reglas de **Firebase Storage** (avatars, etc.) en consola; ajustar a vuestro modelo de paths.

### Riesgos / deuda documentada

* `PATCH /api/users/:id` está protegido por `auth` pero **no** por `isAdmin` en el router — revisar si solo el propio usuario debería poder actualizar ciertos campos.
* `/api/ai-chat`: el router puede no aplicar `auth` a nivel de montaje; contrastar con la política de producto y con **API y Endpoints**.

---

**Actualización:** abril 2026 — sustituye snippets antiguos que no coincidían con el código.