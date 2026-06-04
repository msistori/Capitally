# Technical Overview

## Runtime Shape

Capitally is split into three runtime services:

- Angular frontend served by Nginx.
- Spring Boot backend exposing REST APIs and serving security-protected business logic.
- PostgreSQL database.

The Docker Compose setup builds the frontend and backend images, starts PostgreSQL, waits for database health, then starts the backend and frontend.

## Request Flow

1. Browser loads the Angular SPA from the frontend service.
2. Angular calls relative API paths such as `/auth/login`, `/dashboard/overview` or `/transactions/export`.
3. Nginx proxies API paths to the backend through `BACKEND_URL`.
4. Spring Security validates JWTs on protected endpoints.
5. Controllers delegate to services, services use repositories, repositories read/write PostgreSQL.
6. DTOs and MapStruct mappers isolate API payloads from entity objects.

## Functional Domains

- Authentication and user profile.
- Accounts and account balances.
- Categories.
- Transactions and recurrence metadata.
- Transfers as paired transactions.
- Dashboard aggregation.
- CSV import/export.
- Analytics consent and event capture.
- Forgot-password email flow.

## Source Layout

```text
backend/capitally-backend
  src/main/java/com/capitally/app
    config
    controller
    core/entity
    core/repository
    core/security
    mapper
    model/request
    model/response
    service

frontend
  src/app
    analytics
    auth
    components
    interceptors
    mocks
    pages
    services
  src/assets/i18n

database
  *.sql
```

## Deployment Notes

- Backend reads all runtime configuration from environment variables.
- Frontend production image uses Nginx and proxies known API route prefixes.
- Local Angular development uses `proxy.conf.json` with `apiBase: '/api'`.
- Hibernate can update the schema in dev, but SQL scripts are maintained for clean databases and local repairs.
