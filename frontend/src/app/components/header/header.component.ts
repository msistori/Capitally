import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  readonly availableLanguages = ['it', 'en'];
  currentLang!: string;
  
  constructor(
      private translate: TranslateService
    ) {
      this.translate.addLangs(this.availableLanguages);
      const saved = localStorage.getItem('lang');
      const browser = this.translate.getBrowserLang();
      const fallback = 'it';
      const initLang = saved && this.availableLanguages.includes(saved)
        ? saved
        : browser && this.availableLanguages.includes(browser) ? browser : fallback;
      this.translate.use(initLang);
      this.currentLang = initLang;
    }

  changeLanguage(lang: string): void {
    if (lang !== this.currentLang && this.availableLanguages.includes(lang)) {
      this.translate.use(lang);
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
    }
  }
}