import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CookieConsentService } from '@core/services/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent-banner',
  standalone: true,
  imports: [TranslateModule, RouterLink],
  templateUrl: './cookie-consent-banner.component.html',
  styleUrl: './cookie-consent-banner.component.scss',
})
export class CookieConsentBannerComponent {
  protected readonly consent = inject(CookieConsentService);

  accept(): void {
    this.consent.accept();
  }

  reject(): void {
    this.consent.reject();
  }
}
