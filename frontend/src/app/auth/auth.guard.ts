import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService } from './session.service';
import { currentOrDefaultLanguage, LOCALIZED_ROUTES, PRIVATE_ROUTES } from '../routing/localized-routes';

export function privateReturnUrl(value: string | null): string {
  return Object.values(PRIVATE_ROUTES).some(path => path === value) ? value! : PRIVATE_ROUTES.dashboard;
}

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const language = currentOrDefaultLanguage(state.url, localStorage.getItem('lang'));
  return session.restore().pipe(
    map(authenticated => authenticated || router.createUrlTree([LOCALIZED_ROUTES[language].login], {
      queryParams: { returnUrl: privateReturnUrl(state.url) }
    })),
    catchError(() => of(router.createUrlTree(['/session-unavailable'], { queryParams: { returnUrl: privateReturnUrl(state.url) } })))
  );
};

export const entryGuard: CanActivateFn = (route, state) => {
  if (route.queryParamMap.get('welcome') === '1') return true;
  const session = inject(SessionService);
  const router = inject(Router);
  const language = currentOrDefaultLanguage(state.url, localStorage.getItem('lang'));
  return session.restore().pipe(
    map(authenticated => authenticated ? router.parseUrl(PRIVATE_ROUTES.dashboard)
      : session.returningUser ? router.parseUrl(LOCALIZED_ROUTES[language].login) : true),
    catchError(() => of(session.returningUser
      ? router.createUrlTree(['/session-unavailable'], { queryParams: { returnUrl: PRIVATE_ROUTES.dashboard } }) : true))
  );
};

export const loginGuard: CanActivateFn = route => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.restore().pipe(
    map(authenticated => authenticated && !session.isGuestSession ? router.parseUrl(privateReturnUrl(route.queryParamMap.get('returnUrl'))) : true),
    catchError(() => of(true))
  );
};

export const transientPageGuard: CanActivateFn = route => {
  const router = inject(Router);
  const pagePath = '/' + route.url.map(segment => segment.path).join('/');
  const requestedPath = window.location.pathname.replace(/[/]+$/, '');
  // Preserve errors reached in the app; leave stale error URLs on a fresh page load.
  if (router.navigated || requestedPath !== pagePath) return true;

  const session = inject(SessionService);
  const language = currentOrDefaultLanguage(pagePath, localStorage.getItem('lang'));
  return session.returningUser
    ? router.createUrlTree([LOCALIZED_ROUTES[language].login], {
      queryParams: { returnUrl: privateReturnUrl(route.queryParamMap.get('returnUrl')) }
    })
    : router.createUrlTree([LOCALIZED_ROUTES[language].home], { queryParams: { welcome: '1' } });
};
