import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../auth/storage.service';
import { AppLanguage, currentOrDefaultLanguage, equivalentLocalizedPath, LOCALIZED_ROUTES, routePath } from '../routing/localized-routes';

const LAST_NON_LEGAL_URL_KEY = 'cap_last_non_legal_url';
const CURRENT_INTERNAL_URL_KEY = 'cap_current_internal_url';
const PREVIOUS_INTERNAL_URL_KEY = 'cap_previous_internal_url';
const DEFAULT_AUTHENTICATED_URL = '/app/dashboard';

@Injectable({ providedIn: 'root' })
export class LegalNavigationService {
  constructor(
    private router: Router,
    private storage: StorageService
  ) {}

  rememberOriginUrl(url: string): void {
    const targetUrl = this.normalizeInternalUrl(url);

    if (!targetUrl) return;

    this.rememberPreviousUrl(targetUrl);

    if (!this.isBackNavigationUrl(targetUrl)) {
      sessionStorage.setItem(LAST_NON_LEGAL_URL_KEY, targetUrl);
    }
  }

  getReturnUrl(currentUrl: string = this.router.url): string {
    const explicitReturnUrl = this.getExplicitReturnUrl(currentUrl);

    if (explicitReturnUrl) return explicitReturnUrl;

    const previousUrl = this.normalizeInternalUrl(sessionStorage.getItem(PREVIOUS_INTERNAL_URL_KEY));

    if (
      previousUrl
      && !this.isBackNavigationUrl(previousUrl)
      && this.pathOf(previousUrl) !== this.pathOf(currentUrl)
    ) {
      return previousUrl;
    }

    const storedReturnUrl = this.normalizeInternalUrl(sessionStorage.getItem(LAST_NON_LEGAL_URL_KEY));

    if (storedReturnUrl && !this.isBackNavigationUrl(storedReturnUrl)) {
      return storedReturnUrl;
    }

    return this.hasAuthenticatedUser() ? DEFAULT_AUTHENTICATED_URL : this.defaultPublicUrl(currentUrl);
  }

  getLocalizedReturnUrl(currentUrl: string = this.router.url, language: AppLanguage): string {
    return equivalentLocalizedPath(this.getReturnUrl(currentUrl), language);
  }

  usesPublicChrome(url: string = this.router.url): boolean {
    return this.isPublicUrl(url) || (this.isLegalUrl(url) && this.isPublicUrl(this.getReturnUrl(url)));
  }

  isLegalUrl(url: string): boolean {
    const path = this.pathOf(url);

    return path.startsWith('/legal')
      || path === LOCALIZED_ROUTES.it.legal.terms
      || path === LOCALIZED_ROUTES.en.legal.terms
      || path === LOCALIZED_ROUTES.it.legal.privacy
      || path === LOCALIZED_ROUTES.en.legal.privacy
      || path === LOCALIZED_ROUTES.it.legal.cookies
      || path === LOCALIZED_ROUTES.en.legal.cookies;
  }

  isLoginUrl(url: string): boolean {
    const path = this.pathOf(url);
    return path === '/login'
      || path === LOCALIZED_ROUTES.it.login
      || path === LOCALIZED_ROUTES.en.login
      || path === LOCALIZED_ROUTES.it.register
      || path === LOCALIZED_ROUTES.en.register;
  }

  isPublicUrl(url: string): boolean {
    const path = this.pathOf(url);
    return path === ''
      || path === '/'
      || path === LOCALIZED_ROUTES.it.home
      || path === LOCALIZED_ROUTES.en.home
      || path === LOCALIZED_ROUTES.it.login
      || path === LOCALIZED_ROUTES.en.login
      || path === LOCALIZED_ROUTES.it.register
      || path === LOCALIZED_ROUTES.en.register
      || path === LOCALIZED_ROUTES.it.install
      || path === LOCALIZED_ROUTES.en.install
      || path === LOCALIZED_ROUTES.it.notFound
      || path === LOCALIZED_ROUTES.en.notFound;
  }

  private getExplicitReturnUrl(url: string): string | null {
    try {
      const returnTo = this.router.parseUrl(url).queryParams['returnTo'];
      const normalizedReturnTo = this.normalizeInternalUrl(typeof returnTo === 'string' ? returnTo : null);

      return normalizedReturnTo && !this.isBackNavigationUrl(normalizedReturnTo)
        ? normalizedReturnTo
        : null;
    } catch {
      return null;
    }
  }

  private normalizeInternalUrl(url: string | null | undefined): string | null {
    const value = url?.trim();

    if (!value || !value.startsWith('/') || value.startsWith('//')) return null;

    return value;
  }

  private pathOf(url: string): string {
    const normalizedUrl = this.normalizeInternalUrl(url);

    return normalizedUrl ? routePath(normalizedUrl) : '';
  }

  private hasAuthenticatedUser(): boolean {
    return !!this.storage.getAccessToken() || !!this.storage.getUser();
  }

  private isBackNavigationUrl(url: string): boolean {
    const path = this.pathOf(url);

    return this.isLegalUrl(url)
      || path === LOCALIZED_ROUTES.it.install
      || path === LOCALIZED_ROUTES.en.install
      || path === LOCALIZED_ROUTES.it.notFound
      || path === LOCALIZED_ROUTES.en.notFound;
  }

  private rememberPreviousUrl(targetUrl: string): void {
    const currentUrl = this.normalizeInternalUrl(sessionStorage.getItem(CURRENT_INTERNAL_URL_KEY));

    if (!currentUrl) {
      sessionStorage.setItem(CURRENT_INTERNAL_URL_KEY, targetUrl);
      return;
    }

    if (this.isSameNavigationTarget(currentUrl, targetUrl)) {
      sessionStorage.setItem(CURRENT_INTERNAL_URL_KEY, targetUrl);
      return;
    }

    sessionStorage.setItem(PREVIOUS_INTERNAL_URL_KEY, currentUrl);
    sessionStorage.setItem(CURRENT_INTERNAL_URL_KEY, targetUrl);
  }

  private isSameNavigationTarget(sourceUrl: string, targetUrl: string): boolean {
    const targetLanguage = currentOrDefaultLanguage(targetUrl, localStorage.getItem('lang'));
    const localizedSource = equivalentLocalizedPath(sourceUrl, targetLanguage);

    return this.pathOf(localizedSource) === this.pathOf(targetUrl);
  }

  private defaultPublicUrl(url: string): string {
    const language = currentOrDefaultLanguage(url, localStorage.getItem('lang'));

    return LOCALIZED_ROUTES[language].home;
  }
}
