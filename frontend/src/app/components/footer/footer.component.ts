import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../analytics/analytics.service';
import { TranslateService } from '@ngx-translate/core';
import { LOCALIZED_ROUTES, currentOrDefaultLanguage } from '../../routing/localized-routes';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();
  
  constructor(
    private analytics: AnalyticsService,
    private router: Router,
    private translate: TranslateService
  ) {}

  get termsLink(): string {
    return LOCALIZED_ROUTES[this.currentLanguage].legal.terms;
  }

  get privacyLink(): string {
    return LOCALIZED_ROUTES[this.currentLanguage].legal.privacy;
  }

  get cookiesLink(): string {
    return LOCALIZED_ROUTES[this.currentLanguage].legal.cookies;
  }

  get installLink(): string {
    return LOCALIZED_ROUTES[this.currentLanguage].install;
  }

  openPrivacyPreferences(): void {
    this.analytics.reopenConsentPreferences();
  }

  private get currentLanguage() {
    return currentOrDefaultLanguage(this.router.url, this.translate.currentLang);
  }
}
