# Troubleshooting

### Backend no arranca o Prisma falla al migrar

**Síntoma:** error al cargar `@prisma/client` o migraciones.

<!\[CDATA\[cd BookMatch-Backend npm install npx prisma generate\]\]>

El `package.json` ejecuta `prisma generate` en **postinstall**; si falla, suele ser entorno o red.

**Síntoma:** Prisma pide `DIRECT_URL` o falla el datasource.

* En `.env` deben existir `DATABASE_URL` y `DIRECT_URL` (en local suelen ser la misma URL PostgreSQL). Ver **Instalación** y `prisma/schema.prisma`.

---

### No hay conexión a la base de datos

**Síntoma:** `Can't reach database server` o timeouts.

1. PostgreSQL en marcha y credenciales correctas.
2. `DATABASE_URL` / `DIRECT_URL` correctas.
3. Firewall / IP permitida si la BD es remota.

---

### Firebase Admin no inicia

**Síntoma:** error al inicializar Admin SDK.

1. `FIREBASE_PRIVATE_KEY` con saltos de línea como `` dentro del string.
2. `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PROJECT_ID` coherentes con el JSON de la cuenta de servicio.
3. Proyecto activo en [Firebase Console](https://console.firebase.google.com/).

---

### Stripe

**Síntoma:** `Invalid API Key` o webhook sin efecto.

1. `STRIPE_SECRET_KEY` correcta (test `sk_test_...` en desarrollo).
2. Webhook: URL pública `.../api/payments/webhook`, cuerpo **raw** (el servidor registra esta ruta **antes** de `express.json`).
3. `STRIPE_WEBHOOK_SECRET` en producción para verificar firma.

---

### CORS o el front no llega al API

**Síntoma:** CORS en navegador o `Network Error`.

1. Backend levantado (p. ej. `http://localhost:3000`).
2. `apiUrl` en `environment.ts` apunta a `http://localhost:3000/api` (sin barra final inconsistente).
3. El origen del front (localhost, Vercel, Capacitor) debe estar en la **lista blanca** de `app.ts`; si añadís un dominio nuevo, actualizar CORS.

---

### IA / n8n

**Síntoma:** **503** al enviar mensaje al chat.

* Definir `N8N_WEBHOOK_URL` en el backend con una URL de webhook válida (sin placeholder). Ver **Deployment** y **API y Endpoints**.

---

### Migraciones Prisma

<!\[CDATA\[npx prisma migrate status npx prisma migrate dev --name descripcion # npx prisma migrate reset # ⚠️ borra datos\]\]>

---

### Capacitor

<!\[CDATA\[npm install @capacitor/core @capacitor/camera npx cap sync\]\]>

Tras `ng build`, `webDir` debe coincidir con `capacitor.config.ts` (`dist`).

---

**Actualización:** abril 2026.