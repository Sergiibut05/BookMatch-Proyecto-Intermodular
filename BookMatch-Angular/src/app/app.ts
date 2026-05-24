import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { CookieConsentBannerComponent } from './shared/components/cookie-consent-banner/cookie-consent-banner.component';
import { TranslationService } from './core/services/translation.service';
import { CookieConsentService } from './core/services/cookie-consent.service';

/**
 * Componente raíz de la aplicación: router outlet, loader inicial y configuración de idioma.
 * Muestra el loader durante 2.5 s y aplica la clase 'loader-active' al body mientras está visible.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CookieConsentBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private translationService = inject(TranslationService);
  private cookieConsent = inject(CookieConsentService);

  /** Título de la aplicación. */
  protected readonly title = signal('BookMatch-Angular');
  /** Si el loader inicial está visible. */
  showLoader = signal(true);

  /** Añade clase loader-active al body y effect para sincronizar. */
  constructor() {
    // Agregar la clase inmediatamente al iniciar (loader empieza visible)
    if (typeof document !== 'undefined') {
      document.body.classList.add('loader-active');
    }

    // Agregar o remover clase al body cuando el loader cambia
    effect(() => {
      const loaderVisible = this.showLoader();
      if (loaderVisible) {
        document.body.classList.add('loader-active');
      } else {
        document.body.classList.remove('loader-active');
      }
    });
  }

  /** Oculta el loader tras 2.5 s y aplica consentimiento de cookies / analytics. */
  ngOnInit(): void {
    this.cookieConsent.applyStoredConsent();

    setTimeout(() => {
      this.showLoader.set(false);
    }, 2500);
  }
}
