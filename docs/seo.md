# SEO

## Strategy

Capitally separates public marketing/legal pages from authenticated product pages.

Public pages use clean localized URLs under `/it` and `/en`, dynamic document metadata, canonical links, Open Graph tags, Twitter Card tags and `hreflang` alternates. Private pages remain available only after login and are marked as `noindex,nofollow`.

The frontend is still a single Angular SPA. This gives a solid baseline for crawlers that execute JavaScript, but the best future improvement for crawl reliability is Angular SSR or prerendering for the public routes.

## Public And Private Pages

Indexable public pages:

| Italian URL | English URL | Component | SEO key |
| --- | --- | --- | --- |
| `/it/` | `/en/` | `WelcomeComponent` | `home` |
| `/it/privacy` | `/en/privacy` | `LegalPageComponent` | `legal.privacy` |
| `/it/cookie-policy` | `/en/cookie-policy` | `LegalPageComponent` | `legal.cookies` |
| `/it/termini-condizioni` | `/en/terms-and-conditions` | `LegalPageComponent` | `legal.terms` |
| `/it/installazione-app` | `/en/install-app` | `InstallAppComponent` | `install` |

Public pages with `noindex,nofollow`:

| Italian URL | English URL | Component | Reason |
| --- | --- | --- | --- |
| `/it/login` | `/en/login` | `LoginComponent` | Authentication page |
| `/it/registrazione` | `/en/register` | `LoginComponent` | Account creation flow |
| `/it/404` | `/en/404` | `NotFoundComponent` | Error page |

Private pages with `noindex,nofollow`:

| URL | Component | Reason |
| --- | --- | --- |
| `/app/dashboard` | `DashboardComponent` | User financial data |
| `/app/accounts` | `AccountsComponent` | User financial data |
| `/app/summary` | `SummaryComponent` | User financial data |

Legacy internal redirects are kept for `/login`, `/legal/*`, `/dashboard`, `/accounts` and `/summary` so old in-app links do not fail during the transition. The clean public URLs are the canonical URLs.

Back links on public utility pages use internal session storage instead of visible `returnTo` query parameters. This keeps URLs clean while allowing the app to return to the last meaningful page in the currently selected language.

## Metadata

`frontend/src/app/seo/seo.service.ts` applies metadata on every Angular navigation:

- `<title>`
- `meta description`
- `meta robots`
- canonical link
- Open Graph title, description, URL and image
- Twitter Card title, description and image
- `hreflang` alternates for indexable localized pages
- root `<html lang="...">`

The Open Graph image is `frontend/src/assets/og-capitally.png`.

## Canonical URL

Canonical URLs are generated from the current browser origin unless `environment.siteUrl` is set.

Production can set `siteUrl` in:

- `frontend/src/environments/environment.prod.ts`

`robots.txt` and `sitemap.xml` are static and currently use `https://capitally.app`. If the production domain changes, update:

- `frontend/src/robots.txt`
- `frontend/src/sitemap.xml`

## Hreflang

Indexable public pages define:

- `hreflang="it"`
- `hreflang="en"`
- `hreflang="x-default"` pointing to the English route

The route mapping is centralized in:

- `frontend/src/app/routing/localized-routes.ts`

## Robots

`frontend/src/robots.txt` allows public localized pages and disallows:

- `/app/`
- authentication/API prefixes
- Swagger/OpenAPI paths
- private resource prefixes such as `/dashboard`, `/accounts`, `/transactions`

The Angular app also writes `noindex,nofollow` on private routes and non-indexable public routes.

## Sitemap

`frontend/src/sitemap.xml` includes only indexable public routes and their `hreflang` alternates. It intentionally excludes login, registration, 404 and every private route.

## Multilingual Routing

Public pages are split by language:

- Italian: `/it/...`
- English: `/en/...`

Changing language in the header navigates to the equivalent localized public URL when one exists. Private routes stay under `/app/...` because API endpoints already use prefixes such as `/dashboard` and `/accounts`.

## Angular SPA Limitation

The current solution does not add another deployable service and keeps the runtime as:

- one frontend
- one backend
- one database

Because the frontend is still an Angular SPA, some crawlers may index only the initial HTML before JavaScript updates metadata. For stronger SEO, add Angular SSR or prerendering later for:

- `/it/`
- `/en/`
- legal pages
- PWA installation pages

That would still be deployable inside the existing frontend container if configured as a frontend build/runtime concern.

## Accessibility And Performance Notes

The public pages should keep:

- one clear `h1`
- descriptive link text
- meaningful image `alt`
- mobile-first layout
- lazy or optimized heavy media where possible
- private financial data out of public HTML and metadata

Run Lighthouse manually against production-like builds for:

- SEO
- Accessibility
- Best Practices
- Performance
- PWA
