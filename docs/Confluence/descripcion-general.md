# Descripción General

**BookMatch** es una plataforma **web y móvil** (Angular + Capacitor) con API **Express 5** y **PostgreSQL**, pensada para unir compra de libros, comunidad y evolución hacia más servicios en torno al libro.

### Qué incluye el producto (MVP / núcleo actual)

* **Catálogo y compra:** libros con precio y stock, categorías, reseñas, búsqueda y flujo de pago con **Stripe Checkout** (libro o carrito).
* **Cuentas y perfil:** **Firebase Auth** (email/contraseña y Google), sincronización con PostgreSQL, perfil y fotos (Storage).
* **Foros:** foros, posts, comentarios en hilo, votos e imágenes en publicaciones.
* **Pedidos:** creación tras pago (webhook) e **historial** del usuario vía API (estados del pedido en base de datos).
* **i18n:** español / inglés (`@ngx-translate`).
* **Documentación API:** Swagger en `/api-docs`.

### Visión / roadmap (no todo es igual de maduro)

* **Trueque digital** y **recomendaciones** avanzadas figuran como **línea de producto futura**; el foco técnico actual está en catálogo, pagos, foros y perfil. Ver **Estado del Proyecto** para el detalle implementado vs pendiente.
* **Asistente IA:** existe flujo de **chat** en frontend (`/ai-chat`) y endpoint en backend que delega en **n8n** si `N8N_WEBHOOK_URL` está configurada; sin webhook responde **503**.

El proyecto se plantea como **MVP** sobre una base **modular y escalable** (ver **Arquitectura** y **Estructura del repositorio**).

---

**Actualización:** abril 2026 — alineado con el repo y con la wiki técnica auditada.