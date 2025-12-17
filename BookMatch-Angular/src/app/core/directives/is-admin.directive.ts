import { Directive, inject, ViewContainerRef, TemplateRef, effect } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[isAdmin]',
  standalone: true
})
export class IsAdminDirective {
  private authService = inject(AuthService);
  private viewContainer = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef<any>);
  private hasView = false;

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

