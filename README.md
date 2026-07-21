# BudgetBITCH

BudgetBITCH is a cinematic, privacy-first budgeting application built with Next.js App Router, Convex (auth, database, realtime), IndexedDB for local-first offline data, Service Worker for PWA sync, next-intl for i18n (Thai/English), Tailwind CSS v4, framer-motion, recharts, and zod.

## Navigation docs

- `docs/CODEBASE_INDEX.md` — consolidated orientation map, route/module index, and practical filesystem tree

## Features

- Start Smart onboarding that generates a Money Survival Blueprint (10-question wizard, Q10 = location consent)
- Auth-first root entry: signed-out visitors stay on the welcome window; signed-in users without a completed launch profile move to the launch wizard; signed-in users with a profile land on the dashboard
- Accounts & Sharing Guidance — multi-board shared budgeting: up to 5 boards, 7 umbrellas, QR/link invite, plus automatic lossless cross-account sync (no manual button). Includes clear in-app collaboration guidance in accounts and settings screens to help family, friends, or work cohorts create or switch to a Shared Account (Family, Friends, Business) and invite members.
- Global PWA Install Prompt: Mounted globally in [layout.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/app/layout.tsx) so the PWA install option is available on every page.
- Sync Detail Popover: The sync indicator ([sync-status-indicator.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/components/ui/sync-status-indicator.tsx)) contains an interactive status popover showing connection status and sizes of active queues (accounts, couple, offline).
- Protected dashboard with scan-first panels (Daily Disposable hero, bills/due-soon priority guide, expenses, subscriptions, savings goals, net worth, critical-expense cut-one flow, CSV import)
- Market Watch: localized financial news/RSS alerts surfaced in the dashboard
- Location-driven currency: symbol derived from geolocation; numerals-only formatting when location is declined
- Local-first storage in IndexedDB with offline queue that flushes to Convex on reconnect
- Daily snapshot sync to Convex (`upsertDailySnapshot`) via the Service Worker / online event
- CSV transaction import
- Password reset via email (Resend) for Convex Auth accounts
- Legal pages (Terms, Privacy, Cookie Policy) with a server-recorded consent audit trail
- Privacy shield disclosures and consent helpers
- i18n (English + Thai) via next-intl

> Not in this slice (no routes or components exist): Learn!, Jobs hub, Connected Finance integrations, provider connection hub, workspace roles, audit log, notification fanout, email templates. The i18n catalog and a middleware test still reference legacy `/api/v1/learn` and `/api/v1/jobs` paths; those API routes are not implemented.

## Tech stack

- Next.js 16
- React 19
- TypeScript (strict)
- Convex 1.34+ (auth, database, realtime, HTTP endpoints)
- IndexedDB (via `idb`) for local-first offline data
- Service Worker (`public/sw.js`) for PWA sync & background updates
- next-intl v4 for i18n (Thai/English)
- Tailwind CSS v4 for styling
- framer-motion for animations
- recharts for data visualization
- zod for validation
- Vitest + React Testing Library for unit tests
- Playwright for E2E tests
- Vercel for deployment

## Codebase shape

- `src/app/**` contains routes, route groups, layouts, and API handlers
- Live routes: `src/app/page.tsx` (auth-first root gate), `src/app/sign-in/`, `src/app/sign-up/`, `src/app/forgot-password/`, `src/app/reset/`, `src/app/accounts/`, `src/app/join/`, `src/app/settings/`, `src/app/privacy/`, `src/app/terms/`, `src/app/cookie-policy/`, and the `(app)` route group (`dashboard`, `wizard`). `src/lib/auth/routes.ts` defines `AUTH_ROUTES.continue = "/auth/continue"`, but no page implements that route; post-auth users land on `/dashboard`.
- API routes: `src/app/api/news/route.ts` (Market Watch RSS), `src/app/api/legal/record-agreement/route.ts`, `src/app/api/legal/record-cookie-consent/route.ts`
- `src/lib/auth/routes.ts` centralizes protected path prefixes and auth route constants used by route protection
- `src/modules/**` contains business/domain logic grouped by capability; currently `src/modules/budgeting/` (budget math) and `src/modules/home-base/` (root board orchestration)
- `src/components/**` holds the primary UI surfaces: `accounts/` (multi-board + sync), `auth/`, `dashboard/`, `i18n/`, `launch/` (splash, manifesto gate), `layout/` (header bar), `legal/` (consent banner, footer, legal pages), `mobile/`, `onboarding/` (language select), `pwa/` (install prompt), `providers/`, `shared-board/`, `start-smart/` (Money Survival Blueprint panels), `ui/`, `welcome/`, `wizard/`
- `src/hooks/**` holds custom hooks: `use-accounts`, `use-account-sync`, `use-critical-expense`, `use-currency`, `use-display-prefs`, `use-haptic`, `use-local-db`, `use-news-prefs`, `use-shared-board`, `use-voice`
- `src/lib/**`: `auth/`, `convex/` (HTTP client, snapshot sync), `db/` (IndexedDB wrapper), `http/`, `legal/`, `news/` (RSS fetcher), `types/`, `utils/`, `animation/`, `colors/`
- `src/lib/convex/sync-snapshots.ts` handles the local→Convex daily snapshot sync and offline queue flush
- `tests/e2e/**` currently holds `dogfood.spec.ts`, which exercises the signed-in root gate path.

## Auth-first root flow

- `/` is the auth-first gate: signed-out visitors stay on the welcome window, signed-in visitors without a completed launch profile move into the launch wizard, and signed-in visitors with a completed launch profile land on the root board.
- `/sign-in`, `/sign-up`, `/forgot-password`, and `/reset` keep only sanitized in-app `redirectTo` targets.
- After sign-in, the post-auth bootstrap resolves any missing local user/workspace records, then lands on `/dashboard` (the wizard runs for users without a completed launch profile).
- `src/middleware.ts` protects the shared product surface by reading the centralized prefixes in `src/lib/auth/routes.ts`. Signed-out browser routes redirect to `/sign-in`.

## Local setup

1. Copy environment values from `.env.example` into `.env.local`.
2. Install dependencies with `npm install`.
3. Create or link a Convex deployment with Convex Auth enabled, then set `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, and `SITE_URL` (see Environment variables).
4. Mirror the same Convex variables in Vercel before shipping preview or production deployments.
5. Start development with `npm run dev`.
9. For browser tests, keep the Playwright web server on its dedicated webpack path. `playwright.config.ts` now starts `npm run dev -- --webpack --port 3100` through `scripts/run-with-sanitized-env.mjs`, with server reuse disabled, so local auth values do not change the auth-root test behavior and Turbopack does not hang on the first `/` request.

## Verification

Current workspace verification status:

- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

Deploy-time verification note:

- Preview deployments should use isolated database credentials before you opt them into running migrations.

Current browser-test note:

- `npm run test:e2e` uses a dedicated webpack-backed dev server on port `3100` with server reuse disabled so the suite does not attach to a hanging Turbopack process.
- The Playwright web server strips local auth env on purpose so signed-out welcome coverage and the non-production signed-in fallback stay deterministic even when `.env.local` contains real dev keys.
- Playwright coverage currently lives in `tests/e2e/dogfood.spec.ts` (signed-in root gate path). The welcome-auth/smoke split described in older notes is not present in this slice.

For deeper orientation, start with `docs/CODEBASE_INDEX.md`.

## Launch wizard notes

- Launch preferences remain local-only in `localStorage` under `budgetbitch:launch-profile`.
- The signed-in root E2E override is non-production-only and uses `budgetbitch:e2e-auth-state` only to exercise the signed-in root flow when auth client config is missing locally.
- Searchable city suggestions are loaded on demand from a small curated catalog instead of shipping every option up front.
- The launch loading window appears only when deferred transition work runs long enough to cross the threshold, and the money-themed art is prepared only when that loading state is needed.

## Convex runtime

- Convex is the authoritative backend: auth, `dailySnapshots` table, realtime subscriptions.
- IndexedDB is the local cache for offline reads/writes; budget wizard profile, transactions, settings.
- Service Worker provides background sync: posts daily snapshots to Convex via `upsertDailySnapshot`.
- Server-side secrets: Convex Auth config, environment variables.

### Daily snapshot sync

- IndexedDB holds the local budget state (wizard profile, transactions, expenses, bills, savings goals, net worth, critical-expense commitments).
- `src/lib/convex/sync-snapshots.ts` gathers a daily snapshot from IndexedDB and calls the Convex mutation `upsertDailySnapshot` (table: `dailySnapshots`).
- If Convex is not configured or the call fails, the snapshot is queued in `localStorage` (`budgetbitch:offlineQueue`); `flushOfflineQueue()` replays queued snapshots to Convex on reconnect (navigator `online` event).
- The Service Worker (`public/sw.js`) registers and requests periodic sync for the daily snapshot.
- `vercel.json` still declares a legacy cron path (`/api/cron/projections/check-ins/replay`) that has no matching route handler in this slice; the daily snapshot is pushed client-side, not via the cron. Remove or wire that cron before relying on it.
- Convex Auth email/password accounts are created by users through `/sign-up`; end users do not add environment files or OAuth credentials.

## Security & Vercel Headers

Deployment policies and security headers are configured in [vercel.json](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/vercel.json):
- **Cross-Origin-Embedder-Policy (COEP)**: The `require-corp` header was removed to resolve launching/rendering failures inside restricted mobile webviews (in-app browsers).
- **Content-Security-Policy (CSP)**: The `connect-src` directive has been updated to include wildcard patterns for Convex backends (`https://*.convex.cloud wss://*.convex.cloud https://*.convex.site wss://*.convex.site`) to facilitate direct, real-time client-to-backend socket and HTTP requests.

## Environment variables

See `.env.example` for the authoritative list. Required for this slice:

- `CONVEX_DEPLOYMENT` — identifies the Convex deployment for CLI/codegen commands.
- `NEXT_PUBLIC_CONVEX_URL` — the Convex cloud URL (baked into the browser bundle at build time; changing it requires a redeploy).
- `NEXT_PUBLIC_CONVEX_SITE_URL` — the Convex site URL, mirrored into the browser bundle for client-side redirect/issuer reference.
- `CONVEX_SITE_URL` — the Convex site URL used as the Convex Auth issuer. Built-in Convex variable; do not `npx convex env set` it.
- `SITE_URL` — the app origin accepted by Convex Auth redirects (e.g. `http://localhost:3000` locally).
- `NEXT_PUBLIC_APP_URL` — the public app origin used in reset/verification email links (Convex Auth reads it at runtime; falls back to `SITE_URL` locally).
- `CONVEX_SYNC_SECRET` — shared secret for trusted server-side Convex sync (auth bootstrap + projection replay). Must match between the Vercel build env and the Convex deployment env.

> Reserved but not consumed in this slice: `PROVIDER_SECRET_ENCRYPTION_KEY` / `CRON_SECRET` for the unbuilt integration/provider-vault work. `RESEND_API_KEY` and `AUTH_EMAIL_FROM` are listed in `.env.example` as commented secrets (optional) — Convex Auth reads `RESEND_API_KEY` at runtime to deliver password-reset emails once an account-recovery flow is wired; they are not yet actively used by the app code in this slice. See `.env.example` for the authoritative, current list.

## Start Smart regional data

The Start Smart flow uses curated, attributable regional inputs rather than open-ended scraping. Seeded assumptions keep the wizard responsive, then higher-trust data can refine those defaults when available. Major assumptions are labeled as verified, estimated, or user-entered so the resulting blueprint remains explainable.