# Deployment y Producción

### Producción API — AWS EC2 + Docker + Caddy (mayo 2026)

* **Entorno:** instancia **Ubuntu** en AWS; imagen construida desde `BookMatch-Backend/Dockerfile` (**Node** \+ **Prisma** \+ **Python**/venv para scripts de analytics).
* **Orquestación:** `docker compose` en el servidor; variables en `.env` solo en el EC2 (no versionar secretos; el hook del repo bloquea `git add` de `.env`).
* **HTTPS público:** **Caddy** en el host (puertos **443** y **80** para ACME) con `reverse_proxy` a `127.0.0.1:3000` (contenedor del API).
* **DNS:** registro **A** `api` → IP pública de la instancia (recomendable **Elastic IP** fija para no rotar `EC2_HOST` en GitHub Secrets).
* **Base de datos:** **Supabase** (PostgreSQL): `DATABASE_URL` (pooler / transacciones) y `DIRECT_URL` (conexión directa tipo `db.<ref>.supabase.co`) para Prisma y `migrate deploy`.
* **Prefijo de rutas:** el backend monta todo bajo `/api/...`. El front en producción debe usar `apiUrl` \= `https://api.<dominio>/api` (en **Vercel**, `vercel.json` reescribe y puede ocultar ese prefijo; contra el host propio **no**).
* **Seguridad AWS:** security group con **443** y **80**; **SSH** restringido; opcional no exponer **3000** a Internet si solo Caddy habla con el backend.
* **CI/CD:** workflow `.github/workflows/deploy-ec2-backend.yml`: en **push a** `main` con cambios bajo `BookMatch-Backend/**`, job **SSH** → `git pull`, `docker compose build`, `docker compose up -d`. Secretos del repositorio: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.
* **Migraciones:** cuando aplique: `docker compose run --rm api npx prisma migrate deploy`.
* **Alternativa / respaldo:** despliegue serverless en **Vercel** (`vercel.json`); mismo código; puede coexistir como entorno secundario.

### Variables de entorno (backend)

Definidas y validadas en `BookMatch-Backend/src/config/env.ts`. Obligatorias salvo que se indique lo contrario:

<!\[CDATA\[NODE\_ENV=production PORT=3000 DATABASE\_URL=FIREBASE\_PROJECT\_ID=... FIREBASE\_CLIENT\_EMAIL=... FIREBASE\_PRIVATE\_KEY=... STRIPE\_SECRET\_KEY=... FRONTEND\_URL=https:// \# CORS y URLs por defecto de Stripe\]\]>

**Recomendadas en producción con Stripe:**

<!\[CDATA\[STRIPE\_WEBHOOK\_SECRET=whsec\_... # verificación de firma del webhook\]\]>

**Opcional (chat IA / callbacks):**

<!\[CDATA\[N8N\_WEBHOOK\_URL=... BACKEND\_PUBLIC\_URL=https://api.N8N\_WEBHOOK\_PLAYLIST\_URL=... N8N\_CALLBACK\_SECRET=...\]\]>

Si falta `N8N_WEBHOOK_URL`, el endpoint de IA responde **503** (comportamiento documentado en **API y Endpoints**).

### Frontend (`environment.prod.ts` o equivalente)

<!\[CDATA\[export const environment = { production: true, firebase: { /\* proyecto producción \*/ }, stripePublishableKey: 'pk\_live\_...', apiUrl: 'https://api./api' // obligatorio el sufijo /api si el API es Express en EC2 };\]\]>

_Ejemplos en Vercel suelen usar subdominios_ `*.vercel.app`; con dominio propio, alinear `FRONTEND_URL` y CORS en el backend.

### Build

**Backend**

<!\[CDATA\[cd BookMatch-Backend npm ci npm run build # prisma generate + tsc npm start # node dist/index.js\]\]>

**Frontend**

<!\[CDATA\[cd BookMatch-Angular npm ci npm run build # Salida en dist/ (según configuración Angular)\]\]>

### Vercel (API)

El backend incluye `vercel.json` con reglas de cabeceras y rewrite al handler serverless. En producción:

* Configurad **todas** las variables anteriores en el proyecto Vercel.
* El **webhook de Stripe** debe apuntar a `https://<tu-api>/api/payments/webhook` (modo raw; ver **Sistema de Pagos con Stripe**).
* Ajustad CORS en `app.ts` si añadís un nuevo dominio de frontend.

### Docker (EC2)

`Dockerfile` y `docker-compose.yml` en `BookMatch-Backend/` describen el despliegue recomendado en servidor propio (ver bloque EC2 arriba).

### Checklist producción

1. **Base de datos:** PostgreSQL gestionado (p. ej. Supabase), backups, `DIRECT_URL` para migraciones.
2. **Secretos:** solo en variables de entorno; rotar claves Stripe/Firebase al comprometerse.
3. **HTTPS** en frontend y API (Caddy / Vercel / otro).
4. **Webhook Stripe:** secreto configurado y endpoint accesible públicamente.
5. **Observabilidad:** logs (Winston), monitorización de errores si la usáis (Sentry, etc.).

---

**Actualización:** mayo 2026 — producción API en EC2 (Docker + Caddy + Supabase) y CI GitHub Actions; Vercel como alternativa documentada.