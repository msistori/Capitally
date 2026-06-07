import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from '../auth/storage.service';
import { AnalyticsEvent, AnalyticsProperties } from './analytics.events';

type AnalyticsConsentState = 'unknown' | 'granted' | 'denied';

interface AnalyticsConfig {
  enabled: boolean;
  apiKey: string | null;
  host: string;
  sessionReplayEnabled: boolean;
}

interface PendingEvent {
  event: AnalyticsEvent;
  properties: AnalyticsProperties;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly consentStorageKey = 'cap_analytics_consent';
  private readonly configUrl = `${environment.apiBase ?? ''}/analytics/config`;
  private readonly captureUrl = `${environment.apiBase ?? ''}/analytics/capture`;
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly zone = inject(NgZone);
  private readonly consentSubject = new BehaviorSubject<AnalyticsConsentState>(this.readConsent());
  private pendingEvents: PendingEvent[] = [];
  private config: AnalyticsConfig | null = null;
  private initialized = false;
  private configLoading = false;
  private configReadyCallbacks: Array<() => void> = [];

  readonly consent$ = this.consentSubject.asObservable();
  readonly showConsentBanner$ = this.consent$.pipe(map(consent => consent === 'unknown'));

  get consentStatus(): AnalyticsConsentState {
    return this.consentSubject.value;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.hasGrantedConsent()) {
      this.config = this.disabledConfig();
      return;
    }

    this.loadConfig();
  }

  grantConsent(): void {
    this.setConsent('granted');
    this.config = null;
    this.loadConfig(() => this.track(AnalyticsEvent.ANALYTICS_CONSENT_GRANTED));
  }

  revokeConsent(): void {
    this.disableTracking();
    this.setConsent('denied');
  }

  reopenConsentPreferences(): void {
    this.disableTracking();
    localStorage.removeItem(this.consentStorageKey);
    this.consentSubject.next('unknown');
  }

  hasGrantedConsent(): boolean {
    return this.consentSubject.value === 'granted';
  }

  track(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
    if (!this.hasGrantedConsent()) return;

    if (!this.config) {
      this.queueEvent(event, properties);
      return;
    }

    if (!this.canTrack()) return;

    const distinctId = this.storage.getUserId();
    const accessToken = this.storage.getAccessToken();
    if (!distinctId || !accessToken) {
      this.queueEvent(event, properties);
      return;
    }

    this.flushPendingEvents();

    const payload = {
      event,
      properties: this.sanitizeProperties(properties)
    };

    this.zone.runOutsideAngular(() => this.dispatch(payload));
  }

  private loadConfig(onReady?: () => void): void {
    if (this.configLoading) {
      if (onReady) this.configReadyCallbacks.push(onReady);
      return;
    }

    if (onReady) this.configReadyCallbacks.push(onReady);
    this.configLoading = true;
    this.http.get<AnalyticsConfig>(this.configUrl).pipe(
      catchError(() => of(this.disabledConfig()))
    ).subscribe(config => {
      this.configLoading = false;

      if (!this.hasGrantedConsent()) {
        this.disableTracking();
        this.configReadyCallbacks = [];
        return;
      }

      this.config = this.isUsableConfig(config) ? config : this.disabledConfig();
      this.flushPendingEvents();
      const callbacks = [...this.configReadyCallbacks];
      this.configReadyCallbacks = [];
      callbacks.forEach(callback => callback());
    });
  }

  private disableTracking(): void {
    this.pendingEvents = [];
    this.configReadyCallbacks = [];
    this.config = this.disabledConfig();
  }

  private dispatch(payload: unknown): void {
    const body = JSON.stringify(payload);

    void fetch(this.captureUrl, {
      method: 'POST',
      body,
      headers: {
        'Authorization': `Bearer ${this.storage.getAccessToken() || ''}`,
        'Content-Type': 'application/json',
        'X-Analytics-Consent': 'true'
      },
      keepalive: true
    }).catch(() => undefined);
  }

  private flushPendingEvents(): void {
    const pending = [...this.pendingEvents];
    this.pendingEvents = [];
    pending.forEach(item => this.track(item.event, item.properties));
  }

  private queueEvent(event: AnalyticsEvent, properties: AnalyticsProperties): void {
    if (this.pendingEvents.length >= 20) {
      this.pendingEvents.shift();
    }

    this.pendingEvents.push({ event, properties });
  }

  private canTrack(): boolean {
    return this.config?.enabled === true;
  }

  private sanitizeProperties(properties: AnalyticsProperties): AnalyticsProperties {
    const sanitized: AnalyticsProperties = {
      $lib: 'capitally-frontend',
      $ip: null,
      app_environment: environment.production ? 'production' : 'development',
      session_replay_enabled: this.config?.sessionReplayEnabled === true
    };

    Object.entries(properties).forEach(([key, value]) => {
      if (!key || value === undefined) return;
      sanitized[key] = value;
    });

    return sanitized;
  }

  private readConsent(): AnalyticsConsentState {
    const value = localStorage.getItem(this.consentStorageKey);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  }

  private setConsent(state: AnalyticsConsentState): void {
    localStorage.setItem(this.consentStorageKey, state);
    this.consentSubject.next(state);
  }

  private isUsableConfig(config: AnalyticsConfig): boolean {
    return !!config?.enabled && !!config.apiKey && !!config.host;
  }

  private disabledConfig(): AnalyticsConfig {
    return {
      enabled: false,
      apiKey: null,
      host: 'https://eu.i.posthog.com',
      sessionReplayEnabled: false
    };
  }
}
