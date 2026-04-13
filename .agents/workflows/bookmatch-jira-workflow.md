---
description: BookMatch en Jira — sprints, historias, subtareas, estados del tablero y revisión. Usar al planificar trabajo, crear issues o hablar de tablero/SCRUM.
alwaysApply: false
---

# Flujo Jira BookMatch (equipo)

**Uso:** no está en modo always-on. Invócala con **@bookmatch-jira-workflow** (o el nombre que muestre el selector) cuando el contexto sea Jira, sprints o reparto de tareas del proyecto. Índice de reglas/skills: **`AGENTS.md`** en la raíz del repo.

## Contexto Atlassian

- **Sitio:** `bookmatch.atlassian.net`
- **Proyecto Jira (clave):** `SCRUM` (BookMatch, team-managed)
- **Tipos habituales:** **Historia** para entregables de sprint; **Subtarea** para el trabajo concreto por persona.

No hace falta memorizar IDs de sprint: el agente puede resolver sprint activo/futuro por JQL o por nombre (p. ej. “Sprint 9”) vía MCP.

## Planificación por tiempo

- Los **sprints** suelen durar **1 o 2 semanas**.
- Cada sprint agrupa **una o varias historias**.
- Cada **historia** se descompone en **subtareas** asignadas a cada miembro del equipo (**3 personas**).
- **Capacidad orientativa (recomendación):** **~36 puntos de historia por sprint** para el equipo (tres personas), sumando las **historias** que entráis en ese sprint — coherente con planificación Scrum. Las subtareas reparten el trabajo; los puntos suelen vivir en la historia (o en la convención que uséis en Jira).

## Flujo de subtareas en el tablero (historia en curso)

Orden lógico de estados (usar los **nombres exactos** que tenga vuestro workflow en Jira; en documentación interna los llamáis así):

1. **TO DO** — aún no iniciada.
2. **IN PROGRESS** — iniciada, no terminada.
3. **IN REVIEW** — salida desde IN PROGRESS para revisión.
4. **DONE** — solo tras revisión **correcta**, con **comentario** que indique que está bien.

Si la revisión **no** es correcta: vuelta a **IN PROGRESS** y **comentario obligatorio** explicando qué falla o qué hay que corregir.

## Principios para el agente

- Crear o mover issues **respetando** esta jerarquía y el workflow; no dar por cerrada una subtarea sin el comentario acordado en transiciones de revisión.
- Preferir **subtareas bajo una Historia** para trabajo individual frente a mezclar todo en una sola issue genérica.
