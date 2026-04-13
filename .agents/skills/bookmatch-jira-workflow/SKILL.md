---
name: bookmatch-jira-workflow
description: Planifica y actualiza trabajo en Jira BookMatch (sprints, historias, subtareas, estados TO DO / IN PROGRESS / IN REVIEW / DONE y comentarios de revisión). Usar cuando el usuario pida crear o mover issues en SCRUM, repartir tareas entre el equipo de tres, alinear con un sprint, o usar el MCP de Atlassian con este proyecto.
---

# BookMatch — workflow Jira (skill operativa)

Índice de reglas y skills del monorepo: **`AGENTS.md`** en la raíz del repositorio.

## Referencia rápida (MCP / API)

- **cloudId:** `ffc59d0f-7fc2-48d1-86ba-0ab9d508d4be` (también válido como contexto del sitio `bookmatch.atlassian.net` donde el cliente lo derive solo).
- **projectKey:** `SCRUM`
- **Tipos:** entregables de alto nivel como **Historia** (`issueTypeName`: `Historia`); trabajo por persona como **Subtarea** (`issueTypeName`: `Subtask` en este proyecto) con **`parent`** = clave de la Historia padre (p. ej. `SCRUM-120`).

Los **IDs de sprint** cambian por sprint: obtener el sprint con JQL (p. ej. issues ya en “Sprint 9”) o con búsqueda; asignar sprint vía campo de sprint del proyecto (en instancias anteriores: `customfield_10020` con el id numérico del sprint) solo cuando el usuario pida explícitamente meter el issue en un sprint concreto.

## Modelo mental

1. **Sprint** (1–2 semanas) → contiene **historias**.
2. Cada **historia** → varias **subtareas** (reparto entre **3** integrantes).
3. **Capacidad:** orientar el plan hacia **~36 puntos de historia por sprint** (equipo de tres), sumando las historias comprometidas en ese sprint.

## Reglas de tablero para subtareas

Estados de referencia del equipo (mapear a los nombres reales del workflow al llamar a transiciones API):

| Estado      | Significado |
|------------|-------------|
| TO DO      | No iniciada |
| IN PROGRESS | En curso |
| IN REVIEW  | Pendiente de revisión (desde IN PROGRESS) |
| DONE       | Aprobada en revisión |

**Transiciones**

- **IN REVIEW → DONE:** exigir **comentario** que documente que la revisión es correcta (qué se validó).
- **IN REVIEW → IN PROGRESS:** exigir **comentario** con el motivo del rechazo y acciones concretas.

No marcar DONE sin pasar por la revisión acordada ni sin el comentario correspondiente.

## Checklist al crear trabajo nuevo

1. Confirmar **sprint** (nombre o “activo / próximo”).
2. Crear o elegir **Historia** con resumen y criterios claros.
3. Crear **Subtareas** por persona o por frente de trabajo; asignar **assignee** si se conoce el account id (`lookupJiraAccountId`).
4. Si el proyecto usa **story points**, que el total de historias del sprint sea coherente con el objetivo **~36 puntos por sprint**.
5. Dejar subtareas en **TO DO** salvo que el usuario pida iniciarlas ya en **IN PROGRESS**.

## Integración MCP

Usar herramientas Atlassian/Jira del MCP conectado: `createJiraIssue`, `editJiraIssue`, `transitionJiraIssue`, `addCommentToJiraIssue`, `searchJiraIssuesUsingJql`, etc. Antes de transicionar, usar `getTransitionsForJiraIssue` para ids válidos del workflow.

Si los nombres de estado en Jira están en **español** (p. ej. “Tareas por hacer”, “Finalizada”), seguir el **mismo flujo lógico** y elegir la transición equivalente, no forzar nombres en inglés en la API.
