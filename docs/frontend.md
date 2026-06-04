# Frontend

## Stack

- Angular 17.
- Angular Material and CDK.
- ngx-translate for i18n.
- Chart.js and ng2-charts.
- RxJS.
- Nginx for production serving and API proxying.

## Structure

- `src/app/pages`: routed pages such as welcome, login, dashboard, summary, accounts, settings and legal pages.
- `src/app/components`: reusable UI components.
- `src/app/services`: API clients for backend resources.
- `src/app/auth`: token storage, route guard and auth interceptor.
- `src/app/analytics`: consent-aware PostHog integration.
- `src/app/mocks`: optional mock API interceptor and mock datasets.
- `src/assets/i18n`: Italian and English translations.

## Routing And Auth

The Angular guard protects authenticated areas. The auth interceptor attaches `Authorization: Bearer <token>` to internal API calls and skips external URLs plus login/register flows.

## API Base

Local environment:

- `production: false`
- `apiBase: '/api'`
- Angular dev server proxy handles backend forwarding.

Production environment:

- `production: true`
- `apiBase: ''`
- Nginx proxies API prefixes directly to the backend.

## Mock API

`environment.mockApi.enabled` can route selected endpoints to local mock data. This is useful for frontend work without a live backend, but it is disabled by default in both local and production environment files.

## Internationalization

The app ships translation files:

- `src/assets/i18n/it.json`
- `src/assets/i18n/en.json`

Legal documents are implemented as localized TypeScript content under `src/app/pages/legal/documents`.

## Production Nginx

`frontend/nginx.conf` serves the Angular build and proxies route prefixes such as `/auth`, `/dashboard`, `/transaction`, `/transactions`, `/account`, `/transfer`, `/category`, `/currency`, `/users`, `/analytics`, `/api`, `/v3` and Swagger paths to `BACKEND_URL`.
