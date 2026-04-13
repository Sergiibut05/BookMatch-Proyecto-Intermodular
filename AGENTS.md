# Guía para agentes e IA (BookMatch)

Este monorepo usa **Cursor** y **Antigravity**: reglas/workflows (`.cursor/rules/*.mdc` / `.agents/workflows/*.md`), skills (`.cursor/skills/*/SKILL.md` / `.agents/skills/*/SKILL.md`) y hooks (`.cursor/hooks.json`). Léelo al empezar una tarea grande o al incorporarte al proyecto.

## Estructura del repositorio

| Carpeta | Rol |
|---------|-----|
| `BookMatch-Angular/` | Frontend Angular 21, Tailwind, Capacitor, Firebase, ngx-translate |
| `BookMatch-Backend/` | API Express 5, Prisma, PostgreSQL, Stripe, Firebase Admin |

## Reglas (cuándo aplican)

| Regla | Activación | Uso |
|-------|------------|-----|
| **bookmatch-angular** | Archivos `BookMatch-Angular/**/*.{ts,html,scss,css}` o **@bookmatch-angular** | Standalone, signals, `@if`/`@for`, Tailwind antes que SCSS |
| **bookmatch-backend-node** | Archivos `BookMatch-Backend/**/*.ts` o **@bookmatch-backend-node** | Express 5, Prisma, Zod, ESM, seguridad, capas |
| **bookmatch-prisma** | Archivos bajo `BookMatch-Backend/prisma/**` o **@bookmatch-prisma** | Schema, migraciones, `DATABASE_URL` / `DIRECT_URL` |
| **bookmatch-testing** | `*.spec.ts` en Angular o `src/tests` en backend o **@bookmatch-testing** | Karma/Jasmine vs Jest, convenciones de tests |
| **bookmatch-secrets-env** | `environments/*.ts`, `env.production.example` o **@bookmatch-secrets-env** | No secretos en repo, qué va en `.env` |
| **bookmatch-cross-cutting** | `capacitor.config.ts`, `payments/*` o **@bookmatch-cross-cutting** | Capacitor (`webDir`, sync), Stripe (clave pública vs secreta, webhook) |
| **bookmatch-jira-workflow** | Solo **@bookmatch-jira-workflow** | Sprints, historias, subtareas (SCRUM) |
| **bookmatch-confluence-pm** | Solo **@bookmatch-confluence-pm** | Wiki PM, Changelog, documentar cambios |
| **bookmatch-git-branches** | Solo **@bookmatch-git-branches** (o al pedir git/commit/merge) | Ramas personales `sergii`/`samuel`/`lucas`, **siempre** integrar `develop` antes de empezar, merge seguro a `develop` |

## Skills (tareas repetibles)

| Skill | Cuándo |
|-------|--------|
| `bookmatch-angular` | Feature o revisión frontend |
| `bookmatch-backend` | Endpoints, servicios, Prisma |
| `bookmatch-fullstack` | Cambios que cruzan Angular + API + (opcional) docs |
| `bookmatch-jira-workflow` | Planificación / issues Jira |
| `bookmatch-confluence-docs` | Actualizar Confluence + Changelog |
| `bookmatch-git-branches` | Empezar tarea, sync con `develop`, commits, integración en `develop` |

## Hooks del proyecto

- **`beforeShellExecution`**: bloquea `git add` si la orden incluye ficheros **`.env`** (evita subir secretos). Ver `.cursor/hooks/guard-env-in-git.mjs`. (Nota: en Antigravity u otros editores se recomienda usar un pre-commit hook estándar de git para esto).

## Modos y Workflows (Cursor / Antigravity)

En ajustes de Cursor podéis crear modos de chat con instrucciones de sistema basados en las skills; en Antigravity, disponéis de la carpeta `.agents/workflows/` (ej: llamando con comando `/bookmatch-angular`).

## Documentación humana

- `GIT-WORKFLOW.md` — ramas y PRs  
- `README.md` — visión general  
- Confluence (espacio PM): hub *BookMatch – Proyecto Intermodular*

## Convención rápida

1. Toca código → las reglas con **glob** suelen cargarse solas en Cursor. En Antigravity, puedes invocar su workflow `/slash`.
2. **Git** (empezar tarea, merge, rama) → **@bookmatch-git-branches** o skill **bookmatch-git-branches** (o workflow `/bookmatch-git-branches`).
3. Jira / Confluence → **@** la regla correspondiente o bien el workflow **slash command**.
4. Tarea mixta → skill **bookmatch-fullstack** o **@** varias reglas.

---

*Última actualización: documentación de agentes y convenciones BookMatch.*
