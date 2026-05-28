# Tecnologías Utilizadas

### Frontend

| Tecnología              | Versión | Propósito                        |
| ----------------------- | ------- | -------------------------------- |
| **Angular**             | 21.x    | Framework principal (standalone) |
| **TypeScript**          | \~5.9   | Lenguaje                         |
| **Tailwind CSS**        | 3.4.x   | Estilos utility-first            |
| **RxJS**                | 7.8.x   | Reactividad                      |
| **Firebase**            | 11.x    | Auth y storage en cliente        |
| **@angular/fire**       | 20.x    | Integración Angular ↔ Firebase   |
| **@stripe/stripe-js**   | 8.5.x   | Checkout en cliente              |
| **@capacitor/core**     | 7.4.x   | Capa nativa móvil                |
| **@capacitor/camera**   | 7.x     | Cámara en móvil                  |
| **@ngx-translate/core** | 17.x    | i18n                             |

_Versiones tomadas de_ `BookMatch-Angular/package.json` (rangos `^`); revisar el lockfile para pin exacto.

### Backend

| Tecnología                                  | Versión             | Propósito                |
| ------------------------------------------- | ------------------- | ------------------------ |
| **Node.js**                                 | 20+ (recomendado)   | Runtime                  |
| **Express**                                 | 5.1.x               | HTTP API                 |
| **TypeScript**                              | 5.9.x               | Lenguaje                 |
| **Prisma**                                  | 6.18+               | ORM PostgreSQL           |
| **PostgreSQL**                              | 16+ (según entorno) | Base de datos            |
| **Firebase Admin**                          | 13.6.x              | Verificación de tokens   |
| **Stripe**                                  | 20.x                | Pagos servidor           |
| **Zod**                                     | 4.1.x               | Validación               |
| **Winston**                                 | 3.18.x              | Logging                  |
| **Helmet**                                  | 8.1.x               | Cabeceras HTTP           |
| **express-rate-limit**                      | 8.2.x               | Límites de petición      |
| **swagger-ui-express** \+ **swagger-jsdoc** | ver package.json    | /api-docs                |
| **Jest**                                    | 30.x                | Tests                    |
| **Nodemailer**                              | 7.x                 | Email                    |
| **Cloudinary**                              | 2.8.x               | Imágenes (donde aplique) |

### Infraestructura y herramientas

| Herramienta          | Propósito                                                     |
| -------------------- | ------------------------------------------------------------- |
| **Git / GitHub**     | Código                                                        |
| **Docker**           | Opcional (si mantenéis Dockerfile / compose en el repo)       |
| **Vercel**           | Despliegue frecuente de frontend y/o API (ver **Deployment**) |
| **Firebase Console** | Auth, proyecto                                                |
| **Stripe Dashboard** | Pagos y webhooks                                              |
| **Google Books API** | Seeding de catálogo                                           |
| **Prisma Studio**    | Inspección de datos                                           |

---

**Actualización:** abril 2026 — Angular 21 y versiones backend según `BookMatch-Backend/package.json`.