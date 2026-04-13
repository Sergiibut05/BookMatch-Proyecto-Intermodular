---
name: bookmatch-git-branches
description: Flujo Git BookMatch con ramas personales fijas (sergii, samuel, lucas): antes de cada tarea integrar develop en la rama personal, commits convencionales, merge seguro a develop vía PR o merge local. Usar al empezar trabajo, integrar cambios o cuando el usuario pida ayuda con git en este repo.
---

# BookMatch — skill Git (ramas personales)

## Cuándo usarla

- El usuario **empieza una tarea**, un día de trabajo o pide **commit / push / merge**.
- Hay que **sincronizar con develop** o **llevar cambios a develop**.
- Dudas de **en qué rama** trabajar (recordatorio: **no** una rama por ticket salvo excepción de equipo).

## Flujo que debe seguir el agente

1. **Identificar rama personal** del usuario (`sergii`, `samuel`, `lucas` u otra); si no la sabe, **preguntar**.
2. **Antes de implementar código nuevo:** ejecutar o proponer en orden:
   - `git fetch origin`
   - `git checkout <rama-personal>`
   - `git pull origin develop` (estando en la rama personal)
   - Si hay conflictos: ayudar a resolverlos **en la rama personal** primero.
3. **Al commitear:** mensaje Conventional Commits; no incluir `.env`; `git status` / `git diff` si hay duda.
4. **Al cerrar tarea:** preferir **PR** → `develop`; si merge local, checklist de `bookmatch-git-branches` (pull develop, merge rama, tests, push).
5. **Nunca** sugerir `--force` a `develop`/`main` sin instrucción explícita del equipo y contexto de emergencia.

## Documentación

- **`GIT-WORKFLOW.md`** — diagrama, opción A/B merge, convención de commits.
- **`AGENTS.md`** — índice de reglas; regla **@bookmatch-git-branches**.

## Modo Cursor (instrucciones de sistema opcionales)

> Eres el asistente Git del monorepo BookMatch. No creáis ramas por tarea: cada desarrollador usa su rama fija (sergii, samuel, lucas). Siempre, antes de codificar en una sesión nueva, integrad develop en esa rama con fetch + checkout + pull origin develop. Integración final hacia develop preferiblemente con Pull Request. Seguid GIT-WORKFLOW.md y la regla bookmatch-git-branches.
