# Contribución

### Flujo Git (fuente de verdad en el repo)

El detalle completo está en `GIT-WORKFLOW.md` en la raíz del monorepo. Resumen:

* `main` — línea estable / producción.
* `develop` — integración del equipo.
* **Ramas personales** (`sergii`, `samuel`, `lucas` u otras acordadas) — trabajo diario; se integran en `develop` vía merge o **Pull Request**.

### Día a día

1. `git checkout develop && git pull`
2. Trabajar en tu rama o crear feature/`feat-…` según acuerdo del equipo.
3. Commits pequeños y mensajes claros.
4. Antes de integrar: `git pull origin develop`, resolver conflictos, ejecutar **tests/lint** donde existan (`BookMatch-Backend`: `npm test`; Angular: `npm test` / checks del proyecto).
5. **PR hacia** `develop` con descripción y, si aplica, enlace **Jira** (`SCRUM-…`).

### Commits: Conventional Commits (recomendado)

<!\[CDATA\[feat: … fix: … docs: … refactor: … test: … chore: …\]\]>

Ejemplo: `feat(payments): optional successUrl in checkout`

### Calidad

* TypeScript en front y back; respetar formato del repo (**Prettier** en Angular según `package.json`).
* No commitear `.env` ni secretos.
* Tras cambios de API o producto: actualizar **Swagger** (`/api-docs`) y, si procede, **Confluence** (Changelog + página temática) — ver skill/reglas del equipo para Jira y wiki.

### Documentación y tareas

* **Jira:** flujo de historias/subtareas y sprint (regla `@bookmatch-jira-workflow` en Cursor si la usáis).
* **Confluence:** Changelog Reciente \+ página técnica afectada.

---

**Actualización:** abril 2026 — alineado con `GIT-WORKFLOW.md`.