---
name: bookmatch-angular
description: Estándares BookMatch para el frontend Angular 21 del monorepo — standalone, signals, control flow @if/@for, Tailwind antes que SCSS, RxJS y clean code. Usar al implementar o revisar features en BookMatch-Angular.
---

# BookMatch — skill Angular

## Cuándo usarla

- Consulta **`AGENTS.md`** en la raíz del repo para el mapa completo de reglas y hooks.
- Nuevo componente, ruta, servicio o refactor en **`BookMatch-Angular/`**.
- Revisión de PR de frontend alineada con convenciones del repo.

## Checklist rápido

1. **Standalone:** sin nuevos `NgModule`; `imports: [...]` en el componente.
2. **Rutas:** `loadComponent` en `app.routes.ts` si es una vista nueva.
3. **Plantillas:** `@if` / `@for` en código nuevo; evitar `*ngIf`/`*ngFor` salvo coherencia con archivo legacy.
4. **Estado:** signals para UI local; Observables + `async` pipe o `takeUntilDestroyed` para HTTP/eventos.
5. **Estilo:** Tailwind en el `.html`; SCSS del componente solo si es necesario.
6. **i18n:** claves en `assets/i18n` si el texto es visible al usuario.
7. **API:** `environment.apiUrl`; token vía `AuthService` donde corresponda.
8. **Calidad:** funciones pequeñas, sin secretos, Prettier del `package.json`.

## Documentación

- API y guías recientes: **https://angular.dev/**
- Si el entorno tiene MCP Context7, pedir documentación de **Angular** para APIs concretas (signals, control flow, etc.).

## Regla asociada

- **@bookmatch-angular** / regla con glob `BookMatch-Angular/**/*.{ts,html,scss,css}`.

## Agente dedicado en Cursor (opcional)

En **Cursor Settings → Chat → Custom modes** (o el flujo de “Agent” que use tu versión), podés crear un modo con instrucciones del sistema resumidas así:

> Eres el desarrollador frontend del proyecto BookMatch en la carpeta BookMatch-Angular. Stack: Angular 21, standalone, signals, @if/@for, Tailwind, RxJS, Firebase, ngx-translate, Capacitor. Prioriza Tailwind sobre SCSS del componente; no crees NgModules nuevos; sigue clean code y los patrones de app.routes.ts y core/services.

Así tenés un “agente” especializado sin duplicar archivos: la **regla** aplica por archivo abierto y el **modo** refuerza el rol en conversaciones largas.
