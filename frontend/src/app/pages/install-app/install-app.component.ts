import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { currentOrDefaultLanguage } from '../../routing/localized-routes';
import { LegalNavigationService } from '../../services/legal-navigation.service';

@Component({
  selector: 'app-install-app',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './install-app.component.html',
  styleUrls: ['./install-app.component.scss']
})
export class InstallAppComponent {
  private readonly legalNavigation = inject(LegalNavigationService);
  private readonly router = inject(Router);

  goBack(): void {
    const language = currentOrDefaultLanguage(this.router.url, localStorage.getItem('lang'));
    const returnUrl = this.legalNavigation.getLocalizedReturnUrl(this.router.url, language);

    this.router.navigateByUrl(returnUrl);
  }
}
