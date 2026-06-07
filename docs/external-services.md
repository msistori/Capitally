# External Services

## PostHog

PostHog is optional and controlled by environment variables:

- `POSTHOG_API_KEY`
- `POSTHOG_HOST`
- `POSTHOG_FRONTEND_ENABLED`
- `POSTHOG_SERVER_ENABLED`
- `POSTHOG_SESSION_REPLAY_ENABLED`

Frontend behavior:

- Loads analytics configuration from `/analytics/config`.
- Sends events only after analytics consent is granted.
- Session replay is disabled unless explicitly enabled.

Backend behavior:

- Captures server events through `PostHogAnalyticsService`.
- Requires `X-Analytics-Consent`.
- Skips capture when API key, event name, user id or server flag is missing.
- Sends events asynchronously and logs failures at debug level.

## Resend

Resend is optional and used for forgot-password emails.

Configuration:

- `RESEND_API_KEY`
- `RESEND_FROM`
- `RESEND_HOST`
- `RESEND_FORGOT_PASSWORD_DAILY_LIMIT`
- `RESEND_FORGOT_PASSWORD_MONTHLY_LIMIT`

Flow:

1. User requests forgot password through `/auth/forgot-password`.
2. Backend validates Resend configuration only if the user exists.
3. Quota is reserved in `t_password_reset_email_log`.
4. Backend generates and stores a BCrypt-hashed temporary password.
5. Resend sends the temporary password in the requested language.

## PostgreSQL

PostgreSQL is both the application datastore and a coordination mechanism for forgot-password quota checks through advisory transaction locks.
