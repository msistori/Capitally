import { Component } from '@angular/core';
import { AnalyticsService } from '../../analytics/analytics.service';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent {
  readonly show$ = this.analytics.showConsentBanner$;

  constructor(private analytics: AnalyticsService) {}

  accept(): void {
    this.analytics.grantConsent();
  }

  reject(): void {
    this.analytics.revokeConsent();
  }
}
