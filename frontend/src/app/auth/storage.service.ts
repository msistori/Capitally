import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser } from './auth.model';

const KEYS = {
  accessToken: 'cap_access_token',
  user: 'cap_user',
  prefs: 'cap_prefs'
} as const;

type Prefs = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly defaultCurrencySubject = new BehaviorSubject<string>(this.readDefaultCurrency());
  readonly defaultCurrency$ = this.defaultCurrencySubject.asObservable();

  setAccessToken(token: string): void {
    localStorage.setItem(KEYS.accessToken, token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.accessToken);
  }

  clearAuth(): void {
    localStorage.removeItem(KEYS.accessToken);
    localStorage.removeItem(KEYS.user);
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    const v = localStorage.getItem(KEYS.user);
    return v ? (JSON.parse(v) as AuthUser) : null;
  }

  setPreference(key: string, value: string): void {
    const obj = this.readPrefs();
    obj[key] = value;
    localStorage.setItem(KEYS.prefs, JSON.stringify(obj));

    if (key === 'defaultCurrency') {
      this.defaultCurrencySubject.next(value);
    }
  }

  getPreference(key: string): string | null {
    const obj = this.readPrefs();
    return obj[key] ?? null;
  }

  getUserId(): string | null {
    const user = this.getUser();
    return user?.id ? String(user.id) : this.getPreference('userId');
  }

  getDefaultCurrency(): string {
    return this.defaultCurrencySubject.value;
  }

  setDefaultCurrency(code: string): void {
    this.setPreference('defaultCurrency', code);
  }

  private readPrefs(): Prefs {
    const v = localStorage.getItem(KEYS.prefs);
    return v ? (JSON.parse(v) as Prefs) : {};
  }

  private readDefaultCurrency(): string {
    const v = localStorage.getItem(KEYS.prefs);
    const obj = v ? (JSON.parse(v) as Prefs) : {};
    return obj['defaultCurrency'] ?? 'EUR';
  }
}