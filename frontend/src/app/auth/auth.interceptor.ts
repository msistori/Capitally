import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { StorageService } from './storage.service';
import { SessionService } from './session.service';
import { SESSION_REQUEST } from './session-context';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private storage: StorageService, private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = new URL(req.url, window.location.origin);
    if (url.origin !== window.location.origin) return next.handle(req);
    const authRequest = url.pathname.startsWith('/auth/');
    if (authRequest && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      req = req.clone({ setHeaders: { 'X-Capitally-Request': '1' } });
    }
    if (req.context.get(SESSION_REQUEST)) return next.handle(req);
    const protectedApi = url.pathname === '/auth/me'
      || ['api', 'dashboard', 'transaction', 'transactions', 'account', 'accounts', 'transfer', 'category', 'currency', 'users'].includes(url.pathname.split('/')[1]);
    if (url.pathname === '/api/analytics/config' || !protectedApi) return next.handle(req);

    const session = this.injector.get(SessionService);
    return session.restore().pipe(switchMap(authenticated => {
      if (!authenticated) return this.unauthorized(session);
      const token = this.storage.getAccessToken();
      const authorized = req.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
      return next.handle(authorized).pipe(catchError(error => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);
        const alreadyRefreshed = this.storage.getAccessToken() !== token && session.hasValidAccessToken();
        return (alreadyRefreshed ? of(true) : session.restore(true)).pipe(switchMap(restored => {
          if (!restored) return this.unauthorized(session);
          return next.handle(req.clone({ setHeaders: { Authorization: 'Bearer ' + this.storage.getAccessToken() } })).pipe(
            catchError(retryError => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) session.expire();
              return throwError(() => retryError);
            })
          );
        }));
      }));
    }));
  }

  private unauthorized(session: SessionService): Observable<never> {
    session.expire();
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Session expired' }));
  }
}
