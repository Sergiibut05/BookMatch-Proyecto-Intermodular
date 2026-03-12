import { Component, inject } from '@angular/core';

import { TranslationService } from '../../../core/services/translation.service';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Selector de idioma de la interfaz.
 *
 * @example
 * ```html
 * <app-language-selector />
 * ```
 */
@Component({
  selector: 'app-language-selector',
  imports: [TranslateModule],
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.scss'
})
export class LanguageSelectorComponent {
  translationService = inject(TranslationService);

  get currentLang(): string {
    return this.translationService.getCurrentLanguage();
  }

  /**
   * Cambia el idioma activo de la aplicacion.
   *
   * @param lang Codigo de idioma soportado (`es` o `en`)
   * @returns void
   */
  changeLanguage(lang: string): void {
    this.translationService.setLanguage(lang);
  }
}