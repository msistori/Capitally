import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../analytics/analytics.service';
import { LegalNavigationService } from '../../services/legal-navigation.service';

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
    private legalNavigation: LegalNavigationService
  ) {}

  get legalQueryParams(): { returnTo: string } {
    return this.legalNavigation.getLegalQueryParams(this.router.url);
  }

  openPrivacyPreferences(): void {
    this.analytics.reopenConsentPreferences();
  }
}
