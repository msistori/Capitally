# PWA

## Scope

Capitally is configured as a Progressive Web App without adding deployable services. The runtime remains:

- one Angular frontend
- one Spring Boot backend
- one PostgreSQL database

The PWA configuration lives entirely in the frontend.

## Files

Main files:

- `frontend/src/manifest.webmanifest`
- `frontend/ngsw-config.json`
- `frontend/src/index.html`
- `frontend/src/app/pwa/app-update.service.ts`
- `frontend/src/app/pages/install-app`
- `frontend/src/assets/pwa`
- `frontend/angular.json`
- `frontend/package.json`

## Manifest

The manifest defines:

- `name`: `Capitally`
- `short_name`: `Capitally`
- `start_url`: `/it/`
- `scope`: `/`
- `display`: `standalone`
- `orientation`: `portrait-primary`
- `theme_color`: `#005f73`
- `background_color`: `#caf0f8`
- categories: `finance`, `productivity`

Icons:

- `assets/pwa/icon-192.png`
- `assets/pwa/icon-512.png`
- `assets/pwa/icon-maskable-192.png`
- `assets/pwa/icon-maskable-512.png`

The maskable icons include padding so Android launchers can crop them safely.

## HTML Meta Tags

`frontend/src/index.html` includes:

- `theme-color`
- `manifest`
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-title`
- `apple-mobile-web-app-status-bar-style`
- `apple-touch-icon`
- `mobile-web-app-capable`
- `application-name`

These tags support installability and improve iOS home-screen behavior.

## Service Worker

Angular service worker is enabled only for production builds:

- `ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })`
- `angular.json` sets `serviceWorker: true` in production
- `ngswConfigPath` points to `ngsw-config.json`

The service worker is registered after the app is stable or after 30 seconds.

## Caching Strategy

`ngsw-config.json` has two asset groups:

| Group | Install mode | Update mode | Content |
| --- | --- | --- | --- |
| `app-shell` | `prefetch` | default | `index.html`, root JS/CSS, favicon, manifest |
| `static-assets` | `lazy` | `prefetch` | `assets/**`, `robots.txt`, `sitemap.xml` |

API calls are intentionally not cached. Capitally handles financial data, so caching authenticated API responses in the browser service worker would increase privacy risk and stale-data risk.

Navigation fallback is handled by Angular service worker returning the cached app shell for navigations. Authenticated data still requires the backend and network access.

## Offline Behavior

Expected offline behavior:

- the app shell can load after a successful production visit
- static assets and translations can be served from cache
- public pages that are part of the cached app shell can render
- private pages can open structurally, but account, transaction and dashboard data require network/backend access
- mutations such as creating transactions are not queued offline

This is intentional. Offline write queues for financial data need conflict handling and should be designed separately.

## Updates

`AppUpdateService` listens to Angular `SwUpdate.versionUpdates`.

When a new version is ready, the app asks the user whether to reload. This avoids silently replacing the app during an active session.

Translation key:

- `PWA.UPDATE_AVAILABLE`

## Install Page

The install guidance page is public:

- Italian: `/it/installazione-app`
- English: `/en/install-app`

It explains desktop, Android and iOS installation and keeps a back action at the top of the page. The page does not trigger a custom install prompt; users follow the install UI provided by their browser or operating system.

## Platform Notes

Desktop:

- Chromium-based browsers usually show install UI when manifest and service worker are valid.

Android:

- Chrome supports install prompts and maskable icons.

iOS:

- users usually install manually from Safari using Share then Add to Home Screen
- iOS may not fire `beforeinstallprompt`
- storage and background behavior can differ from Android/desktop
- service worker support exists, but browser and OS constraints are stricter

## Testing

Use a production build because Angular service worker is disabled in development.

Recommended checks:

1. Build the frontend.
2. Serve the production output over `http://localhost` or HTTPS.
3. Open DevTools Application tab.
4. Verify `manifest.webmanifest`.
5. Verify `ngsw-worker.js` is registered.
6. Run Lighthouse for PWA, SEO, Performance, Accessibility and Best Practices.
7. Test reload after a new build to confirm update prompt behavior.
8. Test Android/Desktop installability.
9. Test iOS manual install from Safari on a real device when possible.

## Future Changes

When adding new public assets, decide whether they belong in:

- `app-shell` for critical files needed immediately
- `static-assets` for lazy cached images, icons and translation files

Do not add authenticated API endpoints to service worker data caching unless there is a reviewed privacy, stale-data and conflict-resolution design.
