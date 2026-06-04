import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from 'src/app/services/auth.service';
import { LegalNavigationService } from 'src/app/services/legal-navigation.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly availableLanguages = ['it', 'en'];
  currentLang!: string;
  hideLogout: boolean = false;

  constructor(
    private translate: TranslateService,
    private authService: AuthService,
    private legalNavigation: LegalNavigationService
  ) {
    this.translate.addLangs(this.availableLanguages);
    const saved = localStorage.getItem('lang');
    const browser = this.translate.getBrowserLang();
    const fallback = 'en';
    const initLang = saved && this.availableLanguages.includes(saved)
      ? saved
      : browser && this.availableLanguages.includes(browser) ? browser : fallback;
    this.translate.use(initLang);
    this.currentLang = initLang;

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (this.availableLanguages.includes(event.lang)) {
          this.currentLang = event.lang;
        }
      });

    this.setHeaderState(this.router.url || '/');

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setHeaderState(event.urlAfterRedirects || event.url);
        }
      });
  }

  changeLanguage(lang: string): void {
    if (lang !== this.currentLang && this.availableLanguages.includes(lang)) {
      this.translate.use(lang);
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setHeaderState(url: string): void {
    this.hideLogout = this.legalNavigation.usesPublicChrome(url);
  }
}
