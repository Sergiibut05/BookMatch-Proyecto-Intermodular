import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

/**
 * Pie de pagina global con enlaces legales y enlaces de navegacion secundaria.
 *
 * @example
 * ```html
 * <app-footer />
 * ```
 */
@Component({
  selector: 'app-footer',
  imports: [TranslateModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  currentYear = new Date().getFullYear();
}
