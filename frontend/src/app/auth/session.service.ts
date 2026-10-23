import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, defer, finalize, firstValueFrom, from, map, of, shareReplay, switchMap, tap, throwError, timeout } from 'rxjs';
import { StorageService } from './storage.service';
import { AuthUser } from './auth.model';
import { sessionContext } from './session-context';
import { GuestService } from '../services/guest.service';
import { currentOrDefaultLanguage, LOCALIZED_ROUTES } from '../routing/localized-routes';
import { environment } from '../../environments/environment';

type TokenResponse = { token: string; roles: string[] };
type MeResponse = { id: string | number; username: string; email: string; roles: string[]; passwordChangeRequired?: boolean };
const RETURNING_USER = 'cap_returning_user';
const LOGOUT_PENDING = 'cap_logout_pending';
const SESSION_EVENT = 'cap_session_event';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private storage = inject(StorageService);
  private guest = inject(GuestService);
  private router = inject(Router);
  private refreshRequest?: Observable<boolean>;
  private logoutRequest?: Observable<void>;
  private checked = false;
  private generation = 0;

  constructor() {
    window.addEventListener('storage', event => {
      if (event.key !== SESSION_EVENT) return;
      this.clear();
      this.checked = false;
      if (localStorage.getItem(LOGOUT_PENDING) || event.newValue?.startsWith('logout:')) {
        this.checked = true;
        this.goToLogin();
      } else if (this.router.url.startsWith('/app/')) {
        window.location.reload();
      }
    });
  }

  get returningUser(): boolean {
    return localStorage.getItem(RETURNING_USER) === 'true';
  }

  get isGuestSession(): boolean {
    return this.guest.isGuestUser();
  }

  hasValidAccessToken(): boolean {
    const token = this.storage.getAccessToken();
    if (!token) return false;
    if (environment.mockApi.enabled && environment.mockApi.endpoints.authLogin && token.startsWith('mock-')) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 30000;
    } catch {
      return false;
    }
  }

  restore(force = false): Observable<boolean> {
    if (localStorage.getItem(LOGOUT_PENDING)) {
      this.clear();
      this.checked = true;
      return this.completeLogout(null).pipe(map(() => false));
    }
    if (!force && this.hasValidAccessToken() && this.storage.getUser()) return of(true);
    if (!force && this.checked && !this.storage.getAccessToken()) return of(false);
    if (this.refreshRequest) return this.refreshRequest;
    const generation = this.generation;
    this.refreshRequest = this.withLock(() => this.http.post<TokenResponse>('/auth/refresh', {}, {
      context: sessionContext()
    }).pipe(
      timeout(15000),
      switchMap(response => this.fetchUser(response.token).pipe(map(user => ({ response, user })))),
      map(({ response, user }) => {
        if (generation !== this.generation || localStorage.getItem(LOGOUT_PENDING)) return false;
        this.accept(response, user);
        return true;
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          if (generation === this.generation) {
            this.clear();
            this.checked = true;
          }
          return of(false);
        }
        return throwError(() => error);
      })
    )).pipe(
      finalize(() => this.refreshRequest = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.refreshRequest;
  }

  authenticate(path: '/auth/login' | '/auth/guest-login', body: unknown): Observable<AuthUser> {
    return this.withLock(() => {
      const generation = this.generation;
      const pendingLogout = localStorage.getItem(LOGOUT_PENDING)
        ? this.sendLogout(this.storage.getAccessToken()).pipe(tap(() => localStorage.removeItem(LOGOUT_PENDING)))
        : of(void 0);
      return pendingLogout.pipe(
        switchMap(() => this.http.post<TokenResponse>(path, body, {
          context: sessionContext(),
          headers: this.storage.getAccessToken() ? { Authorization: 'Bearer ' + this.storage.getAccessToken() } : {}
        })),
        timeout(15000),
        switchMap(response => this.fetchUser(response.token).pipe(map(user => ({ response, user })))),
        map(({ response, user }) => {
          if (generation !== this.generation || localStorage.getItem(LOGOUT_PENDING)) {
            throw new HttpErrorResponse({ status: 401, statusText: 'Session changed' });
          }
          this.clear();
          this.accept(response, user);
          localStorage.setItem(SESSION_EVENT, 'login:' + Date.now() + ':' + Math.random());
          return this.storage.getUser()!;
        })
      );
    });
  }

  logout(): Observable<void> {
    return defer(() => {
      const token = this.storage.getAccessToken();
      localStorage.setItem(LOGOUT_PENDING, 'true');
      this.clear();
      this.checked = true;
      localStorage.setItem(SESSION_EVENT, 'logout:' + Date.now() + ':' + Math.random());
      return this.completeLogout(token);
    });
  }

  expire(): void {
    this.clear();
    this.checked = true;
    this.goToLogin();
  }

  private completeLogout(token: string | null): Observable<void> {
    if (this.logoutRequest) return this.logoutRequest;
    this.logoutRequest = this.withLock(() => this.sendLogout(token).pipe(
      tap(() => localStorage.removeItem(LOGOUT_PENDING))
    )).pipe(
      finalize(() => this.logoutRequest = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.logoutRequest;
  }

  private sendLogout(token: string | null): Observable<void> {
    return this.http.post<void>('/auth/logout', {}, {
      context: sessionContext(),
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    }).pipe(timeout(15000));
  }

  private fetchUser(token: string): Observable<MeResponse> {
    return this.http.get<MeResponse>('/auth/me', {
      context: sessionContext(), headers: { Authorization: 'Bearer ' + token }
    }).pipe(timeout(15000));
  }

  private accept(response: TokenResponse, user: MeResponse): void {
    this.storage.setAccessToken(response.token);
    this.storage.setUser({ id: String(user.id), name: user.username, email: user.email,
      passwordChangeRequired: !!user.passwordChangeRequired });
    this.storage.setPreference('userId', String(user.id));
    if (user.roles.includes('DEMO')) this.guest.setGuestLogin();
    else {
      this.guest.clearGuestLogin();
      localStorage.setItem(RETURNING_USER, 'true');
    }
    this.checked = true;
  }

  private clear(): void {
    this.generation++;
    this.storage.clearAuth();
    this.dialog.closeAll();
    this.guest.clearGuestLogin();
  }

  private goToLogin(): void {
    if (!this.router.url.startsWith('/app/')) return;
    const language = currentOrDefaultLanguage(this.router.url, localStorage.getItem('lang'));
    this.router.navigate([LOCALIZED_ROUTES[language].login], { queryParams: { returnUrl: this.router.url } });
  }

  private withLock<T>(operation: () => Observable<T>): Observable<T> {
    return defer(() => {
      // Serialize cookie rotation across tabs without putting tokens in browser storage.
      if (navigator.locks) {
        return from(navigator.locks.request('capitally-session', () => firstValueFrom(operation())));
      }
      return operation();
    });
  }
}
