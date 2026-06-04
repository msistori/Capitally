# Security

## Authentication Model

Capitally uses stateless JWT authentication.

1. The user authenticates with username/email and password through `/auth/login`.
2. The backend validates credentials through Spring Security and `UserDetailsServiceImpl`.
3. The backend issues a signed JWT with HS256.
4. The frontend stores the token client-side.
5. Protected API calls include `Authorization: Bearer <token>`.
6. `JwtAuthenticationFilter` validates the token and populates the Spring Security context.

No server-side HTTP session is required for API authentication.

## Main Classes

- `SecurityConfig`: configures stateless security, CORS, public routes, password encoder, authentication manager and JWT filter.
- `JwtTokenProvider`: signs and validates JWTs, using `JWT_SECRET` and `JWT_VALIDITY_MILLIS`.
- `JwtAuthenticationFilter`: extracts bearer tokens and creates the request principal.
- `UserDetailsServiceImpl`: loads users by username or email and maps roles to Spring authorities.
- `AuthService`: handles registration, login, `/auth/me` and forgot-password flows.
- `UserPrincipal`: represents the authenticated user id, username and roles.

## Public Routes

Currently public:

- `/auth/**`
- `/analytics/config`
- `/api/analytics/config`
- Swagger/OpenAPI routes
- static frontend assets
- SPA entry points and browser metadata
- HTTP `OPTIONS`

All other backend routes require authentication.

Note: `/auth/me` is currently under the public `/auth/**` matcher and validates the token manually in the controller/service path. A future hardening step is to expose only `/auth/login`, `/auth/register` and `/auth/forgot-password` publicly and let Spring Security protect `/auth/me`.

## Passwords

- Passwords are hashed with BCrypt.
- Registration stores only hashed passwords.
- Dev/demo users are encoded by `DevUsersInitializer`.
- Forgot-password generates a temporary password, hashes it and sends it through Resend when configured.

## Forgot Password Controls

Forgot-password delivery uses:

- `ResendEmailService` for outbound email.
- `ForgotPasswordEmailQuotaService` for daily and monthly quota checks.
- `t_password_reset_email_log` for quota accounting.
- PostgreSQL advisory transaction lock to avoid concurrent quota races.

The endpoint intentionally returns no user-enumeration signal when the account is not found.

## Analytics Consent

Analytics are optional and depend on consent:

- Frontend events are sent only after the cookie consent flow grants analytics consent.
- Backend captures require the `X-Analytics-Consent` header.
- Server-side PostHog events sanitize properties and set `$ip` to `null`.
- Session replay is disabled by default.

## Production Checklist

- Set a long, random `JWT_SECRET`.
- Do not use default demo/admin passwords.
- Restrict CORS origins instead of allowing `*`.
- Disable or restrict Swagger UI if public API docs are not intended.
- Configure HTTPS on public domains.
- Keep backend and database private when the platform allows it.
- Configure Resend only with a verified sender domain.
- Keep PostHog disabled or consent-gated when analytics are not needed.
- Review client-side token storage before handling higher-risk data.
