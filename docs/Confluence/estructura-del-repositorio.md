# Estructura del Repositorio

Estructura **orientativa** del monorepo. La fuente de verdad de rutas HTTP es `BookMatch-Backend/src/app.ts` y la página **Módulos y Funcionalidades**.

<!\[CDATA\[BookMatch-Proyecto-Intermodular/ │ ├── BookMatch-Angular/ # Frontend (Angular 21, Capacitor 7, Tailwind) │ ├── src/app/ # core/, shared/, features/ (auth, catálogo, carrito, foros…) │ ├── src/assets/i18n/ # Traducciones (es, en) │ ├── src/environments/ │ ├── angular.json, package.json, tailwind.config.js │ └── … │ ├── BookMatch-Backend/ # API (Express 5, TypeScript, Prisma) │ ├── src/ │ │ ├── app.ts # CORS, Helmet, webhook Stripe (raw) antes de json, montaje /api/\* │ │ ├── index.ts │ │ ├── config/ # db, env, swagger │ │ ├── middleware/ # auth, validate (Zod), rateLimiter, error, requestLogger │ │ ├── modules/ │ │ │ ├── auth/ │ │ │ ├── users/ │ │ │ ├── catalog-books/ │ │ │ ├── payments/ │ │ │ ├── orders/ │ │ │ ├── forums/ # /api/forums — monta posts en /:forumId/posts │ │ │ ├── posts/ # usado bajo forums; monta comments y votes por post │ │ │ ├── comments/ # rutas anidadas bajo post + router en /api/comments │ │ │ └── votes/ # montado bajo .../posts/:postId/votes │ │ ├── routes/ │ │ │ └── ai-chat.routes.ts # /api/ai-chat (proxy n8n opcional) │ │ ├── services/ # p. ej. mail.service.ts │ │ ├── utils/ # logger, firebaseAdmin, plantillas email │ │ └── tests/ # Jest (p. ej. auth, users) │ ├── prisma/ # schema, migrations, seed │ ├── vercel.json # despliegue API en Vercel (si aplica) │ ├── package.json │ └── … │ ├── README.md ├── GIT-WORKFLOW.md └── DATA\_MIGRATION\_ANALYSIS.md # si sigue en el repo\]\]>

### Notas rápidas

* **Foros:** no hay un `app.use` separado para `posts` o `votes`; se cuelgan del router de **forums** y **posts** (ver `forums.routes.ts` y `posts.routes.ts`).
* **Webhook Stripe:** vive en `app.ts` como `POST /api/payments/webhook` con cuerpo **raw**, no en el router JSON habitual.
* **Tests:** bajo `src/tests/`, no en carpeta `tests/` en la raíz de `src/`.

---

**Actualización:** abril 2026 — alineado con el árbol real del backend y `app.ts`.