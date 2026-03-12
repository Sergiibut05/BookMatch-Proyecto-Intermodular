import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Loader inicial con transicion de salida.
 *
 * @example
 * ```html
 * <app-loader />
 * ```
 */
@Component({
  selector: 'app-loader',
  imports: [TranslateModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  fadeOut = false;

  /**
   * Activa efecto de desvanecido tras un breve retraso.
   */
  ngOnInit(): void {
    setTimeout(() => {
      this.fadeOut = true;
    }, 2000);
  }
}
