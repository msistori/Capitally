# Security

## Authentication And Persistent Sessions

Capitally uses short-lived HS256 access JWTs and database-backed, revocable sessions. Spring Security does not create HTTP sessions; authentication is no longer purely stateless because each protected request checks its session and current user in PostgreSQL.

- Access tokens live for at most 15 minutes, capped by the session's absolute expiry. They are kept in Angular memory, never in localStorage or sessionStorage.
- Personal sessions expire after 30 days of inactivity and, unconditionally, 30 days after login. With equal limits the absolute deadline always wins. Refreshing cannot extend it.
- A cryptographically random 256-bit refresh token is stored in the host-only cookie `__Host-cap_refresh`: HttpOnly, Secure, SameSite=Strict, Path=/, no Domain. Its Max-Age never exceeds the original session deadline.
- The server stores only SHA-256 token hashes. Every successful refresh consumes the old token and issues a new one. Used hashes remain until session expiry to detect replay.
- Rotation locks the session row. Reusing a consumed token revokes that session, including its access JWTs. The transaction commits this revocation before returning 401.
- Logout revokes the current session and clears the cookie. Password changes and password resets revoke every session for the user. Account deletion removes its sessions and hashes.
- A SHA-256 fingerprint of the stored password hash also binds each session to the credentials used at login, closing races between login and a concurrent password reset.
- Disabled users and revoked/expired sessions cannot use previously issued access JWTs. Current roles are read from the database instead of trusting stale JWT roles.
- Demo sessions last at most 15 minutes and have no persistent refresh cookie. Demo access does not mark a visitor as a returning personal user.
- Expired sessions and token hashes are deleted hourly. Revoked sessions retain their rotation history until their original expiry.

A database lookup on authenticated requests is an intentional trade-off for immediate revocation. Requests already authorized and in flight when logout occurs may finish.

## Endpoints And Request Protection

| Endpoint | Behavior |
| --- | --- |
| POST /auth/login | Checks credentials, replaces this browser's previous session, sets a refresh cookie for personal accounts, returns an access JWT |
| POST /auth/guest-login | Creates a temporary demo session and clears any previous persistent session |
| POST /auth/register | Creates an account and returns 204; the frontend then logs in explicitly |
| POST /auth/refresh | Rotates the refresh cookie and returns a new access JWT; 401 clears an invalid cookie |
| POST /auth/logout | Revokes the session identified by the cookie and/or bearer JWT; clears the cookie; returns 204 |
| POST /auth/forgot-password | Existing password reset flow; revokes sessions when the password changes |
| GET /auth/me | Requires a valid bearer JWT and active session through Spring Security |

Every unsafe /auth request requires both `X-Capitally-Request: 1` and an exact, explicitly allowed Origin. This includes login, registration, refresh and logout. The custom header prevents simple cross-origin form attacks; CORS permits only the configured origins and headers. SameSite is an additional protection, not the only CSRF control. Resource mutations authenticate only through an explicit bearer header, never through the refresh cookie. Authentication responses use Cache-Control: no-store.

AuthRequestFilter limits credential endpoint requests to 20 per minute per client IP and refresh/logout requests to 120 per minute per IP, returning 429 with Retry-After. Its bounded in-memory counters are per backend instance; a deployment with multiple instances or exposed to distributed abuse also needs gateway-level rate limiting. IP limits are shared by clients behind the same NAT.

Other public routes remain analytics configuration, Swagger/OpenAPI, static assets, SPA entry points, and OPTIONS. Unknown /auth routes are not automatically public.

## Frontend Recovery And Navigation

SessionService restores authentication before private navigation. It shares concurrent refresh requests within a tab and uses the Web Locks API to serialize login, refresh and logout across same-origin tabs. No tokens are exchanged through browser storage. Without Web Locks, replay protection still fails closed; overlapping refreshes can require a fresh login.

A protected request can refresh and retry once after 401. A 403 is not treated as token expiry. Network failures, timeouts, rate limits and server failures do not erase the session; private-route recovery shows a retry page, while login stays accessible. Reloading a stale error-page URL returns to welcome or login based on the returning-user preference. A pending logout clears in-memory credentials immediately and blocks automatic restoration until the server logout succeeds, including after a reload. Cross-tab events clear stale credentials, and account switches reload private pages in other tabs.

The local returning-user flag affects navigation only and cannot authenticate anyone. Return destinations are restricted to known private routes. The welcome page remains explicitly accessible through /it?welcome=1 or /en?welcome=1 and the Discover Capitally footer link. See [frontend routing](frontend.md) and [PWA behavior](pwa.md).

## Configuration And Deployment

1. Apply [add_auth_sessions.sql](../database/add_auth_sessions.sql) before deploying the backend, or use Hibernate schema update in development. It creates t_auth_session and t_refresh_token without changing existing financial data.
2. Keep JWT_SECRET long, random and private. JWT_VALIDITY_MILLIS defaults to 900000 and must be between 1 and 900000; a previous longer override must be removed or reduced.
3. Production must use HTTPS, AUTH_SECURE_COOKIE=true and AUTH_ALLOWED_ORIGINS containing exact public origins, separated by commas, without trailing slashes or wildcards. Defaults are https://capital-ly.com and https://www.capital-ly.com; cookies are separate per hostname, so prefer a single canonical hostname.
4. Frontend and API must be served through the same public origin, as in the existing Nginx proxy. This implementation does not enable cross-origin credentialed cookies.
5. Local dev profile and Docker Compose use HTTP defaults: AUTH_SECURE_COOKIE=false and localhost:4200 / 127.0.0.1:4200. The local cookie is cap_refresh_dev. Set AUTH_ALLOWED_ORIGINS explicitly for a different port or LAN hostname. Never use those local defaults for production.
6. Keep the backend private behind trusted proxies. Forwarded headers must be stripped/replaced at the edge; Spring trusts forwarded metadata. Nginx overwrites X-Forwarded-For and removes the incoming Forwarded header. If another trusted proxy precedes Nginx, configure real client IP handling there before relying on IP rate limits.
7. Deploy backend and frontend together. Legacy JWTs have no session id and are rejected; old localStorage credentials are removed on startup. Existing users must log in once after migration.

Cookie persistence is scoped to the browser/storage container. A separately installed PWA may require its own initial login. Clearing browser data or revoking a session also requires login again. HttpOnly reduces token theft through JavaScript but does not make an XSS-compromised application safe.

## Manual Release Verification

Automated test commands are not normally run in this repository. See the [local verification record](verification-2026-10-23.md) for the explicitly authorized isolated HTTP checks, browser checks and their limits. Before production rollout, verify against a disposable account:

- First visit opens welcome; a personal login and browser/PWA restart restore the dashboard; explicit welcome remains accessible; private links return to their allowed destination after login.
- Expired access JWTs renew silently; simultaneous requests and multiple tabs do not cause duplicate rotations when Web Locks is supported.
- A session whose original deadline has passed cannot renew, including one recently used. Changing last_used_at cannot extend expires_at.
- Replaying a consumed refresh token returns 401 and makes the newer refresh token and associated JWT unusable.
- Missing custom header, missing/untrusted Origin, forged JWTs, expired sessions and revoked sessions are rejected; auth responses are not cached.
- Logout, password change/reset, disabled user and account deletion prevent further use of old sessions. Offline logout cannot silently sign the browser back in.
- Cookie flags and production origins are correct in the deployed browser; unrelated API 403/5xx responses do not log the user out.

Sources: [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [OWASP CSRF protection](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [RFC 9700 refresh-token rotation](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14).

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
- Configure exact AUTH_ALLOWED_ORIGINS and secure refresh cookies.
- Disable or restrict Swagger UI if public API docs are not intended.
- Configure HTTPS on public domains.
- Keep backend and database private when the platform allows it.
- Configure Resend only with a verified sender domain.
- Keep PostHog disabled or consent-gated when analytics are not needed.
- Review XSS defenses and deployment headers; persistent sessions do not replace application security reviews.
