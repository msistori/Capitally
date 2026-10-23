import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { privateReturnUrl } from '../../auth/auth.guard';
import { currentOrDefaultLanguage, LOCALIZED_ROUTES } from '../../routing/localized-routes';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './session-unavailable.component.html',
  styleUrls: ['./session-unavailable.component.scss']
})
export class SessionUnavailableComponent {
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  readonly returnUrl = privateReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

  get welcomeUrl(): string {
    return LOCALIZED_ROUTES[currentOrDefaultLanguage('', this.translate.currentLang)].home;
  }
}
