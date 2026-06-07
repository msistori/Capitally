# Backend

## Stack

- Java 21.
- Spring Boot 3.3.
- Spring Web MVC.
- Spring Security.
- Spring Data JPA.
- PostgreSQL driver.
- MapStruct for DTO/entity mapping.
- Lombok.
- springdoc-openapi for Swagger/OpenAPI.

## Layers

- Controllers expose REST endpoints and extract the authenticated `UserPrincipal`.
- Services contain business logic and ownership checks.
- Repositories use Spring Data JPA query methods and specifications.
- Entities map the PostgreSQL schema.
- Request/response DTOs define API payloads.
- Mappers convert between entities and DTOs.

## Main API Areas

| Area | Base path | Purpose |
| --- | --- | --- |
| Auth | `/auth` | login, registration, forgot password, current user |
| Users | `/users`, `/api/users` | profile, password change, export, delete account |
| Accounts | `/account` | account CRUD and balance fields |
| Categories | `/category` | user-scoped category CRUD |
| Currencies | `/currency` | currency CRUD/listing |
| Transactions | `/transaction` | transaction CRUD |
| Transfers | `/transfer`, `/api/transfer` | internal transfer CRUD/listing |
| Import/export | `/transactions` | CSV import, export and templates |
| Dashboard | `/dashboard` | summaries, trends, breakdowns, recurrence |
| Analytics | `/analytics`, `/api/analytics` | analytics config and consent-gated capture |

## Authentication

The backend is stateless. `SecurityConfig` registers `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`. Public routes are explicitly listed; all other requests require a valid JWT.

JWT claims include:

- `jti`: user id.
- `sub`: username.
- `roles`: comma-separated role names.
- `iat`: issued-at.
- `exp`: expiration.

## Business Rules

- User data is scoped by authenticated user id.
- Accounts and categories are loaded by user before mutation.
- Transfers are represented by two linked transactions sharing `transfer_group_id`.
- Transfer counterparty account references use `ON DELETE SET NULL`.
- Dashboard reports exclude transfer transactions where needed to avoid double counting.
- Forgot-password does not disclose whether the user exists.

## Configuration

Backend configuration lives in `application.yml` and is environment-driven:

- `PORT`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `JWT_SECRET`
- `JWT_VALIDITY_MILLIS`
- PostHog variables
- Resend variables

## OpenAPI

Swagger UI is available at `/index.html` in the backend service when `springdoc.swagger-ui.enabled=true`.
