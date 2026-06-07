import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AnalyticsEvent } from '../../analytics/analytics.events';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AuthService } from '../../services/auth.service';
import { GuestService } from '../../services/guest.service';
import { LOCALIZED_ROUTES, PRIVATE_ROUTES, currentOrDefaultLanguage } from '../../routing/localized-routes';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements AfterViewInit, OnDestroy {
  private auth = inject(AuthService);
  private guestService = inject(GuestService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private analytics = inject(AnalyticsService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private questionTimer?: ReturnType<typeof setInterval>;
  private revealObserver?: IntersectionObserver;

  loading = false;
  error: string | null = null;
  activeHeroQuestionIndex = 0;
  activeHeroSlideIndex = 0;

  readonly heroQuestions = [
    'WELCOME_PAGE.HERO.QUESTIONS.MONTHLY_SPEND',
    'WELCOME_PAGE.HERO.QUESTIONS.ACCOUNT_WEIGHT',
    'WELCOME_PAGE.HERO.QUESTIONS.SAVINGS',
    'WELCOME_PAGE.HERO.QUESTIONS.EXPENSES_DESTINATION'
  ];

  readonly heroSlides = [
    {
      icon: 'dashboard',
      title: 'WELCOME_PAGE.HERO.SLIDES.DASHBOARD.TITLE',
      subtitle: 'WELCOME_PAGE.HERO.SLIDES.DASHBOARD.SUBTITLE',
      metric: '€ 12.750',
      trendValue: '+ € 820',
      trendLabel: 'WELCOME_PAGE.HERO.SLIDES.DASHBOARD.TREND',
      mode: 'dashboard',
      transactions: [
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.SALARY', amount: '+3.000', positive: true },
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.RENT', amount: '-1.220', positive: false },
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.GROCERIES', amount: '-130', positive: false }
      ]
    },
    {
      icon: 'account_balance_wallet',
      title: 'WELCOME_PAGE.HERO.SLIDES.ACCOUNTS.TITLE',
      subtitle: 'WELCOME_PAGE.HERO.SLIDES.ACCOUNTS.SUBTITLE',
      metric: '3',
      trendValue: 'EUR / USD',
      trendLabel: 'WELCOME_PAGE.HERO.SLIDES.ACCOUNTS.TREND',
      mode: 'accounts',
      transactions: [
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.CURRENT_ACCOUNT', amount: '8.420', positive: true },
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.SAVINGS_ACCOUNT', amount: '4.330', positive: true },
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.CARD_ACCOUNT', amount: '-380', positive: false }
      ]
    },
    {
      icon: 'show_chart',
      title: 'WELCOME_PAGE.HERO.SLIDES.SUMMARY.TITLE',
      subtitle: 'WELCOME_PAGE.HERO.SLIDES.SUMMARY.SUBTITLE',
      metric: '+18%',
      trendValue: '18%',
      trendLabel: 'WELCOME_PAGE.HERO.SLIDES.SUMMARY.TREND',
      mode: 'summary',
      transactions: [
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.PHARMACY', amount: '-24', positive: false },
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.FUEL', amount: '-72', positive: false },
        { label: 'WELCOME_PAGE.HERO.TRANSACTIONS.FREELANCE', amount: '+640', positive: true }
      ]
    }
  ];

  readonly features = [
    { icon: 'account_balance_wallet', title: 'WELCOME_PAGE.FEATURES.ACCOUNTS.TITLE', text: 'WELCOME_PAGE.FEATURES.ACCOUNTS.TEXT' },
    { icon: 'receipt_long', title: 'WELCOME_PAGE.FEATURES.TRANSACTIONS.TITLE', text: 'WELCOME_PAGE.FEATURES.TRANSACTIONS.TEXT' },
    { icon: 'sync_alt', title: 'WELCOME_PAGE.FEATURES.TRANSFERS.TITLE', text: 'WELCOME_PAGE.FEATURES.TRANSFERS.TEXT' },
    { icon: 'calendar_month', title: 'WELCOME_PAGE.FEATURES.RECURRING.TITLE', text: 'WELCOME_PAGE.FEATURES.RECURRING.TEXT' },
    { icon: 'show_chart', title: 'WELCOME_PAGE.FEATURES.INSIGHTS.TITLE', text: 'WELCOME_PAGE.FEATURES.INSIGHTS.TEXT' },
    { icon: 'ios_share', title: 'WELCOME_PAGE.FEATURES.IMPORT_EXPORT.TITLE', text: 'WELCOME_PAGE.FEATURES.IMPORT_EXPORT.TEXT' }
  ];

  readonly steps = [
    { title: 'WELCOME_PAGE.FLOW.STEP_1.TITLE', text: 'WELCOME_PAGE.FLOW.STEP_1.TEXT' },
    { title: 'WELCOME_PAGE.FLOW.STEP_2.TITLE', text: 'WELCOME_PAGE.FLOW.STEP_2.TEXT' },
    { title: 'WELCOME_PAGE.FLOW.STEP_3.TITLE', text: 'WELCOME_PAGE.FLOW.STEP_3.TEXT' }
  ];

  get loginLink(): string {
    return LOCALIZED_ROUTES[this.currentLanguage].login;
  }

  get registerLink(): string {
    return LOCALIZED_ROUTES[this.currentLanguage].register;
  }

  private get currentLanguage() {
    return currentOrDefaultLanguage(this.router.url, this.translate.currentLang);
  }

  constructor() {
    this.questionTimer = setInterval(() => {
      this.activeHeroQuestionIndex = (this.activeHeroQuestionIndex + 1) % this.heroQuestions.length;
    }, 3600);
  }

  ngAfterViewInit(): void {
    const revealItems = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal-on-scroll'));

    if (!revealItems.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealItems.forEach(item => item.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        this.revealObserver?.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.12
    });

    revealItems.forEach(item => this.revealObserver?.observe(item));
  }

  ngOnDestroy(): void {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    this.revealObserver?.disconnect();
  }

  setHeroSlide(index: number): void {
    this.activeHeroSlideIndex = index;
    this.analytics.track(AnalyticsEvent.WELCOME_PREVIEW_SELECTED, {
      preview: this.heroSlides[index]?.mode ?? 'unknown',
      index
    });
  }

  trackLoginClick(): void {
    this.analytics.track(AnalyticsEvent.WELCOME_LOGIN_CLICKED);
  }

  trackRegisterClick(): void {
    this.analytics.track(AnalyticsEvent.WELCOME_REGISTER_CLICKED);
  }

  continueAsGuest(source: 'hero' | 'flow' = 'hero'): void {
    if (this.loading) return;

    this.error = null;
    this.loading = true;
    this.guestService.clearGuestLogin();
    this.analytics.track(AnalyticsEvent.WELCOME_GUEST_STARTED, { source });

    this.auth.loginAsGuest().subscribe({
      next: () => {
        this.guestService.setGuestLogin();
        this.loading = false;
        this.analytics.track(AnalyticsEvent.WELCOME_GUEST_SUCCEEDED, { source });
        this.router.navigate([PRIVATE_ROUTES.dashboard]);
      },
      error: e => {
        this.loading = false;
        this.error = e?.error?.message || this.translate.instant('LOGIN_PAGE.GUEST_ERROR');
        this.analytics.track(AnalyticsEvent.WELCOME_GUEST_FAILED, {
          source,
          reason: e?.status ? `http_${e.status}` : 'unknown'
        });
      }
    });
  }
}
