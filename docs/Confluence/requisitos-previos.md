# Requisitos Previos

### Software necesario

* **Node.js 20 LTS o superior** (incluye npm) — [nodejs.org](https://nodejs.org/)
* **Git** — [git-scm.com](https://git-scm.com/)
* **PostgreSQL** 14+ (16 recomendado) o instancia remota accesible
* **Editor** (VS Code u otro)

### Cuentas y servicios externos

1. **Firebase**

  * Proyecto con **Authentication** (email/contraseña y Google, según lo que uséis)
  * **Storage** si subís avatares u otros ficheros desde cliente
  * Cuenta de **servicio** (Firebase Admin) para el backend: `project_id`, `client_email`, `private_key`
2. **Stripe**

  * Cuenta y claves **test** / **live**
  * Para webhooks en local o producción: endpoint público y `STRIPE_WEBHOOK_SECRET`
3. **PostgreSQL**

  * URL para Prisma (`DATABASE_URL`). El `schema.prisma` también usa `DIRECT_URL` (a menudo la misma cadena en desarrollo; en hosting serverless puede diferir de la URL con pooler).
4. **Google Books API** (opcional, **seeding**)

  * Clave en Google Cloud Console para `prisma/seed.ts`
5. **Cloudinary** (opcional)

  * Usado en el **seed** para subir portadas si está configurado (`CLOUDINARY_*` en entorno al ejecutar el seed)
6. **n8n** (opcional, **chat IA**)

  * Si usáis `POST /api/ai-chat/send-message`, definir `N8N_WEBHOOK_URL` en el backend

### Nota

No hace falta fijar un **projectId** concreto de Firebase en esta página: cada entorno usa el suyo. El código valida las variables obligatorias en `BookMatch-Backend/src/config/env.ts`.

---

**Actualización:** abril 2026 — alineado con Prisma `directUrl`, IA y seed.