## Objetivo del trimestre
- Entregar el **módulo de trueque completo** (end-to-end) con flujo funcional, persistencia, seguridad y UX sólida.
- Mejorar el **Home**: arreglar integración Three.js, sustituir vídeo por uno optimizado, y aplicar **lazy loading/optimización** a la carga de libros.

## Supuestos (para poder planificar)
- Frontend: `BookMatch-Angular/` (Angular) y Backend: `BookMatch-Backend/` (Express/Prisma).
- Autenticación existente (p.ej. Firebase/Auth) y modelo de usuarios ya disponible.
- El trueque se basa en **propuestas entre usuarios** sobre libros listados en la app.

## Epic A — Trueque (alcance completo)
### A1. Descubrimiento y contrato API (3 SP)
- **Título**: Definir dominio de trueque y contrato front-back.
- **Descripción**: Alinear estados del trueque, validaciones, permisos, endpoints y eventos (notificaciones). Redactar DTOs/requests/responses y reglas de negocio.
- **Subtareas**:
  - [ ] Alinear alcance exacto del trueque (qué es “completado”, expiración, cancelación).
  - [ ] Definir `TradeStatus` y tabla de transiciones permitidas.
  - [ ] Definir endpoints (crear, listar, detalle, acciones) y query params.
  - [ ] Definir payloads request/response + ejemplos (OK y errores).
  - [ ] Definir reglas de permisos (emisor/receptor/admin) y casos borde.
  - [ ] Validar contrato con el frontend (campos mínimos para UI).
- **Entregables**:
  - Documento corto con: estados, transiciones, endpoints, payloads, errores.
  - Lista de permisos/roles y casos borde (cancelación, expiración, duplicados).
- **Dependencias**: ninguna.
- **Peso**: 3.

### A2. Modelo de datos (Prisma) + migración (5 SP)
- **Título**: Añadir tablas/modelos para trueques y propuestas.
- **Descripción**: Crear entidades para: `Trade`, `TradeOffer`, `TradeItem` (o equivalente), estados, timestamps, expiración, referencias a usuario/libro.
- **Subtareas**:
  - [ ] Diseñar entidades definitivas (Trade/TradeItem y/o locks de libros).
  - [ ] Añadir enums necesarios (estado, lado ofrecido/solicitado).
  - [ ] Definir índices y restricciones (unicidad por trade + userBook).
  - [ ] Revisar `@map/@@map` para mantener naming consistente.
  - [ ] Crear migración y verificar que aplica sin romper tablas existentes.
  - [ ] (Opcional) Seed mínimo para probar flujos localmente.
- **Entregables**:
  - `schema.prisma` actualizado.
  - Migración aplicada.
  - Seeds o datos de ejemplo (si ya existe patrón de seeds).
- **Dependencias**: A1.
- **Peso**: 5.

### A3. API: crear propuesta de trueque (5 SP)
- **Título**: Endpoint para proponer trueque.
- **Descripción**: Validar que el usuario puede proponer, que los libros existen y son “truequeables”, evitar propuestas duplicadas, y crear la propuesta con estado inicial.
- **Subtareas**:
  - [ ] Crear `trades.schema.ts` (Zod) para validación.
  - [ ] Implementar servicio con validaciones de ownership de `user_books`.
  - [ ] Evitar duplicados (misma pareja + mismos items + estado activo).
  - [ ] Crear `controller` con códigos 201/400/401/403/409.
  - [ ] Documentar en Swagger (routes).
  - [ ] Test básico (happy path + caso de permiso/ownership).
- **Entregables**:
  - Endpoint `POST /trades` o similar.
  - Validación (Zod) y errores consistentes.
  - Tests básicos (unit/integration según patrón del repo).
- **Dependencias**: A2.
- **Peso**: 5.

### A4. API: listar y ver detalle de propuestas (3 SP)
- **Título**: Endpoints de listado y detalle.
- **Descripción**: Listar “mis propuestas enviadas”, “propuestas recibidas” y detalle con items, usuarios, libros y estado.
- **Subtareas**:
  - [ ] Definir filtros (role, status, paginación si aplica).
  - [ ] Implementar `GET /trades` con permisos (solo “mis” trades).
  - [ ] Implementar `GET /trades/:id` con include de items/libros.
  - [ ] Normalizar shape de respuesta para frontend (mínimo necesario).
  - [ ] Swagger de ambos endpoints.
  - [ ] Test básico de “no puedes ver trades ajenos”.
- **Entregables**:
  - `GET /trades?role=sender|receiver&status=...`
  - `GET /trades/:id`
- **Dependencias**: A2.
- **Peso**: 3.

### A5. API: aceptar/rechazar/cancelar (5 SP)
- **Título**: Transiciones de estado del trueque.
- **Descripción**: Implementar acciones con control de permisos y validación de transición (solo receptor acepta/rechaza; emisor puede cancelar; ambos pueden marcar completado según regla).
- **Subtareas**:
  - [ ] Implementar helper central de transiciones (estado actual → acción).
  - [ ] Endpoint accept (solo receptor, solo en PROPOSED).
  - [ ] Endpoint reject (solo receptor, solo en PROPOSED).
  - [ ] Endpoint cancel (solo emisor en PROPOSED; regla extra si ACCEPTED).
  - [ ] Endpoint complete (regla acordada: simple o doble confirmación).
  - [ ] Tests de transiciones inválidas → 409.
- **Entregables**:
  - Endpoints de acción (`POST /trades/:id/accept`, `.../reject`, `.../cancel`, `.../complete`).
  - Reglas de transición centralizadas.
- **Dependencias**: A3, A4.
- **Peso**: 5.

### A6. Expiración automática + limpieza (5 SP)
- **Título**: Caducidad y housekeeping.
- **Descripción**: Caducar propuestas no respondidas (p.ej. 7/14 días) y dejar trazabilidad. Programar job (cron) o workflow existente.
- **Subtareas**:
  - [ ] Definir TTL (ej. 7/14 días) y cuándo se calcula `expiresAt`.
  - [ ] Añadir job (cron) para marcar `EXPIRED`.
  - [ ] Asegurar idempotencia del job (no expirar estados finales).
  - [ ] Registrar trazabilidad (timestamps, logs).
  - [ ] Probar con datos de ejemplo en local.
  - [ ] Documentar cómo se ejecuta/configura en prod.
- **Entregables**:
  - Lógica de expiración.
  - Job programado y documentado.
- **Dependencias**: A2.
- **Peso**: 5.

### A7. Notificaciones (in-app y/o email) (8 SP)
- **Título**: Notificar eventos de trueque.
- **Descripción**: Notificar cuando se recibe propuesta, se acepta/rechaza/cancela, y cuando expira. Puede ser in-app (campana) y opcional email.
- **Subtareas**:
  - [ ] Definir eventos y payload mínimo (tradeId, status, actor).
  - [ ] Crear modelo/tabla de notificaciones (si no existe).
  - [ ] Emitir notificación al crear trade (receiver).
  - [ ] Emitir notificación en accept/reject/cancel/expire/complete.
  - [ ] Endpoint para listar/marcar leídas (si aplica).
  - [ ] UI mínima de notificaciones (si ya existe, integrar).
- **Entregables**:
  - Servicio de notificaciones.
  - Persistencia (si aplica) + endpoints de lectura.
- **Dependencias**: A3–A6.
- **Peso**: 8.

### A8. Frontend: pantallas de Trueque (8 SP)
- **Título**: UI principal de trueque.
- **Descripción**: Crear secciones “Recibidas” y “Enviadas”, detalle de propuesta, y acciones (aceptar/rechazar/cancelar). Estados de carga/empty/error.
- **Subtareas**:
  - [ ] Crear rutas lazy (listados y detalle) siguiendo patrón standalone.
  - [ ] Servicio HTTP `TradesService` (listado + detalle).
  - [ ] Pantalla “Recibidas” con filtros por estado.
  - [ ] Pantalla “Enviadas” con filtros por estado.
  - [ ] Detalle con items y acciones disponibles según rol/estado.
  - [ ] Estados UX: loading/empty/error + i18n si aplica.
- **Entregables**:
  - Rutas/componentes en `BookMatch-Angular/`.
  - Integración con API.
  - i18n si ya existe.
- **Dependencias**: A4, A5.
- **Peso**: 8.

### A9. Frontend: crear propuesta desde libro/perfil (5 SP)
- **Título**: Flujo de “Proponer trueque”.
- **Descripción**: Desde un libro o perfil, seleccionar items propios, proponer, confirmar y ver estado.
- **Subtareas**:
  - [ ] Punto de entrada (botón) desde detalle de libro/perfil.
  - [ ] UI para seleccionar libros propios a ofrecer.
  - [ ] UI para seleccionar libros del otro usuario a solicitar (si aplica).
  - [ ] Validaciones de UX (mínimo 1 ofrecido y 1 solicitado).
  - [ ] Llamada a `POST /trades` y manejo de errores 409/403.
  - [ ] Redirección a detalle del trade tras crear.
- **Entregables**:
  - Modal/página de creación.
  - Validaciones UX.
- **Dependencias**: A3.
- **Peso**: 5.

### A10. Mensajería/Chat asociado a trueque (13 SP)
- **Título**: Chat por propuesta.
- **Descripción**: Canal de mensajes por `Trade` con permisos (solo participantes), paginación, envío en tiempo real si existe infra; si no, polling.
- **Subtareas**:
  - [ ] Definir modelo `TradeMessage` (o equivalente) y relación con `Trade`.
  - [ ] Endpoint `GET` paginado de mensajes por trade.
  - [ ] Endpoint `POST` para enviar mensaje (solo participantes).
  - [ ] UI de chat en detalle (historial + composer).
  - [ ] Estrategia de “tiempo real” (polling vs websocket) y decisión.
  - [ ] Moderación mínima (longitud, rate limit básico).
- **Entregables**:
  - API mensajes + persistencia.
  - UI de chat en detalle.
- **Dependencias**: A2, A4, A8.
- **Peso**: 13.

### A11. Moderación y reportes (8 SP)
- **Título**: Reportar abuso y moderación básica.
- **Descripción**: Reportar usuario/propuesta/mensaje, guardar reporte, y vista mínima para admin (si hay roles) o registro.
- **Subtareas**:
  - [ ] Definir `Report` (targetType: user/trade/message) y campos.
  - [ ] Endpoint para crear reporte (usuario autenticado).
  - [ ] (Opcional) Endpoint admin para listar/filtrar reportes.
  - [ ] UI mínima para reportar desde trade/chat.
  - [ ] Rate limit / anti-spam básico.
  - [ ] Documentación de flujo y permisos.
- **Entregables**:
  - Endpoint de report.
  - Persistencia y reglas.
- **Dependencias**: A10.
- **Peso**: 8.

### A12. Valoraciones post-trueque (8 SP)
- **Título**: Ratings y feedback.
- **Descripción**: Permitir valorar al otro usuario tras completar trueque. Agregados en perfil.
- **Subtareas**:
  - [ ] Definir modelo de rating (1–5) + comentario opcional.
  - [ ] Endpoint crear rating (solo participantes y solo si COMPLETED).
  - [ ] Evitar duplicados (un rating por trade y por dirección).
  - [ ] Endpoint para leer agregados en perfil (media/contador).
  - [ ] UI para valorar tras completar.
  - [ ] Test de permisos + caso duplicado.
- **Entregables**:
  - Modelo + endpoints.
  - UI de valoración.
- **Dependencias**: A5.
- **Peso**: 8.

### A13. Seguridad, auditoría y hardening (5 SP)
- **Título**: Revisión de permisos y logs.
- **Descripción**: Asegurar control de acceso a endpoints, evitar IDOR, sanitizar inputs, y añadir logs/auditoría de transiciones.
- **Subtareas**:
  - [ ] Revisar permisos endpoint a endpoint (sender/receiver/admin).
  - [ ] Asegurar que no hay IDOR en `GET /trades/:id`.
  - [ ] Normalizar errores (401/403/404/409) para UX consistente.
  - [ ] Añadir logging de transiciones sin PII sensible.
  - [ ] Rate limit en endpoints sensibles (mensajes/reportes).
  - [ ] Revisión rápida de CORS/headers si afecta al nuevo módulo.
- **Entregables**:
  - Checklist de seguridad aplicada.
  - Ajustes en middleware/guards.
- **Dependencias**: A3–A12.
- **Peso**: 5.

### A14. QA end-to-end + documentación (5 SP)
- **Título**: Test plan y docs para el equipo.
- **Descripción**: Casos E2E principales y documentación de uso para devs.
- **Subtareas**:
  - [ ] Checklist E2E: proponer → aceptar → completar.
  - [ ] Checklist E2E: proponer → rechazar/cancelar/expirar.
  - [ ] Probar permisos (no participantes no ven ni actúan).
  - [ ] Probar casos borde (libro inexistente, duplicados, 409).
  - [ ] Documentar endpoints en Swagger + doc interna.
  - [ ] Definir “Definition of Done” del módulo.
- **Entregables**:
  - Checklist de pruebas.
  - README/guía de endpoints y flujo.
- **Dependencias**: A8–A13.
- **Peso**: 5.

## Epic B — Home: Three.js, vídeo y rendimiento
### B1. Arreglar Three.js en Home (8 SP)
- **Título**: Reparar escena/animación Three.js del Home.
- **Descripción**: Identificar fallo (carga, SSR/hidratación, tamaño canvas, leaks), corregir integración y asegurar rendimiento (requestAnimationFrame, disposal).
- **Subtareas**:
  - [ ] Reproducir error actual y documentar causa raíz.
  - [ ] Revisar lifecycle del componente (init/dispose) y limpiar recursos.
  - [ ] Ajustar resize/ratio/canvas sizing (responsive).
  - [ ] Verificar compatibilidad con lazy routes y navegación.
  - [ ] Medir FPS / uso de CPU y optimizar lo básico.
  - [ ] Smoke test en móvil (Capacitor/webview si aplica).
- **Entregables**:
  - Home con Three.js estable.
  - Sin leaks ni errores en consola.
- **Dependencias**: ninguna.
- **Peso**: 8.

### B2. Sustituir vídeo del Home por uno optimizado (3 SP)
- **Título**: Reemplazar asset de vídeo y optimizar entrega.
- **Descripción**: Añadir nuevo vídeo (formato moderno), poster, y configuración de preload/autoplay según UX.
- **Subtareas**:
  - [ ] Conseguir vídeo final (duración/ratio/resolución objetivo).
  - [ ] Exportar a formato eficiente (p.ej. mp4 h264 y/o webm).
  - [ ] Añadir `poster` e iniciar carga diferida (`preload=metadata/none`).
  - [ ] Ajustar autoplay/mute/loop según UX y políticas del navegador.
  - [ ] Verificar en móvil y conexiones lentas.
  - [ ] Revisar tamaño final del asset en repo/CDN.
- **Entregables**:
  - Nuevo asset en `assets/`.
  - Ajustes en componente.
- **Dependencias**: ninguna.
- **Peso**: 3.

### B3. Lazy loading + paginación/virtualización de libros en Home (13 SP)
- **Título**: Optimizar listado de libros.
- **Descripción**: Implementar lazy loading (infinite scroll o paginación), carga diferida de imágenes, y minimizar tiempo a interacción. Considerar virtual scroll si el listado es grande.
- **Subtareas**:
  - [ ] Decidir estrategia: paginación clásica vs infinite scroll.
  - [ ] Backend: añadir `page/limit` (o cursor) a endpoint de libros si falta.
  - [ ] Front: cargar primera página rápido (skeleton) y siguientes bajo demanda.
  - [ ] Lazy load de imágenes (atributos/IntersectionObserver) + placeholders.
  - [ ] Evitar renders masivos (trackBy/@for, o virtual scroll si hace falta).
  - [ ] Medir mejora (Lighthouse) y fijar objetivo (TTI/LCP).
- **Entregables**:
  - API soportando paginación (si no existe) y front consumiéndola.
  - Mejoras medibles en carga.
- **Dependencias**: puede requerir cambios en backend de “libros”.
- **Peso**: 13.

### B4. Performance pass (Home) (5 SP)
- **Título**: Revisión de rendimiento y bundle.
- **Descripción**: Analizar bundle, activar estrategias de carga diferida (routes), optimizar imágenes/assets, y ajustar caching.
- **Subtareas**:
  - [ ] Revisar bundle del Home (dependencias pesadas, split points).
  - [ ] Asegurar lazy loading real de rutas y features no críticas.
  - [ ] Optimizar assets (imágenes, vídeo, fuentes) y caching headers.
  - [ ] Reducir trabajo main-thread (Three.js + listado libros).
  - [ ] Medir antes/después (Lighthouse o Web Vitals) y guardar resultado.
  - [ ] Crear lista corta de “reglas” para evitar regresiones.
- **Entregables**:
  - Lista de cambios aplicados.
  - Métricas antes/después (Lighthouse o similar).
- **Dependencias**: B1–B3.
- **Peso**: 5.

## Priorización sugerida
- **Primero**: B1 (bloqueo visual), B3 (rendimiento real), A1–A5 (MVP de trueque funcional).
- **Después**: A8–A10 (UX completa + chat), A6–A7 (caducidad + notificaciones).
- **Finalmente**: A11–A14 (moderación, ratings, hardening, QA).

## Riesgos y mitigaciones
- **Alcance alto del trueque**: dividir en releases internos (MVP → chat → moderación/ratings).
- **Dependencias de paginación**: confirmar endpoints actuales de libros para no duplicar esfuerzos.
- **Tiempo de assets (vídeo)**: acordar fuente y formato final cuanto antes.
