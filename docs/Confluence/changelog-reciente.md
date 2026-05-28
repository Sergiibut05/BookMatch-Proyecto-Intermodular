[TOC]

## Mayo 2026

*   [SCRUM-227] **Autenticación:** Implementada recuperación de contraseñas en el componente de Login (Frontend).
*   [SCRUM-226] **Correos y Stripe:** Configuración de credenciales SMTP en producción para el envío de recibos.
*   [SCRUM-195] **Analíticas:** Integración de Google Analytics (GA4) con visualización estilo PowerBI mediante Chart.js.
*   [SCRUM-194] **Backend:** Nuevo endpoint protegido `/api/analytics/traffic` para ingesta de métricas.
*   [SCRUM-193] **IA/Data:** Nuevo script Python (`seed_analytics.py` y `ga4_analytics.py`) para métricas de prueba.
*   [SCRUM-181] **Playlists:** Generación de portadas por IA y almacenamiento en Firebase Storage.
*   [SCRUM-175] **AI Chat:** Rediseño del chat con panel lateral, conversión de hilos a listas de reproducción.
*   [SCRUM-170] **Playlists:** Compartición pública y exportación a JSON/Markdown.
*   [SCRUM-168] **IA (n8n):** Generación de colecciones de libros a partir de prompts de lenguaje natural.
*   [SCRUM-161] **Backend:** Módulo de Playlists implementado (Prisma + Express).

## Abril 2026

#### Infra — API en EC2 + HTTPS + Supabase + CI

* **Runtime:** AWS **EC2** (Ubuntu), contenedor **Docker** (`BookMatch-Backend/Dockerfile`, `docker-compose`) con Node, Prisma y **Python**/venv (analytics).
* **TLS / DNS:** **Caddy** en el host (443/80) → `reverse_proxy` a `127.0.0.1:3000`; registro **A** `api.<dominio>` → IP de la instancia (recomendable Elastic IP).
* **Datos:** PostgreSQL en **Supabase** (`DATABASE_URL` \+ `DIRECT_URL` en `.env` del servidor).
* **Front prod:** `environment.prod.ts` — `apiUrl` debe incluir `/api` (`https://api.<dominio>/api`); sin ese sufijo las rutas devuelven 404 frente a Express directo (en Vercel el rewrite ocultaba el prefijo).
* **CORS:** `app.ts` ampliado con orígenes `https://<dominio>` y `https://www.<dominio>` además de Vercel.
* **CI:** `.github/workflows/deploy-ec2-backend.yml` — push a `main` con cambios en `BookMatch-Backend/**` → SSH (`EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`) → `git pull` \+ `docker compose build` \+ `up -d`.
* **Docs:** `README.md`, `AGENTS.md`, wiki **Deployment y producción** y **Backend - Express**.

#### Abril 2026 (resumen; detalle en historial v10)

* **AI-Playlists (SCRUM-158)** \+ **AI-Chat UX (SCRUM-159)**; n8n **SCRUM-180** (memoria, `playlist_builder`, SQL); portadas **SCRUM-181**; rediseño editorial playlists + modal confirmación + i18n; commits rama `sergii`.
* **Confluence:** auditorías hub, arquitectura, deployment, módulos/API, setup, datos, auth, frontend, troubleshooting, contribución, contacto.
* **Stripe:** `successUrl` / `cancelUrl` opcionales en checkout de libro.
* El texto largo de abril en esta página se sustituyó por este resumen; recuperar bloque completo en **Historial de página → versión 10** si hace falta.

---

### Noviembre 2025

#### Sistema de Pagos con Stripe

* ✅ Integración completa de Stripe Checkout
* ✅ Soporte para Card, Link y PayPal
* ✅ Dirección de envío obligatoria
* ✅ Creación automática de órdenes
* ✅ Actualización automática de stock
* ✅ Página de confirmación de pago
* ✅ Modo de prueba configurado
* ✅ Soporte para carrito completo

#### Sistema de Foros y Comunidad

* ✅ Sistema completo de foros
* ✅ Posts con sistema de votos
* ✅ Comentarios anidados (threads)
* ✅ Subida de imágenes en posts
* ✅ Búsqueda y paginación

#### Gestión de Perfil

* ✅ Componente de perfil implementado
* ✅ Subida de fotos con Capacitor
* ✅ Integración con Firebase Storage
* ✅ Actualización en Firebase Auth y BD
* ✅ Eliminación automática de fotos antiguas

#### Carrito de Compras

* ✅ Sistema completo de carrito
* ✅ Persistencia en localStorage
* ✅ Integración con pagos
* ✅ Gestión de cantidades

#### Mejoras Generales

* ✅ Servicios modulares y reutilizables
* ✅ Manejo de errores mejorado
* ✅ UI/UX mejorada con Tailwind CSS
* ✅ Internacionalización completa
* ✅ Documentación actualizada

---

**Última actualización:** Mayo 2026 — despliegue API EC2 + entrada changelog; abril 2026 resumido (v10 = texto largo previo).