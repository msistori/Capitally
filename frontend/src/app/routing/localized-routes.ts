export type AppLanguage = 'it' | 'en';
export type LegalSlug = 'terms' | 'privacy' | 'cookies';

export const APP_LANGUAGES: AppLanguage[] = ['it', 'en'];
export const DEFAULT_LANGUAGE: AppLanguage = 'it';

export const PRIVATE_ROUTES = {
  dashboard: '/app/dashboard',
  accounts: '/app/accounts',
  summary: '/app/summary'
} as const;

export const LOCALIZED_ROUTES = {
  it: {
    home: '/it',
    login: '/it/login',
    register: '/it/registrazione',
    install: '/it/installazione-app',
    notFound: '/it/404',
    legal: {
      terms: '/it/termini-condizioni',
      privacy: '/it/privacy',
      cookies: '/it/cookie-policy'
    }
  },
  en: {
    home: '/en',
    login: '/en/login',
    register: '/en/register',
    install: '/en/install-app',
    notFound: '/en/404',
    legal: {
      terms: '/en/terms-and-conditions',
      privacy: '/en/privacy',
      cookies: '/en/cookie-policy'
    }
  }
} as const;

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'it' || value === 'en';
}

export function languageFromUrl(url: string | null | undefined): AppLanguage | null {
  const path = routePath(url || '');
  const segment = path.split('/').filter(Boolean)[0];

  return isAppLanguage(segment) ? segment : null;
}

export function currentOrDefaultLanguage(url: string | null | undefined, fallback: string | null | undefined): AppLanguage {
  const urlLanguage = languageFromUrl(url);

  if (urlLanguage) return urlLanguage;
  if (isAppLanguage(fallback)) return fallback;

  return DEFAULT_LANGUAGE;
}

export function routePath(url: string): string {
  return url.split(/[?#]/, 1)[0] || '/';
}

export function localizedLegalPath(language: AppLanguage, document: LegalSlug): string {
  return LOCALIZED_ROUTES[language].legal[document];
}

export function equivalentLocalizedPath(url: string, targetLanguage: AppLanguage): string {
  const path = routePath(url);
  if (path.startsWith('/app/')) return url;

  const sourceLanguage = languageFromUrl(path) || DEFAULT_LANGUAGE;
  const sourceRoutes = LOCALIZED_ROUTES[sourceLanguage];
  const targetRoutes = LOCALIZED_ROUTES[targetLanguage];

  if (path === sourceRoutes.home || path === `${sourceRoutes.home}/`) return targetRoutes.home;
  if (path === sourceRoutes.login) return targetRoutes.login;
  if (path === sourceRoutes.register) return targetRoutes.register;
  if (path === sourceRoutes.install) return targetRoutes.install;
  if (path === sourceRoutes.notFound) return targetRoutes.notFound;

  for (const key of Object.keys(sourceRoutes.legal) as LegalSlug[]) {
    if (path === sourceRoutes.legal[key]) return targetRoutes.legal[key];
  }

  return targetRoutes.home;
}
