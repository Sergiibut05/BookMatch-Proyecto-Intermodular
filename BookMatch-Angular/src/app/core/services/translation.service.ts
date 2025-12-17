import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Servicio de traducción de la aplicación.
 * 
 * Proporciona funcionalidades para:
 * - Detectar el idioma del sistema automáticamente
 * - Cambiar el idioma en tiempo real
 * - Persistir la elección del usuario en localStorage
 * - Cargar idioma guardado al iniciar la aplicación
 * 
 * Idiomas soportados: español (es), inglés (en)
 */
@Injectable({
    providedIn: 'root'
})
export class TranslationService {

    private translate = inject(TranslateService);

    private readonly STORAGE_KEY = 'app-language';

    private readonly AVAILABLE_LANGUAGES = ['es', 'en'];

    private readonly DEFAULT_LANGUAGE = 'es';

    /**
     * Inicializa el servicio de traducción.
     * 
     * Prioridad de carga de idioma:
     * 1. Idioma guardado en localStorage (elección previa del usuario)
     * 2. Idioma del navegador (si está soportado)
     * 3. Idioma por defecto (español)
     * 
     * Configura ngx-translate con los idiomas disponibles.
     */
    constructor() {
        this.translate.addLangs(this.AVAILABLE_LANGUAGES);
        this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);

        const savedLang = this.getSavedLanguage();
        if (savedLang) {
            this.setLanguage(savedLang);
        } else {
            const browserLang = this.detectBrowserLanguage();
            this.setLanguage(browserLang);
        }
    }

    /**
     * Detecta el idioma configurado en el navegador del usuario.
     * 
     * Intenta obtener el idioma del navegador y verifica si está
     * en la lista de idiomas soportados.
     * 
     * @returns Código de idioma (es, en) o idioma por defecto si no está soportado
     */
    private detectBrowserLanguage(): string {
        const browserLang = this.translate.getBrowserLang();
        return this.AVAILABLE_LANGUAGES.includes(browserLang || '')
            ? browserLang!
            : this.DEFAULT_LANGUAGE;
    }

    /**
     * Obtiene el idioma guardado en localStorage.
     * 
     * @returns Código de idioma guardado o null si no hay ninguno
     */
    private getSavedLanguage(): string | null {
        return localStorage.getItem(this.STORAGE_KEY);
    }

    /**
     * Establece el idioma activo de la aplicación.
     * 
     * Cambia el idioma en ngx-translate y guarda la elección
     * en localStorage para futuras sesiones.
     * 
     * @param lang - Código del idioma a establecer (es, en)
     * 
     * @example
     * this.translationService.setLanguage('en');
     */
    setLanguage(lang: string): void {
        if (this.AVAILABLE_LANGUAGES.includes(lang)) {
            this.translate.use(lang);
            localStorage.setItem(this.STORAGE_KEY, lang);
        }
    }

    /**
     * Obtiene el idioma activo actual.
     * 
     * @returns Código del idioma actual (es, en)
     */
    getCurrentLanguage(): string {
        return this.translate.currentLang || this.DEFAULT_LANGUAGE;
    }

    /**
     * Obtiene la lista de idiomas disponibles.
     * 
     * @returns Array con los códigos de idiomas soportados
     */
    getAvailableLanguages(): string[] {
        return this.AVAILABLE_LANGUAGES;
    }

    /**
     * Traduce una clave instantáneamente.
     * 
     * Útil para traducciones en código TypeScript.
     * Para templates HTML, usar el pipe translate directamente.
     * 
     * @param key - Clave de traducción (ej: 'LOGIN.TITLE')
     * @param params - Parámetros opcionales para interpolación
     * @returns Texto traducido
     * 
     * @example
     * const title = this.translationService.instant('LOGIN.TITLE');
     */
    instant(key: string, params?: any): string {
        return this.translate.instant(key, params);
    }
}