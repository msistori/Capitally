import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { currentOrDefaultLanguage, LOCALIZED_ROUTES } from '../../routing/localized-routes';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {
  private readonly translate = inject(TranslateService);

  get homeLink(): string {
    const language = currentOrDefaultLanguage(location.pathname, this.translate.currentLang);

    return LOCALIZED_ROUTES[language].home;
  }
}
