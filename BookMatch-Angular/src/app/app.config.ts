import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom, inject } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideFirebaseApp, initializeApp, FirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideAnalytics, ScreenTrackingService } from '@angular/fire/analytics';
import { initializeAnalytics } from 'firebase/analytics';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { provideQueryClientOptions } from '@ngneat/query';

// ── Directional view transitions ─────────────────────────────────────────────
// We track history position with a custom `_bm_pos` counter stored inside
// each history.state entry (same pattern used by Nuxt, TanStack Router, etc.).
// pushState → new entry → increment counter.
// popstate  → read destination _bm_pos and compare with current → back or fwd.
let pendingBackNav = false;
let _bmHistoryPos = 0;

/**
 * Marca la siguiente navegación programática como "hacia atrás" para que
 * la animación de View Transition entre desde la izquierda en vez de la derecha.
 * Llamar justo antes de `router.navigate(...)`.
 */
export function markNavBack(): void {
  pendingBackNav = true;
}

if (typeof window !== 'undefined') {
  // Seed the current entry with _bm_pos = 0 if not already present
  if (history.state?._bm_pos === undefined) {
    history.replaceState({ ...history.state, _bm_pos: 0 }, '');
  } else {
    _bmHistoryPos = history.state._bm_pos;
  }

  // Intercept pushState to stamp every new entry with an incrementing position
  const _origPush = history.pushState.bind(history);
  history.pushState = function (state: any, title: string, url?: string | null) {
    _bmHistoryPos++;
    return _origPush({ ...(state ?? {}), _bm_pos: _bmHistoryPos }, title, url);
  };

  // Intercept replaceState so the _bm_pos stays consistent after URL replacements
  const _origReplace = history.replaceState.bind(history);
  history.replaceState = function (state: any, title: string, url?: string | null) {
    return _origReplace({ ...(state ?? {}), _bm_pos: _bmHistoryPos }, title, url);
  };

  // On popstate the destination _bm_pos is already stamped on history.state
  window.addEventListener('popstate', () => {
    const destPos: number = history.state?._bm_pos ?? 0;
    pendingBackNav = destPos < _bmHistoryPos;
    _bmHistoryPos = destPos;
  }, { capture: true });
}

/**
 * Loader de traducciones basado en archivos JSON bajo `assets/i18n`.
 */
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) { }

  /**
   * @param lang Codigo de idioma (por ejemplo `es` o `en`)
   * @returns Observable con el diccionario de traducciones
   */
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

/**
 * Factory usada por ngx-translate para instanciar el loader HTTP.
 */
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

/**
 * Configuracion global de Angular para BookMatch.
 *
 * Incluye router con transiciones, HttpClient, inicializacion de Firebase
 * y soporte de internacionalizacion con ngx-translate.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }: { transition: ViewTransition }) => {
          const isBack = pendingBackNav;
          pendingBackNav = false;
          const root = document.documentElement;
          if (isBack) {
            root.style.setProperty('--vt-old-anim', 'proExitBack');
            root.style.setProperty('--vt-new-anim', 'proEnterBack');
            root.style.setProperty('--vt-old-origin', 'center right');
            root.style.setProperty('--vt-new-shadow', '15px 0 40px rgba(0,0,0,.15)');
          } else {
            root.style.setProperty('--vt-old-anim', 'proExit');
            root.style.setProperty('--vt-new-anim', 'proEnter');
            root.style.setProperty('--vt-old-origin', 'center left');
            root.style.setProperty('--vt-new-shadow', '-15px 0 40px rgba(0,0,0,.15)');
          }
          transition.finished.then(() => {
            root.style.removeProperty('--vt-old-anim');
            root.style.removeProperty('--vt-new-anim');
            root.style.removeProperty('--vt-old-origin');
            root.style.removeProperty('--vt-new-shadow');
          });
        }
      }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideQueryClientOptions({
      defaultOptions: {
        queries: {
          // Datos de catálogo: frescos 5 min, en caché 10 min.
          // Los carruseles del home reutilizarán la caché en lugar de volver a pedir.
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 10,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    }),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => {
      const app = inject(FirebaseApp);
      return initializeAnalytics(app, {
        config: {
          debug_mode: !environment.production
        }
      });
    }),
    ScreenTrackingService,
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )

  ]
};