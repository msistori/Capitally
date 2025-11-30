import { Injectable } from '@angular/core';
import { AuthUser } from './auth.model';


const KEYS = {
    accessToken: 'cap_access_token',
    user: 'cap_user',
    prefs: 'cap_prefs'
};


@Injectable({ providedIn: 'root' })
export class StorageService {
    setAccessToken(token: string) { localStorage.setItem(KEYS.accessToken, token); }
    getAccessToken(): string | null { return localStorage.getItem(KEYS.accessToken); }
    clearAuth() { localStorage.removeItem(KEYS.accessToken); localStorage.removeItem(KEYS.user); }


    setUser(user: AuthUser) { localStorage.setItem(KEYS.user, JSON.stringify(user)); }
    getUser(): AuthUser | null { const v = localStorage.getItem(KEYS.user); return v ? JSON.parse(v) : null; }


    setPreference(key: string, value: string) {
        const v = localStorage.getItem(KEYS.prefs);
        const obj = v ? JSON.parse(v) : {};
        obj[key] = value;
        localStorage.setItem(KEYS.prefs, JSON.stringify(obj));
    }
    getPreference(key: string): string | null {
        const v = localStorage.getItem(KEYS.prefs);
        const obj = v ? JSON.parse(v) : {};
        return obj[key] ?? null;
    }

    // Convenience helpers
    getUserId(): string | null {
        const user = this.getUser();
        return user?.id ? String(user.id) : this.getPreference('userId');
    }
    getDefaultCurrency(): string {
        return this.getPreference('defaultCurrency') || 'EUR';
    }
}
