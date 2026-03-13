import { Directive, inject, ViewContainerRef, TemplateRef, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural para renderizar contenido exclusivo de administradores.
 *
 * Uso:
 * `<button *isAdmin>...</button>`
 */
@Directive({
  selector: '[isAdmin]',
  standalone: true
})
export class IsAdminDirective {
  /** Servicio de autenticación para comprobar rol admin. */
  private authService = inject(AuthService);
  /** Contenedor donde se inserta la vista. */
  private viewContainer = inject(ViewContainerRef);
  /** Plantilla a mostrar si el usuario es admin. */
  private templateRef = inject(TemplateRef<any>);
  /** Si la vista está actualmente creada. */
  private hasView = false;

  /** Crea o destruye la vista según el signal isAdmin del AuthService. */
  constructor() {
    effect(() => {
      const isAdmin = this.authService.isAdmin();
      if (isAdmin && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!isAdmin && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}

