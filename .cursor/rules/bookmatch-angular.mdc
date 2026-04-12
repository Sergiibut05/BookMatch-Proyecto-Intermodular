---
description: BookMatch Angular — standalone, signals, control flow, Tailwind, RxJS, clean code. Archivos bajo BookMatch-Angular o @bookmatch-angular.
globs: BookMatch-Angular/**/*.{ts,html,scss,css}
alwaysApply: false
---

# BookMatch — frontend Angular

**Invocación:** esta regla se aplica al editar archivos del glob; también puedes forzar contexto con **@bookmatch-angular**.

**Versión del proyecto:** Angular **21** (`BookMatch-Angular/package.json`). Los patrones “modernos” (standalone, signals, nuevo control flow) son los de **Angular 17+** y siguen siendo la referencia; no reintroducir estilo pre-v15 salvo migración explícita.

## Arquitectura de la app

- **Standalone por defecto:** componentes/directivas/pipes con `standalone: true`. **No crear nuevos `NgModule`** para features; usar imports en el propio componente o rutas lazy.
- **Rutas:** `loadComponent` / lazy loading como en `app.routes.ts`; evitar cargar módulos clásicos.
- **Inyección:** preferir `inject()` cuando encaje con el estilo del archivo; respetar el patrón ya usado en el fichero (constructor vs `inject`).
- **Estado local UI:** preferir **signals** (`signal`, `computed`, `effect` con cuidado) para estado de componente; **RxJS** para flujos asíncronos, HTTP y integración con Firebase.
- **Async en plantillas:** `async` pipe o signal derivado; evitar suscripciones manuales sin `takeUntilDestroyed` o patrón equivalente.

## Plantillas

- Usar sintaxis de control **@if / @for / @switch** (no `*ngIf` / `*ngFor` en código nuevo salvo consistencia puntual con un archivo legado).
- **Change detection:** valorar `changeDetection: ChangeDetectionStrategy.OnPush` en componentes de presentación cuando no rompa el flujo existente.

## Estilos (Tailwind vs SCSS)

- **Prioridad:** clases **Tailwind** en el HTML para layout, espaciado, tipografía, colores y responsive.
- **SCSS del componente:** solo cuando Tailwind no basta (keyframes complejos, overrides muy específicos de terceros, `::ng-deep` puntual y documentado). No duplicar utilidades Tailwind en SCSS.
- Respetar **diseño existente** (header, footer, tokens visuales); no inventar paleta nueva sin alineación con el equipo.

## Datos y capas

- **HTTP:** servicios en `core` o feature; usar `HttpClient`; construir URLs con `environment.apiUrl`; cabeceras `Authorization` según `AuthService`.
- **Firebase / Stripe / i18n:** seguir patrones ya presentes (`@angular/fire`, `@ngx-translate`, Stripe.js).
- **Formularios:** **reactive forms** tipados donde sea posible; validaciones claras y mensajes vía i18n cuando exista clave.

## Calidad (clean code)

- Funciones y componentes **pequeños**, una responsabilidad principal; nombres **descriptivos** en inglés para símbolos de código (comentarios pueden seguir el idioma del equipo).
- Evitar lógica de negocio pesada en plantillas; extraer a métodos, computed signals o servicios.
- No dejar `console.log` en código de producción; usar flujo de debug acordado.
- **No** commitear secretos; solo `environment` con claves públicas permitidas (Firebase client, Stripe publishable).

## Tests

- Donde haya tests unitarios del feature, mantener o ampliar cobertura; ejecutar `npm test` en `BookMatch-Angular` antes de dar por cerrado un cambio grande.

## Documentación viva

- Para dudas de API de Angular recientes, usar documentación oficial actual (p. ej. **angular.dev**) o Context7 si está disponible.
