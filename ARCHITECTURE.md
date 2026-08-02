# ARCHITECTURE.md

## Purpose

This repository is a single Next.js + Convex codebase: the **Budget Boss** app
(`BudgetBITCH` repo/package name) at the repository root. Extend the root app
unless a task explicitly says otherwise. (A prior nested `budgetbitch/` AuthKit
prototype subtree was removed on 2026-07-20.)

## 1) Root App Architecture

### Stack

- Next.js App Router (v14)
- React 18 + TypeScript (strict)
- **Convex** 1.34 for backend (auth, database, realtime, HTTP endpoints)
- **IndexedDB** (via `idb`) for local-first offline data
- **Service Worker** (`public/sw.js`) for PWA sync & background updates
- **next-intl** (v4) for i18n — en, es, fr, de, pt, zh; cookie `bb-locale`
- **Tailwind CSS** (v4) for styling
- **framer-motion** for animations
- **recharts** for data visualization
- **zod** for validation
- **tesseract.js** for client-side receipt OCR
- **lottie-react** + **@rive-app/canvas** for lightweight brand motion
- **qrcode.react** for shared-board / account invite QR codes
- **web-push** (+ VAPID) for Web Push notifications (Convex action)
- **rss-parser** for Market Watch feeds
- **Vitest** + **React Testing Library** for unit tests
- **Playwright** for E2E tests
- **Vercel** for deployment

Not present: Prisma, Postgres, Inngest, Clerk, Sentry. `next-auth` is installed
but the Google scaffold in `src/auth.ts` is unwired — shipped auth is Convex Auth.

### Directory Boundaries

- `src/app/**` — routes, route groups, layouts, and route handlers (Convex Auth
  HTTP is registered in `convex/http.ts`; the standalone `/quick-add` widget and
  the `/share-target` POST endpoint live here)
- `src/components/**` — reusable UI
  - `accounts/` — Multi-board shared budgeting (board/umbrella management,
    QR/link invite) + automatic cross-account sync and sharing guidance
  - `admin/` — Admin bug-report review view
  - `auth/` — Clean auth card, Convex password form, recovery, entry panel
  - `bug-report/` — Bug-report modal (submits the last 20 logged actions)
  - `dashboard/` — Dashboard shell, bento grid, panels, alerts sidebar,
    priority guide, daily disposable hero, scenario sandbox, add-income modal
  - `launch/` — Cinematic splash, manifesto interstitial/notification
  - `layout/` — Header bar
  - `legal/` — Cookie consent banner, site footer, legal pages
  - `mobile/` — Mobile panel frame, fixed screen shell
  - `onboarding/` — Language select modal (6 locales)
  - `privacy/` — Weekly privacy disclaimer
  - `pro-tips/` — Pro tips card + modal
  - `providers/` — Convex client provider, theme provider
  - `pwa/` — Service worker registration, install prompt
  - `receipt/` — Receipt verification sheet
  - `settings/` — Account, preferences, data backup, partner sharing,
    change-password, decrypt-import, storage diagnostics
  - `shared-board/` — Shared couple-board UI (keyed-merge sync)
  - `sms/` — SMS confirm surface for shared bank messages
  - `start-smart/` — Money Survival Blueprint panels
  - `ui/` — Primitives (accordion, button, card, input, modal, progress-ring,
    select, slider, toggle, theme-toggle, confetti, error-boundary,
    money-sync-loading) and the `SyncStatusIndicator` popover
  - `webview/` — In-app webview banner
  - `welcome/` — Welcome window
  - `wizard/` — Onboarding wizard shell, progress, and 10 step components
- `src/hooks/` — `use-accounts`, `use-account-sync`, `use-budgets`,
  `use-critical-expense`, `use-currency`, `use-currency-override`,
  `use-display-detection`, `use-display-prefs`, `use-expenses`, `use-haptic`,
  `use-local-db`, `use-news-prefs`, `use-purchase-notes`, `use-receipt-scan`,
  `use-resolved-location`, `use-shake`, `use-shared-board`, `use-shimmer-pref`,
  `use-vicinity-feeds`
- `src/i18n/` — locale catalogs (`locales/{en,es,fr,de,pt,zh}.ts`), `messages.ts`,
  `request.ts`, `server.ts`
- `src/lib/`
  - `animation/` — Motion utilities
  - `auth/` — `e2e-auth-override`, `route-guard`, `routes`, `session`,
    `session-claims`
  - `colors/` — Category color tokens
  - `convex/` — Convex HTTP client, snapshot sync (+ restore)
  - `data/` — Static content (pro tips)
  - `db/` — IndexedDB wrapper (`local-db.ts`), stores, crypto backup,
    backup schema, data migration
  - `http/` — Client IP / geolocation resolution
  - `legal/` — Legal versions + content
  - `news/` — RSS fetcher, vicinity registry/resolver, Market Watch API
  - `notifications/` — Notification preferences
  - `receipt/` — Client OCR worker, image preprocessing, engine client
  - `sms-parser/` — Bank SMS detection + regional patterns (eu, sg, us, generic)
  - `types/` — Budget and account types
  - `utils/` — `action-logger`, `budget-alerts`, `budget-calculator`, `cn`,
    `compound-calculator`, `currency`, `date`
- There is **no** `src/middleware.ts`. Auth protection is client-side via
  `<RequireAuth />` and `src/lib/auth/routes.ts`, with `localStorage` token
  storage for webview compatibility. `AUTH_ROUTES.continue = "/auth/continue"`
  is a constant with no page behind it; post-auth users land on `/dashboard`.
- `src/test/` — Test setup, smoke test
- `src/types/` — Ambient declarations (jest-axe, next-auth, Speech API, test utils)
- `convex/` — Convex backend
  - `auth.ts` / `auth.config.ts` — Convex Auth (Password provider, Resend email)
  - `http.ts` — HTTP router (auth routes)
  - `schema.ts` — `authTables`, `userProfiles`, `sharedBoards`, `accounts`,
    `boardMembers`, `accountBoards`, `invites`, `dailySnapshots`,
    `legalAgreements`, `cookieConsents`, `pushSubscriptions`, `feedbackReports`,
    `receipts`, `receiptTemplates`, `merchantAliases`
  - `accounts/` — Account CRUD, invites, board sync, purchase notes
  - `boardMerge.ts` — Keyed-merge logic for shared boards
  - `snapshots.ts` — `upsertDailySnapshot` mutation (daily backup from SW)
  - `receipts.ts` — `parseReceipt` action (Gemini 2.5 Flash) + scrape/answer/
    confirm mutations, offline draft sync, template snapshot query
  - `lib/receipt/` — Deterministic scraper engine shared with the client
    (normalise, amounts, dates, merchant/total extraction, validation,
    confidence, learning, templates)
  - `push.ts` / `pushSend.ts` — Web Push subscriptions and VAPID sender
  - `feedback.ts` — Bug-report sink with admin email notification
  - `legal.ts` — Legal agreement + cookie consent recording
  - `lib/auth.ts` — Auth helpers (`requireIdentity`, `getAuthUserId`)
  - `_generated/` — Convex generated types + `ai/guidelines.md`

### Runtime Flow

The root app is an auth-first, local-first PWA:

1. `/` decides whether the visitor stays on the welcome window, enters the
   launch wizard, or lands on the main board.
2. Language selection → stored in `localStorage` (`budgetbitch:locale`) and
   mirrored to the `bb-locale` cookie consumed by next-intl on the server.
3. Signed-in users → `/wizard` (if the launch profile is incomplete) or
   `/dashboard`.
4. Protected surfaces: `/dashboard`, `/accounts`, `/settings`, `/wizard`,
   `/api/v1/auth/bootstrap`.
5. Convex handles auth, realtime data, and daily snapshot persistence;
   Accounts/Invites tables power multi-board shared budgeting with automatic
   lossless cross-account sync.
6. IndexedDB + Service Worker provide offline-first UX; data syncs to Convex daily.
7. Market Watch surfaces localized finance news (RSS via `/api/news` and
   vicinity registry).

### Receipt ingestion (bot → Convex, not app-side LINE IDs)

Receipts scraped by the TeacherBOY / LINE bot do **not** flow through the
app's own auth or any raw LINE identifier in client code. The path is:

1. The bot POSTs a scraped receipt to the Convex `ingestReceipt` HTTP action
   (`convex/http.ts` → `convex/receipts.ts`), authenticated by a Bearer token.
2. `ingestReceipt` resolves the owning user via the **LINE → Convex mapping**
   (`convex/line.ts` `getLineMapping`, seeded by `seedLineLink`), then writes a
   `receipts` row with `status: "draft"`, `source: "line"`.
3. The **app authenticates users with Convex Auth (email/password)** — there is
   no LINE ID in app logic. Attribution from a LINE user to a Convex account
   happens only server-side through the mapping above.
4. The client surfaces pending drafts two ways:
   - the dashboard `ReceiptDraftsList` widget (`listReceipts` query), and
   - the Quick Add page, which loads the latest `status: "draft"` bot draft on
     mount and confirms it via `receipts.confirm` on Save.

**Do not** embed a raw LINE UID in app/client code to attribute receipts — use
the Convex-side `getLineMapping` bridge. If a LINE user is "not linked", the
fix is the server-side mapping (or `seedLineLink`), never a client LINE ID.

7b. Legal pages record consent server-side (`legalAgreements`,
    `cookieConsents`).
8. Receipts are parsed locally (tesseract.js + the shared scraper engine) with a
   Gemini-backed Convex action as the server path; SMS shares arrive via the PWA
   share target and are confirmed at `/sms-confirm`.

### Data Ownership

- **Convex** — Authoritative backend: auth, all server tables, realtime.
- **IndexedDB** — Local cache for offline reads/writes: wizard profile,
  transactions, expenses, incomes, accounts, receipt drafts, snapshots, settings.
- **Service Worker** — Background sync: posts daily snapshots via
  `upsertDailySnapshot`.
- **Server-side secrets** — Convex environment variables only; never in the client.

### Security, Web App & Sync Settings

- **COEP**: `require-corp` was removed from [vercel.json](vercel.json) so
  third-party resources load inside restricted mobile webviews.
- **CSP**: `connect-src` in [vercel.json](vercel.json) includes wildcard Convex
  patterns (`https://*.convex.cloud wss://*.convex.cloud https://*.convex.site
  wss://*.convex.site`) for direct realtime traffic.
- **Interactive Sync Status Popover**:
  [sync-status-indicator.tsx](src/components/ui/sync-status-indicator.tsx)
  details active queues (shared accounts, couple board, offline snapshots).
- **PWA Quick Add Widget**: [/quick-add](src/app/quick-add/page.tsx) handles
  rapid transaction entry with a +/- sign toggle writing to IndexedDB.
- **Web Share Target**: `share_target` in
  [manifest.json](public/manifest.json) POSTs to
  [share-target/route.ts](src/app/share-target/route.ts), which 303-redirects the
  shared SMS text to `/sms-confirm`.
- **App Shortcuts**: declared under `shortcuts` in
  [manifest.json](public/manifest.json) to launch straight into `/quick-add`.

### Root App Rules

- Keep route logic thin; move business rules into `src/modules/` or `src/lib/`.
- Keep UI reusable and scan-friendly in `src/components/**`.
- Centralize auth and redirect safety through `src/lib/auth/routes.ts`.
- Local-first: write to IndexedDB immediately, sync to Convex asynchronously.
- Use Convex realtime for live updates where needed (auth state, snapshots).

## 2) Testing and Verification

- Unit/component tests live beside source under `src/**/*.test.ts[x]`.
- Convex backend tests use `convex-test` (`npm run test:convex`).
- E2E tests live under `tests/e2e/` (25 Playwright specs).
- Validation: `npm run lint`, `npm run typecheck`, `npm run check:idb`,
  `npm test`, `npm run test:convex`, `npm run build` — or `npm run ci`.

## 3) Practical Navigation Rule

Work in the root app by default.

## 4) Key Convex Patterns (from guidelines)

- **Auth:** `ctx.auth.getUserIdentity()` in queries/mutations/actions; never
  accept `userId` as an argument.
- **Schema:** define in `convex/schema.ts`; use `defineTable`, `v.*` validators;
  index naming `by_field1_and_field2`.
- **Queries:** use `.withIndex()` not `.filter()`; prefer `.take()` or pagination
  over `.collect()`.
- **Mutations:** use `ctx.db.patch` / `ctx.db.replace`; batch large operations
  with `ctx.scheduler.runAfter`.
- **Actions:** `"use node";` at the top for Node built-ins; no `ctx.db` access;
  `fetch()` is available in the default runtime.
- **HTTP:** defined in `convex/http.ts` with `httpAction`, registered at an exact path.
- **Testing:** `convex-test` with vitest, `environment: "edge-runtime"`, module
  map from `import.meta.glob`.

## 5) CI/CD & Automated Reliability Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs nine jobs; `npm run ci` runs the
local gate chain.

- **Static gates**: `lint` (ESLint), `typecheck` (`tsc --noEmit`),
  `idb-schema-guard` (`scripts/check-idb-stores.mjs`).
- **Tests**: Vitest unit/component (`npm test`), Convex backend
  (`npm run test:convex`), Playwright E2E (`npm run test:e2e`).
- **Guards**: Convex import resolution (`scripts/check-convex-imports.mjs`) and
  the production Convex URL deploy guard
  (`scripts/check-convex-deployment.mjs`, run as a Vercel prebuild).
- **Rollback**: zero-rebuild production rollbacks via
  `.github/workflows/rollback.yml` (`npx vercel rollback`).
- **Handbook**: see [docs/CI_CD.md](docs/CI_CD.md).
