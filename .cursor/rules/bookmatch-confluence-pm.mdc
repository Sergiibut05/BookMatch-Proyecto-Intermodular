---
description: Confluence BookMatch — espacio PM, hub "Proyecto Intermodular", Changelog Reciente y documentación por capa (frontend/backend). Usar al pedir documentar en Confluence o alinear docs con el repo.
alwaysApply: false
---

# Confluence BookMatch (Project Management)

**Uso:** invocar con **@bookmatch-confluence-pm** cuando pidas documentar, revisar o reorganizar la wiki del proyecto. Índice de reglas/skills del monorepo: **`AGENTS.md`** en la raíz del repositorio.

## Dónde vive la documentación

- **Sitio:** `bookmatch.atlassian.net`
- **Espacio:** **Project Management** — clave **`PM`**
- **Página hub** (índice principal): [**BookMatch – Proyecto Intermodular**](https://bookmatch.atlassian.net/wiki/spaces/PM/pages/16384001/) — incluye **mapa del sitio por bloques** (visión, repo/stack, setup, dominio/API, cliente/servidor, ops) y enlaces a hijas: arquitectura, API, frontend, backend, Stripe, BBDD, changelog, etc.

## Regla de documentación tras un cambio

Cuando toque **documentar en Confluence** (entrega, feature, fix relevante):

1. **Changelog global** — editar la página **«Changelog Reciente»** (hija del hub): entrada clara con **clave Jira** (`SCRUM-XXX`), **título/resumen de la tarea**, **qué cambió** (comportamiento, módulos, riesgos si los hay) y fecha o sprint si aplica. Mantener formato legible (encabezados por mes o por fecha, listas con viñetas).
2. **Página temática** — actualizar la sección que corresponda al cambio (p. ej. nuevo componente Angular → **Frontend - Angular**; cambio de API → **API y Endpoints** o **Módulos y Funcionalidades**; pagos → **Sistema de Pagos con Stripe**). Añadir un bloque tipo **«Changelog / Actualizaciones»** en esa página si aún no existe, o ampliar el existente, con el mismo criterio: key Jira + qué se hizo.

No sustituir páginas enteras sin leer antes el contenido: Confluence exige reenviar el cuerpo completo al actualizar vía API.

## Orden y claridad

- La jerarquía bajo el hub ya agrupa por dominio; el hub incluye **mapa por bloques** e índice lineal. Mejoras de **orden** en el sidebar pasan por la UI de Confluence o por **mover** padres vía API — acordar cambios grandes con el equipo.
- Tras la **auditoría abril 2026**, mantener la wiki al día: cada cambio relevante de código o despliegue → **Changelog Reciente** + página temática.

## Límites

- Reordenar hermanos en el árbol (orden visual del sidebar) puede requerir la **UI de Confluence**; vía MCP suele ser fiable **cambiar `parent`** y **editar contenido**, no siempre la posición fina entre hermanos.
