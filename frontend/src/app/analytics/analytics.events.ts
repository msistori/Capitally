export enum AnalyticsEvent {
  ANALYTICS_CONSENT_GRANTED = 'analytics_consent_granted',
  AUTH_LOGIN_SUCCEEDED = 'auth_login_succeeded',
  AUTH_LOGOUT_COMPLETED = 'auth_logout_completed',
  AUTH_REGISTRATION_COMPLETED = 'auth_registration_completed',
  PAGE_VIEWED = 'page_viewed',
  SETTINGS_OPENED = 'settings_opened',
  SETTINGS_DEFAULT_CURRENCY_CHANGED = 'settings_default_currency_changed',
  SETTINGS_LANGUAGE_CHANGED = 'settings_language_changed',
  TRANSACTION_MODAL_OPENED = 'transaction_modal_opened',
  WELCOME_GUEST_STARTED = 'welcome_guest_started',
  WELCOME_GUEST_SUCCEEDED = 'welcome_guest_succeeded',
  WELCOME_GUEST_FAILED = 'welcome_guest_failed',
  WELCOME_LOGIN_CLICKED = 'welcome_login_clicked',
  WELCOME_REGISTER_CLICKED = 'welcome_register_clicked',
  WELCOME_PREVIEW_SELECTED = 'welcome_preview_selected'
}

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
