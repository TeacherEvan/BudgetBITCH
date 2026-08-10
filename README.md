# Budget Boss (`BudgetBITCH`)

Budget Boss is a cinematic, privacy-first budgeting PWA built with Next.js App
Router, Convex (auth, database, realtime), IndexedDB for local-first offline
data, a Service Worker for PWA sync, next-intl for i18n, Tailwind CSS v4,
framer-motion, recharts, and zod.

> **Naming:** `BudgetBITCH` is the repository / package name. The user-facing
> display name in all UI copy is **Budget Boss**.

## Navigation docs

- [docs/README.md](docs/README.md) — documentation hub & navigation map
- [docs/CODEBASE_INDEX.md](docs/CODEBASE_INDEX.md) — route/module/component index
- [docs/CI_CD.md](docs/CI_CD.md) — CI/CD pipeline, build guards, rollback runbook
- [ARCHITECTURE.md](ARCHITECTURE.md) — stack, directory boundaries, runtime flow
- [AGENTS.md](AGENTS.md) — conventions for AI agents and contributors

## Quality gates

The repository enforces a shift-left quality gate pipeline
(`.github/workflows/ci.yml`). Run the full local chain before pushing:

```bash
npm run ci   # lint, typecheck, check:idb, convex-import guard, test, test:convex, build
```

See [docs/CI_CD.md](docs/CI_CD.md) for gate specifications, build guard mechanics
(`scripts/check-idb-stores.mjs`, `scripts/check-convex-deployment.mjs`,
`scripts/check-convex-imports.mjs`), and Vercel rollback procedure.

## Features

- **Start Smart onboarding** — Money Survival Blueprint 10-step wizard
  (`src/components/wizard/wizard-shell.tsx`: income, rent, phone/internet,
  healthcare, transport, entertainment, subscriptions, savings rate, risk
  tolerance, location consent)
- **Auth-first root entry** — signed-out visitors stay on the welcome window;
  signed-in users without a completed launch profile go to the wizard; users
  with a profile land on the dashboard
- **Accounts & sharing** — multi-board shared budgeting (up to 5 boards, 7
  umbrellas), QR/link invites, and automatic lossless cross-account sync
- **Dashboard** — Daily Disposable hero, income/inflow tracker, bills & due-soon
  priority guide, expense tracker, budget visual/ring, subscriptions, savings
  goals, net worth, emergency fund, debt payoff, cash-flow forecast,
  What-If scenario sandbox, category pivot, currency converter, CSV import/export
- **Smart receipt scanning** — client-side OCR (tesseract.js →
  `src/lib/receipt/**`) plus a server `parseReceipt` Convex action
  (`convex/receipts.ts`) backed by Gemini 2.5 Flash, with a learning scraper
  engine (`convex/lib/receipt/**`), receipt templates, and merchant aliases
- **SMS import** — bank-SMS parsing (`src/lib/sms-parser/**`, EU/SG/US/generic
  patterns) with a PWA Web Share Target (`/share-target` → `/sms-confirm`)
- **Quick Add widget** — standalone `/quick-add` route with exactly three
  features: **Camera** (photo → HF bot `EvilEvan/TeacherBOY` → Gemini vision →
  Convex → editable review fields for amount, merchant, category, purchase
  date, tax/VAT, and line items — nothing auto-commits; no LINE ID involved,
  the bot identifies the user as `app:<convexUserId>`), **Inbox** (pasted
  SMS/email scraped by Gemini or the regex parser into a verify card), and
  **Income** (+/- toggle). Manual amount entry is deliberately NOT a feature.
  The Camera review card also offers a one-tap **Repeat Purchase** "+" when
  the scanned merchant matches a prior expense (also available per-row in the
  Expense Tracker). Expenses stamp `entryDate` (date of entry) separately
  from `date` (purchase date on the receipt).
- **Market Watch** — localized finance news/RSS with location-gated vicinity feeds
- **Web Push notifications** — VAPID push via `convex/push.ts` / `convex/pushSend.ts`
- **Bug reporting** — in-app modal capturing the last 20 user actions
  (`src/lib/utils/action-logger.ts`) with an admin review view
- **Local-first storage** — IndexedDB with an offline queue that flushes to
  Convex on reconnect; daily snapshot sync via `upsertDailySnapshot`
- **Legal & privacy** — Terms, Privacy, Cookie Policy, `/security` page,
  server-recorded consent audit trail, weekly privacy disclaimer
- **i18n** — English, Spanish, French, German, Portuguese, Chinese via next-intl

> Not in this slice (no routes or components exist): Learn!, Jobs hub,
> Connected Finance / bank aggregation, provider connection hub, workspace
> roles, audit log, notification fanout, email templates.

## Tech stack

- Next.js 16.3.0 (App Router)
- React 18
- TypeScript (strict)
- Convex 1.34.1 (auth, database, realtime, HTTP endpoints)
- IndexedDB (via `idb`) for local-first offline data
- Service Worker (`public/sw.js`) for PWA sync & background updates
- next-intl 4.13.5 for i18n (cookie `bb-locale`)
- Tailwind CSS 4.3.3
- framer-motion 12.43.0, lottie-react, @rive-app/canvas for motion
- recharts 3.10.1 for data visualization
- tesseract.js 6.0.1 for client-side receipt OCR
- web-push (VAPID) for notifications
- zod 4.4.3 for validation
- Vitest 4.1.10 + React Testing Library for unit/component tests
- Playwright 1.62.1 for E2E tests
- Vercel for deployment

## Codebase shape

- `src/app/**` — routes, route groups, layouts, API handlers
- Live page routes: `/` (auth-first root gate), `/sign-in`, `/sign-up`,
  `/forgot-password`, `/reset`, `/accounts`, `/join`, `/settings`, `/quick-add`,
  `/sms-confirm`, `/security`, `/privacy`, `/terms`, `/cookie-policy`, and the
  `(app)` route group (`dashboard`, `wizard`)
- Route handlers: `src/app/api/news/route.ts`, `src/app/api/news/vicinity/route.ts`,
  `src/app/api/legal/record-agreement/route.ts`,
  `src/app/api/legal/record-cookie-consent/route.ts`, `src/app/share-target/route.ts`
- `src/lib/auth/routes.ts` centralizes protected path prefixes and auth constants
- `src/modules/**` — domain logic: `budgeting/` (CSV import/export, daily cash
  snapshot, subscription trim hints) and `home-base/` (root board orchestration,
  location permission, reverse geocode)
- `src/components/**` — `accounts/`, `admin/`, `auth/`, `bug-report/`,
  `dashboard/`, `launch/`, `layout/`, `legal/`, `mobile/`, `onboarding/`,
  `privacy/`, `pro-tips/`, `providers/`, `pwa/`, `receipt/`, `settings/`,
  `shared-board/`, `sms/`, `start-smart/`, `ui/`, `webview/`, `welcome/`, `wizard/`
- `src/lib/**` — `animation/`, `auth/`, `colors/`, `convex/`, `data/`, `db/`,
  `http/`, `legal/`, `news/`, `notifications/`, `receipt/`, `sms-parser/`,
  `types/`, `utils/`
- `tests/e2e/**` — 25 Playwright spec files (plus shared `helpers.ts`)

## Auth-first root flow

- `/` is the auth-first gate: signed-out → welcome window; signed-in without a
  completed launch profile → launch wizard; otherwise → root board.
- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset` accept only sanitized
  in-app `redirectTo` targets.
- After sign-in the post-auth bootstrap resolves missing local user/workspace
  records, then lands on `/dashboard`.
- There is no `src/middleware.ts`. Protection is client-side via `<RequireAuth />`
  and `src/lib/auth/routes.ts`; tokens live in `localStorage` for in-app webview
  support (LINE, WhatsApp).
- `src/auth.ts` and `src/app/api/auth/[...nextauth]/route.ts` are an unwired
  NextAuth Google scaffold; the shipped auth path is Convex Auth email/password.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in values.
2. `npm install`
3. Create or link a Convex deployment with Convex Auth enabled, then set
   `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, and
   `SITE_URL` (see Environment variables).
4. Mirror the same Convex variables in Vercel before shipping previews or prod.
5. `npm run dev`
6. For browser tests, `playwright.config.ts` starts `npm run dev -- --port 3100`
   through `scripts/run-with-sanitized-env.mjs`. The Convex env is kept intact by
   default so client-only auth works; set `E2E_STRIP_AUTH=true` to replicate the
   stripped CI pipeline, or `E2E_BASE_URL` to target a running deployment.

## Verification

```bash
npm run lint
npm run typecheck
npm run check:idb
npm test
npm run test:convex
npm run test:e2e
npm run build
```

Notes:

- `npm run test:e2e` uses a dedicated dev server on port `3100` (local runs
  reuse an existing server; CI does not) so the suite stays deterministic.
- Authenticated flows need real credentials: set `E2E_TEST_EMAIL` /
  `E2E_TEST_PASSWORD`. Specs requiring auth skip cleanly when unset, so CI stays
  green without secrets.
- Coverage spans 25 spec files under `tests/e2e/`, including `diagnostics.spec.ts`
  (Settings → Data → "Diagnostics & Recovery": quota/usage, integrity scan,
  manual checkpoint, persistent-storage request).
- Preview deployments should use isolated credentials before opting them into
  running migrations.

For deeper orientation, start with `docs/CODEBASE_INDEX.md`.

## Launch wizard notes

- Launch preferences stay local-only in `localStorage` under
  `budgetbitch:launch-profile`; the selected locale is stored under
  `budgetbitch:locale` and mirrored to the `bb-locale` cookie for next-intl.
- The signed-in root E2E override is non-production-only and uses
  `budgetbitch:e2e-auth-state` solely to exercise the signed-in root flow when
  auth client config is missing locally.
- Searchable city suggestions load on demand from a small curated catalog.
- The launch loading window appears only when deferred transition work crosses
  the threshold; the money-themed art is prepared only when it is needed.

## Convex runtime

- Convex is the authoritative backend: auth, tables, realtime subscriptions.
- Tables (`convex/schema.ts`): `authTables`, `userProfiles`, `sharedBoards`,
  `accounts`, `boardMembers`, `accountBoards`, `invites`, `dailySnapshots`,
  `legalAgreements`, `cookieConsents`, `pushSubscriptions`, `feedbackReports`,
  `receipts`, `receiptTemplates`, `merchantAliases`.
- IndexedDB is the local cache for offline reads/writes: wizard profile,
  transactions, expenses, incomes, accounts, receipt drafts, snapshots, settings.

### Daily snapshot sync

- `src/lib/convex/sync-snapshots.ts` gathers a daily snapshot from IndexedDB and
  calls the Convex mutation `upsertDailySnapshot` (table: `dailySnapshots`).
- If Convex is unconfigured or the call fails, the snapshot is queued in
  IndexedDB (`syncQueue` store); `flushOfflineQueue()` replays it on
  the navigator `online` event.
- `public/sw.js` registers and requests periodic sync for the daily snapshot.
- The daily snapshot is pushed client-side, not via a server cron.
- Convex Auth email/password accounts are created by users through `/sign-up`;
  end users never add environment files or OAuth credentials.

## Security & Vercel headers

Deployment policies and security headers live in [vercel.json](vercel.json):

- **COEP**: the `require-corp` header was removed to fix rendering failures
  inside restricted mobile webviews (in-app browsers).
- **CSP**: `connect-src` includes wildcard Convex patterns
  (`https://*.convex.cloud wss://*.convex.cloud https://*.convex.site
  wss://*.convex.site`) for direct realtime client-to-backend traffic.

## Environment variables

See `.env.example` for the authoritative list.

Frontend (Vercel / `.env.local`):

- `NEXT_PUBLIC_CONVEX_URL` — Convex cloud URL, baked into the browser bundle at
  build time (changing it requires a redeploy).
- `NEXT_PUBLIC_CONVEX_SITE_URL` — Convex site URL mirrored into the bundle.
- `SITE_URL` — app origin accepted by Convex Auth redirects.
- `NEXT_PUBLIC_APP_URL` — public app origin used in reset/verification links.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — Web Push public key for the browser.
- `CONVEX_DEPLOYMENT` — identifies the Convex deployment for CLI/codegen.
- `CONVEX_DEPLOY_KEY` — required for CI builds / `npx convex deploy`.
- `BUDGETBITCH_PROD_CONVEX_SLUG` — expected prod slug for the deploy guard
  (defaults to `steady-ox-280`).

Backend (Convex dashboard):

- `CONVEX_SITE_URL` — Convex Auth issuer. Built-in; do not `npx convex env set` it.
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Web Push signing keys
  (`convex/pushSend.ts`); rotate with `scripts/rotate-vapid.ts`.
- `RESEND_API_KEY` / `AUTH_EMAIL_FROM` — transactional email for Convex Auth
  password reset and feedback notifications.
- `FEEDBACK_ADMIN_EMAIL` — recipient for in-app bug reports (`convex/feedback.ts`).
- `GEMINI_API_KEY` — Google Gemini key for the server-side receipt parse action
  (`convex/receipts.ts`).

`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are read by the unwired NextAuth
scaffold in `src/auth.ts` and are not required to run the app.

## Start Smart regional data

The Start Smart flow uses curated, attributable regional inputs rather than
open-ended scraping. Seeded assumptions keep the wizard responsive, then
higher-trust data refines those defaults when available. Major assumptions are
labeled verified, estimated, or user-entered so the blueprint stays explainable.
