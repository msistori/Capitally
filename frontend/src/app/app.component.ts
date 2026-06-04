import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LoadingOverlayComponent } from './loader/loading-overlay/loading-overlay.component';
import { LoaderService } from './loader/loader.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsEvent } from './analytics/analytics.events';
import { AnalyticsService } from './analytics/analytics.service';
import { LegalNavigationService } from './services/legal-navigation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly availableLanguages = ['it', 'en'];
  private loader = inject(LoaderService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private analytics = inject(AnalyticsService);
  private legalNavigation = inject(LegalNavigationService);
  loading = computed(() => this.loader.isLoading());
  disableScroll = false;
  legalRoute = false;
  publicRoute = false;
  dashboardRoute = false;
  welcomeRoute = false;
  private touchStartY = 0;
  private removeTouchStartListener?: () => void;
  private removeTouchMoveListener?: () => void;
  
  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.analytics.initialize();
    this.setRouteLayout(this.router.url || '/');

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
        this.setRouteLayout(url);
        this.analytics.track(AnalyticsEvent.PAGE_VIEWED, {
          page: this.routeName(url)
        });
      });

    this.installLoginTouchLock();
  }

  ngOnDestroy(): void {
    this.removeTouchStartListener?.();
    this.removeTouchMoveListener?.();
  }

  get showNavbar(): boolean {
    return !this.publicRoute && (!this.legalRoute || !this.legalNavigation.usesPublicChrome(this.router.url));
  }

  get showLegalFooter(): boolean {
    return true;
  }

  private setRouteLayout(url: string): void {
    this.legalNavigation.rememberOriginUrl(url);
    this.disableScroll = url.startsWith('/login');
    this.legalRoute = url.startsWith('/legal');
    this.publicRoute = this.legalNavigation.usesPublicChrome(url);
    this.dashboardRoute = url.startsWith('/dashboard');
    this.welcomeRoute = this.routePath(url) === '/';
    this.document.documentElement.classList.toggle('login-route', this.disableScroll);
    this.document.body.classList.toggle('login-route', this.disableScroll);
  }

  private routePath(url: string): string {
    return (url.split(/[?#]/, 1)[0] || '/');
  }

  private routeName(url: string): string {
    const path = this.routePath(url).replace(/^\/+/, '') || 'welcome';
    return path.split('/')[0] || 'login';
  }

  private installLoginTouchLock(): void {
    const touchStart = (event: TouchEvent) => {
      this.touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const touchMove = (event: TouchEvent) => {
      if (!this.disableScroll || event.touches.length !== 1) return;

      const currentY = event.touches[0]?.clientY ?? this.touchStartY;
      const deltaY = currentY - this.touchStartY;
      this.touchStartY = currentY;

      if (this.canScrollInsideLogin(event.target, deltaY)) return;
      event.preventDefault();
    };

    this.document.addEventListener('touchstart', touchStart, { passive: true });
    this.document.addEventListener('touchmove', touchMove, { passive: false });

    this.removeTouchStartListener = () => this.document.removeEventListener('touchstart', touchStart);
    this.removeTouchMoveListener = () => this.document.removeEventListener('touchmove', touchMove);
  }

  private canScrollInsideLogin(target: EventTarget | null, deltaY: number): boolean {
    const element = target instanceof Element ? target : null;
    const scrollable = element?.closest<HTMLElement>('.form-card');
    if (!scrollable || scrollable.scrollHeight <= scrollable.clientHeight) return false;

    const scrollingDown = deltaY < 0;
    const scrollingUp = deltaY > 0;
    const atTop = scrollable.scrollTop <= 0;
    const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;

    return (scrollingDown && !atBottom) || (scrollingUp && !atTop);
  }
}
