import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private router = inject(Router);

  readonly availableLanguages = ['it', 'en'];
  currentLang!: string;
  hideLogout: boolean = false;

  constructor(
    private translate: TranslateService,
    private authService: AuthService
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

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        this.hideLogout = url === '/' || url === '' || url.startsWith('/login');
      }
    })
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
}