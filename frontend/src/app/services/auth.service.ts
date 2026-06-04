import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StorageService } from '../auth/storage.service';
import { AuthTokens, AuthUser, ChangePasswordPayload, Credentials, RegisterPayload } from '../auth/auth.model';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { GuestService } from './guest.service';
import { AnalyticsEvent } from '../analytics/analytics.events';
import { AnalyticsService } from '../analytics/analytics.service';
import { MatDialog } from '@angular/material/dialog';

type BackendLoginResponse = { token: string; tokenType: string; username: string; email: string; roles: string[] };
type BackendMeResponse = { id: string | number; username: string; email: string; roles: string[] };

const API = '/auth';
const USERS_API = `${environment.apiBase ?? ''}/users`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);
  private analytics = inject(AnalyticsService);
  private dialog = inject(MatDialog);

  private constructor(private guestService: GuestService) {}

  login(payload: Credentials, method: 'credentials' | 'guest' = 'credentials'): Observable<AuthUser> {
    const body = { usernameOrEmail: payload.usernameOrEmail, password: payload.password };
    return this.http.post<BackendLoginResponse>(`${API}/login`, body).pipe(
      tap(res => this.storage.setAccessToken(res.token)),
      switchMap(() => this.me()),
      tap(user => {
        this.afterLogin(user, { accessToken: this.storage.getAccessToken() || '' });
        this.analytics.track(AnalyticsEvent.AUTH_LOGIN_SUCCEEDED, { method });
      })
    );
  }

  register(payload: RegisterPayload): Observable<void> {
    const body = { username: payload.username, email: payload.email, password: payload.password };
    return this.http.post<void>(`${API}/register`, body);
  }

  forgotPassword(usernameOrEmail: string, lang: string): Observable<void> {
    return this.http.post<void>(`${API}/forgot-password`, { usernameOrEmail, lang });
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.http.put<void>(`${USERS_API}/me/password`, payload);
  }

  loginAsGuest(): Observable<AuthUser> {
    const creds: Credentials = {
      usernameOrEmail: environment.demoUser?.usernameOrEmail ?? '',
      password: environment.demoUser?.password ?? ''
    };
    return this.login(creds, 'guest');
  }

  me(): Observable<AuthUser> {
    return this.http.get<BackendMeResponse>(`${API}/me`).pipe(
      map(r => ({ id: String(r.id), email: r.email, name: r.username } as AuthUser))
    );
  }

  logout(): Observable<void> {
    this.analytics.track(AnalyticsEvent.AUTH_LOGOUT_COMPLETED);
    this.dialog.closeAll();
    this.guestService.clearGuestLogin();
    this.storage.clearAuth();
    return of(void 0);
  }

  private afterLogin(user: AuthUser, tokens?: AuthTokens) {
    if (tokens?.accessToken) this.storage.setAccessToken(tokens.accessToken);
    this.storage.setUser(user);
    this.storage.setPreference('userId', String(user.id));
    let defaultCurrency = 'EUR';
    if ((user as any).defaultCurrency) defaultCurrency = (user as any).defaultCurrency;
    this.storage.setPreference('defaultCurrency', defaultCurrency);
  }
}
