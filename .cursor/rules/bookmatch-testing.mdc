---
description: BookMatch — tests Angular (Karma/Jasmine) y backend (Jest). @bookmatch-testing o archivos *.spec.ts / src/tests.
globs:
  - BookMatch-Angular/**/*.spec.ts
  - BookMatch-Backend/src/tests/**/*.ts
alwaysApply: false
---

# BookMatch — testing

**Invocación:** **@bookmatch-testing** o archivos del glob.

## Frontend (`BookMatch-Angular`)

- **Runner:** Karma + Jasmine (`npm test`).
- Ficheros: **`*.spec.ts`** junto al componente/servicio o en la misma feature.
- Patrones: `TestBed`, `ComponentFixture`, mocks de `HttpClient` o servicios con `jasmine.createSpyObj` según el estilo del archivo existente.
- No mezclar sintaxis de Jest en specs de Angular salvo migración explícita del proyecto.

## Backend (`BookMatch-Backend`)

- **Runner:** **Jest** con `NODE_ENV=test` (ver `package.json`: `NODE_OPTIONS=--experimental-vm-modules`).
- Ubicación: **`src/tests/*.test.ts`** (p. ej. `auth.test.ts`, `users.test.ts`).
- Imports ESM con extensión **`.js`** en rutas relativas compiladas, coherente con el resto del backend.
- Supertest u otros: seguir el patrón ya usado en esos tests.

## Buenas prácticas

- Un comportamiento por test cuando sea posible; nombres que expliquen el caso.
- No depender de orden global; limpiar mocks entre tests si hace falta.
- Tras cambios en lógica crítica (auth, pagos, pedidos), ampliar o actualizar tests existentes.

## Comandos

```bash
cd BookMatch-Angular && npm test
cd BookMatch-Backend && npm test
```
