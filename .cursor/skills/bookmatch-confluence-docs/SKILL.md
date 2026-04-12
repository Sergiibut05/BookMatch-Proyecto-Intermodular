---
name: bookmatch-confluence-docs
description: Documenta cambios del proyecto BookMatch en Confluence (espacio PM): actualiza Changelog Reciente con clave Jira y detalle, y la página técnica relacionada (frontend, backend, API, Stripe, etc.). Usar cuando el usuario pida documentar en Confluence, sincronizar wiki con el repo, o editar el hub BookMatch – Proyecto Intermodular.
---

# BookMatch — documentación en Confluence (skill operativa)

Índice general del monorepo (reglas, skills, hooks): **`AGENTS.md`** en la raíz del repositorio.

## Identificadores (MCP)

- **cloudId:** `ffc59d0f-7fc2-48d1-86ba-0ab9d508d4be`
- **Espacio PM:** `spaceId` **`14843908`**, clave **`PM`**
- **Hub:** [BookMatch – Proyecto Intermodular](https://bookmatch.atlassian.net/wiki/spaces/PM/pages/16384001/) — **`pageId` `16384001`**
- **Changelog Reciente:** **`pageId` `18513964`** — siempre actualizar aquí además de la página temática cuando documentes un cambio de producto.

## Hub e índice

- El hub **`16384001`** incluye un **mapa del sitio por bloques** (visión, diseño/repo, puesta en marcha, dominio/API, cliente/servidor, ops, enlaces externos) y un índice lineal. Tras crear páginas nuevas, **añadir el enlace** en el hub y una línea en **Changelog Reciente**.
- **Nunca** pegar en Confluence API keys de Firebase (cliente), secretos Stripe, `DATABASE_URL` ni `FIREBASE_PRIVATE_KEY`: usar placeholders y enlazar a consolas o gestores de secretos.
- Versiones de frontend: contrastar `BookMatch-Angular/package.json` (p. ej. **Angular 21.x**); no asumir Angular 20 en páginas de arquitectura o stack.

## Mapa de páginas bajo el hub (referencia rápida)

| Tema | Título (Confluence) | `pageId` |
|------|---------------------|----------|
| Hub / índice | BookMatch – Proyecto Intermodular | `16384001` |
| Changelog | Changelog Reciente | `18513964` |
| Visión | Descripción General | `18546689` |
| Estado | Estado del Proyecto | `18546696` |
| Arquitectura | Arquitectura del Sistema | `18415624` |
| Repo | Estructura del Repositorio | `18546703` |
| Stack | Tecnologías Utilizadas | `18415639` |
| Setup | Requisitos Previos | `18481155` |
| Setup | Instalación y Configuración | `18415646` |
| Datos | Base de Datos | `18513949` |
| Datos | Modelos principales (BBDD) (hija) | `22675457` |
| Datos | Seeding / ingesta (hija) | `22609922` |
| Seguridad | Autenticación y Seguridad | `18579493` |
| Dominio | Módulos y Funcionalidades | `18710545` |
| API | API y Endpoints | `18481162` |
| Frontend | Frontend - Angular | `18546726` |
| Frontend | i18n (hija) | `18546740` |
| Backend | Backend - Express | `18546733` |
| Pagos | Sistema de Pagos con Stripe | `18579502` |
| Ops | Deployment y Producción | `18513957` |
| Soporte | Troubleshooting | `18415685` |
| Equipo | Contribución | `18710580` |
| Enlaces | Contacto y Recursos | `18415695` |

Usar `getConfluencePage` / `getConfluencePageDescendants` si la wiki cambia y hace falta refrescar IDs.

## Flujo obligatorio al documentar un cambio

1. **Obtener** la página objetivo con `getConfluencePage` (`contentFormat: markdown` salvo que ADF sea necesario).
2. **Editar** el cuerpo en memoria: en **Changelog Reciente**, añadir arriba (o en el bloque del mes vigente) una entrada con:
   - **Jira:** `SCRUM-XXX` (enlace smart opcional si el formato lo permite)
   - **Qué:** 1–3 frases o viñetas: funcionalidad, archivos/módulos tocados, entorno
   - **Notas:** breaking changes, flags, follow-ups
3. **Actualizar** la página temática (tabla de arriba) con un subapartado **Changelog / Actualizaciones** o ampliar el apartado equivalente.
4. **Persistir** con `updateConfluencePage`: pasar **`body` completo** (markdown o ADF según `contentFormat`), `pageId`, `cloudId`, y `versionMessage` descriptivo (p. ej. `docs: SCRUM-120 — pagos`).
5. Si falta una página dedicada, valorar `createConfluencePage` con `spaceId` y `parentId: "16384001"`.

## Herramientas MCP habituales

- `searchConfluenceUsingCql` — localizar páginas por título o espacio.
- `getConfluencePageDescendants` — árbol bajo el hub (`pageId` `16384001`).
- `updateConfluencePage`, `createConfluencePage` — escritura.

## Exactitud frente al código

- La página **Módulos y Funcionalidades** (`18710545`) debe reflejar los montajes de `BookMatch-Backend/src/app.ts` y los `*.routes.ts` bajo `modules/`. Tras cambiar rutas o auth, volver a contrastar la wiki (abril 2026: auditoría completa aplicada).
- **Estructura del Repositorio** (`18546703`): el backend no expone `posts` ni `votes` como raíces paralelas a `forums`; el montaje es jerárquico (`forums` → `posts` → `comments` / `votes`) más `routes/ai-chat.routes.ts` y `src/tests/`.
- **Backend - Express** (`18546733`), **Arquitectura** (`18415624`), **Deployment** (`18513957`) y **Tecnologías** (`18415639`) se revisaron en abril 2026 frente a `app.ts`, `config/env.ts` y `package.json`.
- **Requisitos** (`18481155`), **Instalación** (`18415646`), **Autenticación** (`18579493`), **Base de datos** (`18513949`), **Modelos** (`22675457`), **Seeding** (`22609922`), **Frontend** (`18546726`) e **i18n** (`18546740`) — misma revisión (abr 2026): Prisma `DIRECT_URL`, `env.ts`, rutas Angular reales, sin secretos en la wiki.
- **Descripción general** (`18546689`), **Estado del proyecto** (`18546696`), **Troubleshooting** (`18415685`), **Contribución** (`18710580`), **Contacto y recursos** (`18415695`) — cierre abr 2026: MVP vs roadmap, stack actual, guía operativa y enlaces sin proyecto Firebase fijo.
- **Auditoría:** en abril 2026 se contrastaron todas las páginas bajo el hub con el monorepo; ante cambios de rutas, variables de entorno o flujos, actualizar la wiki y una línea en **Changelog Reciente**.
- Otras reglas del repo (Angular, backend, Prisma, tests, secretos, Capacitor/Stripe): ver **`AGENTS.md`**.
- **API y Endpoints** no debe asumir un envoltorio JSON único de éxito/error: el backend suele devolver `{ message }` en errores y cuerpos variables en éxito; la fuente de verdad interactiva es `/api-docs`.

## Riesgos

- **Sobrescritura:** no llamar a `updateConfluencePage` sin el contenido actual mergeado; siempre leer antes.
- **Macros / ADF:** si el markdown no conserva macros, valorar `adf` o edición manual en Confluence para bloques delicados.
