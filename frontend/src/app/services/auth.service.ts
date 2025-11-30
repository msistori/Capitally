import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { StorageService } from '../auth/storage.service';
import { AuthTokens, AuthUser, Credentials, RegisterPayload } from '../auth/auth.model';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';

type BackendLoginResponse = { token: string; tokenType: string; username: string; email: string; roles: string[] };
type BackendMeResponse = { id: string | number; username: string; email: string; roles: string[] };

const API = '/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  login(payload: Credentials): Observable<AuthUser> {
    const body = { usernameOrEmail: payload.usernameOrEmail, password: payload.password };
    return this.http.post<BackendLoginResponse>(`${API}/login`, body).pipe(
      tap(res => this.storage.setAccessToken(res.token)),
      switchMap(() => this.me()),
      tap(user => this.afterLogin(user, { accessToken: this.storage.getAccessToken() || '' }))
    );
  }

  register(payload: RegisterPayload): Observable<void> {
    const body = { username: payload.username, email: payload.email, password: payload.password };
    return this.http.post<void>(`${API}/register`, body);
  }

  loginAsGuest(): Observable<AuthUser> {
    const creds: Credentials = {
      usernameOrEmail: environment.demoUser?.usernameOrEmail ?? '',
      password: environment.demoUser?.password ?? ''
    };
    return this.login(creds);
  }

  me(): Observable<AuthUser> {
    return this.http.get<BackendMeResponse>(`${API}/me`).pipe(
      map(r => ({ id: String(r.id), email: r.email, name: r.username } as AuthUser))
    );
  }

  logout(): Observable<void> {
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