import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { provideQueryClientOptions } from '@ngneat/query';

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
      withViewTransitions({ skipInitialTransition: true }),
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