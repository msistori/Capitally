import { Component, OnInit, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoadingOverlayComponent } from './loader/loading-overlay/loading-overlay.component';
import { LoaderService } from './loader/loader.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private readonly availableLanguages = ['it', 'en'];
  private loader = inject(LoaderService);
  private router = inject(Router);
  loading = computed(() => this.loader.isLoading());
  disableScroll = false;
  
  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.translate.addLangs(this.availableLanguages);
    const saved = localStorage.getItem('lang');
    const browser = this.translate.getBrowserLang();
    const fallback = 'it';
    const initLang = saved && this.availableLanguages.includes(saved)
      ? saved
      : browser && this.availableLanguages.includes(browser) ? browser : fallback;

    this.translate.use(initLang);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = event.urlAfterRedirects || event.url;
        this.disableScroll = url === '/' || url === '' || url.startsWith('/login');
      });
  }

  get showFooter(): boolean {
    return !this.disableScroll;
  }
}
