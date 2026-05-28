# Sistema de Pagos con Stripe

### Integración Completa

El proyecto integra **Stripe Checkout** para procesamiento de pagos seguro.

### Características Implementadas

✅ **Stripe Checkout** \- Página de pago alojada por Stripe   
✅ **Múltiples métodos de pago:** Card, Link, PayPal   
✅ **Dirección de envío obligatoria** \- Configurada para múltiples países   
✅ **Modo de prueba** \- Usa tarjetas de prueba sin cobrar dinero real   
✅ **Creación automática de órdenes** \- Se crean en la BD después del pago   
✅ **Actualización de stock** \- El stock se decrementa automáticamente   
✅ **Soporte para carrito** \- Pago de múltiples libros a la vez   
✅ **Webhooks** \- Procesamiento de eventos de Stripe   
✅ **Fallback** \- Sistema de respaldo si webhook falla   
✅ **URLs de retorno opcionales** (2026) - `successUrl` / `cancelUrl` en el body del checkout (un libro o carrito); ver **API y Endpoints**.

### Flujo de Pago Completo

<!\[CDATA\[1\. Usuario hace clic en Comprar (libro o carrito) ↓ 2\. Frontend → Backend: POST /api/payments/create-checkout-session (o ruta de carrito) Body: bookId, quantity \[; successUrl, cancelUrl opcionales\] ↓ 3\. Backend valida autenticación y stock ↓ 4\. Backend → Stripe: Crea Checkout Session - Configura productos (libros) - Configura dirección de envío - Configura URLs de éxito/cancelación (personalizadas o por defecto) - Añade metadata (userId, bookIds, etc.) ↓ 5\. Backend devuelve sessionId y checkoutUrl a Frontend ↓ 6\. Frontend redirige usuario a Stripe Checkout ↓ 7\. Usuario ingresa datos de pago y dirección de envío ↓ 8\. Stripe procesa el pago (modo test: no cobra dinero real) ↓ 9\. Stripe redirige a la URL de éxito (por defecto /payment-success?session\_id=…) ↓ 10\. Frontend → Backend: GET /api/payments/success?session\_id=… (con Bearer) ↓ 11\. Backend verifica sesión con Stripe ↓ 12\. Backend crea Order en PostgreSQL (si aplica) / actualiza stock vía webhook o fallback ↓ 13\. Backend puede enviar email de confirmación (según implementación) ↓ 14\. Frontend muestra página de confirmación\]\]>

### Webhooks de Stripe

Para desarrollo local, usar **Stripe CLI**:

<!\[CDATA\[# Instalar Stripe CLI # Windows: https://stripe.com/docs/stripe-cli # Mac: brew install stripe/stripe-cli/stripe # Autenticarse stripe login # Iniciar listener (reenvía webhooks a localhost) stripe listen --forward-to localhost:3000/api/payments/webhook\]\]>

Esto te dará un `webhook secret` que puedes añadir a tu `.env`:

<!\[CDATA\[STRIPE\_WEBHOOK\_SECRET=whsec\_...\]\]>

**Eventos procesados:**

* `checkout.session.completed` \- Pago completado exitosamente

### Tarjetas de Prueba

Para probar pagos en modo test:

| Tarjeta             | Resultado             |
| ------------------- | --------------------- |
| 4242 4242 4242 4242 | ✅ Pago exitoso        |
| 4000 0000 0000 0002 | ❌ Pago rechazado      |
| 4000 0025 0000 3155 | 🔐 Requiere 3D Secure |

**Datos de prueba:**

* Cualquier fecha futura (ej: `12/25`)
* Cualquier CVC (ej: `123`)
* Cualquier código postal (ej: `12345`)

### Configuración en Producción

1. Cambiar a **modo Live** en Stripe Dashboard
2. Obtener **Live API keys**
3. Configurar webhook en producción:

  * URL: `https://<tu-dominio-api>/api/payments/webhook`
  * Eventos: `checkout.session.completed`
4. Actualizar `STRIPE_SECRET_KEY` en `.env` de producción
5. Actualizar `stripePublishableKey` en `environment.prod.ts`

### Comentarios en Confluence

Puede haber **comentarios a pie** antiguos con el mismo tema; el **cuerpo de esta página** es la referencia principal junto a **API y Endpoints** y **Módulos y Funcionalidades**.