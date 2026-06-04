import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../auth/storage.service';

const LAST_NON_LEGAL_URL_KEY = 'cap_last_non_legal_url';
const DEFAULT_AUTHENTICATED_URL = '/dashboard';
const DEFAULT_PUBLIC_URL = '/';

@Injectable({ providedIn: 'root' })
export class LegalNavigationService {
  constructor(
    private router: Router,
    private storage: StorageService
  ) {}

  rememberOriginUrl(url: string): void {
    const targetUrl = this.normalizeInternalUrl(url);

    if (!targetUrl || this.isLegalUrl(targetUrl)) return;

    sessionStorage.setItem(LAST_NON_LEGAL_URL_KEY, targetUrl);
  }

  getLegalQueryParams(sourceUrl: string = this.router.url): { returnTo: string } {
    return { returnTo: this.resolveOriginUrl(sourceUrl) };
  }

  getReturnUrl(currentUrl: string = this.router.url): string {
    const explicitReturnUrl = this.getExplicitReturnUrl(currentUrl);

    if (explicitReturnUrl) return explicitReturnUrl;

    const storedReturnUrl = this.normalizeInternalUrl(sessionStorage.getItem(LAST_NON_LEGAL_URL_KEY));

    if (storedReturnUrl && !this.isLegalUrl(storedReturnUrl)) {
      return storedReturnUrl;
    }

    return this.hasAuthenticatedUser() ? DEFAULT_AUTHENTICATED_URL : DEFAULT_PUBLIC_URL;
  }

  usesPublicChrome(url: string = this.router.url): boolean {
    return this.isPublicUrl(url) || (this.isLegalUrl(url) && this.isPublicUrl(this.getReturnUrl(url)));
  }

  isLegalUrl(url: string): boolean {
    return this.pathOf(url).startsWith('/legal');
  }

  isLoginUrl(url: string): boolean {
    const path = this.pathOf(url);
    return path.startsWith('/login');
  }

  isPublicUrl(url: string): boolean {
    const path = this.pathOf(url);
    return path === '' || path === '/' || path.startsWith('/login');
  }

  private resolveOriginUrl(sourceUrl: string): string {
    const currentUrl = this.normalizeInternalUrl(sourceUrl);

    if (currentUrl && this.isLegalUrl(currentUrl)) {
      return this.getReturnUrl(currentUrl);
    }

    if (currentUrl) {
      return currentUrl;
    }

    return this.hasAuthenticatedUser() ? DEFAULT_AUTHENTICATED_URL : DEFAULT_PUBLIC_URL;
  }

  private getExplicitReturnUrl(url: string): string | null {
    try {
      const returnTo = this.router.parseUrl(url).queryParams['returnTo'];
      const normalizedReturnTo = this.normalizeInternalUrl(typeof returnTo === 'string' ? returnTo : null);

      return normalizedReturnTo && !this.isLegalUrl(normalizedReturnTo)
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

    return normalizedUrl?.split(/[?#]/, 1)[0] ?? '';
  }

  private hasAuthenticatedUser(): boolean {
    return !!this.storage.getAccessToken() || !!this.storage.getUser();
  }
}
