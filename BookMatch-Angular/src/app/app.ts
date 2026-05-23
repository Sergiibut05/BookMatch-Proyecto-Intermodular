import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { TranslationService } from './core/services/translation.service';
import { Analytics, logEvent, ScreenTrackingService } from '@angular/fire/analytics';

/**
 * Componente raíz de la aplicación: router outlet, loader inicial y configuración de idioma.
 * Muestra el loader durante 2.5 s y aplica la clase 'loader-active' al body mientras está visible.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private translationService = inject(TranslationService);
  private analytics = inject(Analytics, { optional: true });
  private screenTrackingService = inject(ScreenTrackingService, { optional: true });

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

  /** Oculta el loader tras 2.5 s. */
  ngOnInit(): void {
    // Verificar e inicializar Analytics
    if (this.analytics) {
      console.log('📊 [Firebase Analytics] Inicializado correctamente.');
      try {
        logEvent(this.analytics, 'app_open', { platform: 'web', timestamp: Date.now() });
        console.log('🚀 [Firebase Analytics] Evento de prueba "app_open" enviado.');
      } catch (err) {
        console.error('❌ [Firebase Analytics] Error al enviar evento de prueba:', err);
      }
    } else {
      console.warn('⚠️ [Firebase Analytics] No se pudo inicializar. Comprueba la configuración de Firebase.');
    }

    if (this.screenTrackingService) {
      console.log('📡 [Screen Tracking] Servicio de tracking automático de pantallas activo.');
    }

    // Ocultar el loader después de 2.5 segundos
    setTimeout(() => {
      this.showLoader.set(false);
    }, 2500);
  }
}
