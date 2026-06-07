# Capitally

Capitally is a personal finance web application for tracking accounts, transactions, transfers, recurring movements, cash flow and dashboard summaries in multiple currencies.

Languages: [English](README.md) | [Italian](README_it.md)

## Current Scope

- JWT-based login, registration, current-user profile and password management.
- Account management with initial balances, currencies, icons and balance inclusion flags.
- Income and expense categories scoped per user.
- Transactions with type, category, recurrence metadata and account ownership checks.
- Internal transfers represented as paired transactions through a transfer group id.
- Dashboard widgets for balances, trends, monthly summaries, breakdowns and upcoming recurring transactions.
- CSV import/export for transactions, transfers and account initial balances.
- Demo/guest data support for local usage.
- Optional analytics through PostHog after user consent.
- Optional password reset email delivery through Resend.

## Architecture

| Area | Stack |
| --- | --- |
| Frontend | Angular 17, Angular Material, ngx-translate, Chart.js |
| Backend | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA |
| Database | PostgreSQL |
| Runtime | Docker Compose, Nginx frontend proxy, Spring Boot API |
| External services | PostHog, Resend |

At runtime, the frontend is served by Nginx and proxies API calls to the Spring Boot backend. The backend stores data in PostgreSQL and protects non-public API routes with stateless JWT authentication.

## Documentation

- [Technical overview](docs/technical-overview.md)
- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [Database](docs/database.md)
- [External services](docs/external-services.md)
- [Security](docs/security.md)
- [SEO](docs/seo.md)
- [PWA](docs/pwa.md)

## Prerequisites

- Docker and Docker Compose for the recommended local setup.
- Java 21 and Maven if running the backend outside Docker.
- Node.js LTS and npm if running the frontend outside Docker.
- PostgreSQL 16 or compatible.

## Quick Start With Docker

1. Copy the sample environment file.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Update secrets in `.env`, especially `JWT_SECRET`, `POSTGRES_PASSWORD`, `DEMO_PASSWORD` and `ADMIN_PASSWORD`.

3. Start the stack.

```bash
docker compose up --build
```

Default local URLs:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8080`
- OpenAPI/Swagger: `http://localhost:8080/index.html`

## Local Development

Backend:

```bash
cd backend/capitally-backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm start
```

The frontend local environment uses `apiBase: '/api'` and `proxy.conf.json` to route API calls to the backend.

## Database Scripts

Database scripts live in [database](database):

- `schema_capitally.sql`: current clean PostgreSQL schema.
- `trigger_capitally.sql`: `updated_at` trigger helper.
- `view_schema_capitally.sql`: monthly transaction report view.
- `align_core_schema_current.sql`: idempotent helper for older local schemas.
- `seed_guest_demo_data.sql`: demo dataset for user id `1`.

The application can also evolve the schema through Hibernate when `SPRING_JPA_HIBERNATE_DDL_AUTO=update` is enabled, but the SQL scripts are kept aligned with the current entity model.

## Configuration

Main environment variables are documented in [.env.example](.env.example). Required production values include:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`

Optional integrations:

- `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_FRONTEND_ENABLED`, `POSTHOG_SERVER_ENABLED`, `POSTHOG_SESSION_REPLAY_ENABLED`
- `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_HOST`, `RESEND_FORGOT_PASSWORD_DAILY_LIMIT`, `RESEND_FORGOT_PASSWORD_MONTHLY_LIMIT`

## Validation

This repository currently keeps test scaffolding, but project instructions state that test commands should not be run because tests are not implemented. For code changes, use build/compile checks where applicable.
