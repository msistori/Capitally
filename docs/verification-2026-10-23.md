# Local Verification — 2026-10-23

## Environment And Scope

The current local changes were checked with the real Angular application and Spring Boot backend, using a separate PostgreSQL 17 cluster on loopback and synthetic accounts and transactions. Personal data and the existing database were not used. Analytics and outbound email were disabled.

The repository's normal test commands were not run. The user explicitly authorized an exception to AGENTS.md for temporary HTTP checks against this isolated database.

## Build Checks

- Angular development build: passed.
- Angular production build and service-worker generation: passed. Only external font inlining was disabled for this local verification; script/style optimization and AOT remained enabled. Repository build settings were not changed.
- Maven compilation and packaging with test execution skipped: passed after the final backend correction. Existing Lombok/MapStruct/deprecation warnings remain.
- Git whitespace/diff check: passed.

## Browser Checks

| Flow | Observed result |
| --- | --- |
| Session unavailable | Primary-color heading/body and styled retry/discover actions render correctly. Screenshot saved in `frontend/output/playwright/session-unavailable.jpg`. |
| Retry during service outage | Returns to the recovery screen without a redirect loop. |
| Reload recovery screen | New visitor reaches explicit welcome; returning visitor reaches login even when the service remains unavailable. |
| Unknown URL and 404 reload | Unknown URL first displays 404; reloading the resulting 404 URL reaches login for a returning visitor. An explicit English 404 URL preserves English when redirecting to login. |
| Personal login and reload | Dashboard restores without entering credentials again. A second tab also restores the session. |
| Explicit welcome | Discover Capitally opens welcome while authenticated; ordinary `/it` entry returns to dashboard. |
| Guest login | Opens the private dashboard with the demo identity. |
| Dashboard | Account balances, annual navigation and recent-transactions pagination work with populated data; all 25 seeded expenses can be loaded. |
| Accounts and transfers | Accounts show balances matching the API; transfer history shows the created transfer. |
| Transaction form | Amount/category/description entry and calendar year/day selection work. Saving an expense dated 2025-10-23 persists that exact date. |
| Summary | Totals reflect the saved expense; text search finds it with the expected account, amount and date. |
| Settings and export | Settings and export dialogs open; transaction CSV downloads successfully. |
| Logout across tabs | Both private tabs return to login; the second tab retains its allowed return destination. |

## HTTP And Data Checks

The first security/API run passed all 44 checks. The broader functional run passed 34 of 35 checks and identified an incorrect HTTP 500 for a cross-user transaction update. After correcting scoped resource lookups to return 404, all 19 focused regression checks passed, including valid create/update/delete operations.

Verified behavior includes:

- Authentication rejects missing custom headers, missing/untrusted origins and forged access tokens.
- Refresh cookies are HttpOnly and SameSite=Strict with a maximum lifetime of 30 days; auth responses use `no-store`. HTTP development mode was used, so production Secure-cookie behavior was not exercised in the browser.
- Refresh rotates the token without extending the original session deadline. Reusing a consumed token revokes the replacement refresh token and associated access token.
- An expired absolute deadline rejects renewal even after recent use. More than 30 days of inactivity also rejects renewal. These cases were simulated by changing only the disposable session timestamps.
- Logout, password change and account deletion invalidate the affected credentials. A wrong current password is rejected.
- Guest sessions have no persistent refresh cookie, and backend writes are forbidden.
- Cross-user and nonexistent transaction updates return the same 404. Foreign account, category and counterparty references are rejected on transaction creation and update.
- Account and transaction operations, transfers, recurring income and upcoming recurrences work. Negative recent-page indices return 400.
- Starting balances of EUR 1,500 minus EUR 250 of expenses produce EUR 1,250; a EUR 100 transfer preserves the total. A prior-year expense is included in the following year's opening trend.
- Dashboard endpoints, profile reading/updating, user-data export and CSV templates/exports respond successfully.
- Exporting and importing accounts, transactions and transfers into another synthetic account preserves the total balance.

## Remaining Deployment Checks

These results cover the exercised flows, not every possible input or a complete security audit. Before release, verify installed-PWA behavior on the target devices, HTTPS/Secure cookies and proxy configuration in the deployed environment, and real email/analytics integrations when enabled. Narrow-screen rendering was not confirmed because the browser viewport override did not change the reported dimensions.

The generated production manifest starts the PWA at `/app/dashboard`; its service-worker configuration does not cache authenticated API responses. The production database still needs the documented auth-session migration before deployment.

## Checkout Integration — 2026-10-23 Afternoon

The requested branch `feature-dashboard-transactions-sessions` was already checked out at `3180f53d`. IntelliJ's checkout shelf contained 63 tracked-file patches and additional local files that had not all been restored. The patches were recovered with a three-way merge against their original revision. The original shelf remains intact; pre-recovery copies are retained in the ignored backend `target/checkout-recovery` directory.

Two conflicts required resolution: annual navigation in the balance-trend template and balance-visibility notification in `StorageService.setUser`. Both the local session/dashboard features and the branch's existing balance-visibility behavior were retained. Additional local files were recovered from the shelf. The ER diagram was regenerated from the restored SQL schema (8 tables, 11 foreign keys).

Checks repeated after integration:

- Angular development build: passed.
- Angular production build with service worker: passed; external font inlining alone was disabled for this local check.
- Maven offline packaging with test execution skipped: passed.
- Disposable PostgreSQL 17 plus real backend: 76/76 HTTP checks passed. Coverage includes login, cookie protections, CSRF origin/header rejection, forged tokens, refresh rotation/replay revocation, idle and absolute expiry, password-change/logout revocation, guest write restrictions, cross-user transaction/account isolation, transaction creation/update/deletion, transfers, dashboard endpoints, pagination, profile/export/templates.
- The initial HTTP run had five incorrect assertions: four calls omitted required date parameters and one compared the complete cache header with a single directive. Corrected checks passed on fresh synthetic users.
- Browser checks: login, dashboard reload without credentials, balance visibility retained after reload, annual chart navigation, recent-transactions pagination, accounts, summary totals and explicit welcome access passed. Screenshot: `frontend/output/playwright/checkout-dashboard.jpg`.
- No merge markers, unmerged index entries or whitespace errors remain.

This rerun does not repeat every earlier browser/CSV-import scenario. Installed PWA, deployed HTTPS and real external integrations still require the deployment checks listed above. No personal database was used and no commit or push was made.
