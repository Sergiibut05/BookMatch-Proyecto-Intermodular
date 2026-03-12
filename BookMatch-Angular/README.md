# BookMatch Angular

Frontend de BookMatch construido con Angular standalone, Firebase y Stripe.
Esta aplicacion cubre autenticacion, catalogo de libros, carrito, pagos,
perfil de usuario y foro comunitario.

## Stack principal

- Angular 21 (standalone components)
- Firebase (Auth, Firestore, Storage)
- Stripe Checkout
- Tailwind CSS + SCSS
- ngx-translate (es/en)

## Estructura funcional

- `src/app/core`: servicios, guards, pipes y directivas globales
- `src/app/features`: pantallas de negocio (auth, catalogo, perfil, foro, pagos)
- `src/app/shared`: componentes reutilizables y modelos de dominio
- `src/environments`: configuracion por entorno

## Arquitectura tecnica

### Capas de frontend

- **Presentacion (`features` y `shared`)**: componentes standalone, formularios reactivos y vistas.
- **Aplicacion (`core/services`)**: casos de uso de UI, orquestacion de flujos y consumo HTTP.
- **Dominio liviano (`shared/models`)**: contratos TypeScript para catalogo, pedidos, foro y usuarios.
- **Infraestructura cliente**: Firebase SDK, ngx-translate y Stripe redireccionado desde backend.

### Flujo de autenticacion

1. Login/registro con Firebase Authentication.
2. Obtencion de ID token en cliente.
3. Sincronizacion de perfil con backend (`/users/profile`).
4. Uso de `Authorization: Bearer <token>` en peticiones protegidas.
5. `authGuard` protege rutas privadas y conserva `returnUrl`.

### Flujo de compra

1. El usuario anade libros al carrito (`CartService`) o compra directa desde detalle.
2. Frontend solicita sesion de checkout al backend (`PaymentService`).
3. Backend crea sesion Stripe y devuelve URL.
4. Frontend redirige a Stripe Checkout.
5. Al volver, se valida sesion para mostrar confirmacion y actualizar historial.

### Foro y comunidad

- Foros (`ForumsService`) agrupan temas.
- Posts (`PostsService`) representan hilos/discusiones.
- Comentarios jerarquicos (`CommentsService`) permiten respuestas anidadas.
- Votaciones (`VotesService`) ajustan relevancia por score.

## Arranque local

```bash
npm install
npm start
```

Aplicacion disponible en `http://localhost:4200`.

## Scripts utiles

```bash
npm start             # desarrollo
npm run build         # build produccion
npm test              # tests unitarios
npm run docs:serve    # compodoc en local (http://localhost:8080)
npm run docs:build    # genera documentacion en ./docs
```

## Variables y dependencias externas

Revisa `src/environments/environment.ts` para:

- configuracion de Firebase
- `stripePublishableKey`
- `apiUrl` del backend

## Flujo general de la app

1. El usuario se autentica con Firebase (email/password o Google).
2. El frontend recupera y sincroniza el perfil del backend.
3. El catalogo se consume desde API protegida por token.
4. La compra puede hacerse desde detalle o carrito usando Stripe Checkout.
5. Tras el pago, la app muestra confirmacion y permite revisar historial.

## Documentacion con Compodoc

Este proyecto esta preparado para generar documentacion tecnica navegable:

```bash
npm run docs:serve
```

Y para build estatico:

```bash
npm run docs:build
```

Si despliegas en Vercel con el wrapper `compodoc-vercel`, usa:

```bash
npm run docs:build:vercel
```

### Recomendaciones para mantener buena documentacion

- Documentar siempre metodos publicos con `@param`, `@returns` y `@example`.
- Priorizar el "por que" y el "como usar" frente a describir lo obvio.
- Actualizar README y JSDoc en el mismo PR cuando cambie un flujo funcional.
