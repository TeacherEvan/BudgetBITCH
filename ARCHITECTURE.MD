# ARCHITECTURE.MD

## Purpose

This repository is a single Next.js + Convex codebase: the **BudgetBITCH app** at the repository root. Extend the root app unless a task explicitly says otherwise. (A prior nested `budgetbitch/` AuthKit prototype subtree was removed on 2026-07-20.)

## 1) Root App Architecture

### Stack

- Next.js App Router (v16)
- React 19 + TypeScript (strict)
- **Convex** for backend (auth, database, realtime, HTTP endpoints)
- **IndexedDB** (via `idb`) for local-first offline data
- **Service Worker** (`public/sw.js`) for PWA sync & background updates
- **next-intl** (v4) for i18n (Thai/English)
- **Tailwind CSS** (v4) for styling
- **framer-motion** for animations
- **recharts** for data visualization
- **zod** for validation
- **Vitest** + **React Testing Library** for unit tests
- **Playwright** for E2E tests
- **Vercel** for deployment

### Directory Boundaries

- `src/app/**` — routes, route groups, layouts, API handlers (Convex HTTP via `/api/convex-auth`)
- `src/components/**` — reusable UI
  - `auth/` — Account recovery, entry panel, password form
  - `accounts/` — Multi-board shared budgeting (board/umbrella management, QR/link invite) + automatic cross-account sync
  - `dashboard/` — Dashboard shell, panels, alerts sidebar, critical expenses modal, daily disposable hero
  - `i18n/` — Locale switcher
  - `layout/` — Header bar
  - `legal/` — Cookie consent banner, site footer, legal pages
  - `launch/` — Cinematic splash, manifesto interstitial/notification
  - `mobile/` — Mobile panel frame
  - `onboarding/` — Language select modal
  - `pwa/` — Install prompt
  - `providers/` — App-level React context providers
  - `shared-board/` — Shared couple-board UI (keyed-merge sync)
  - `start-smart/` — Money Survival Blueprint panels
  - `ui/` — Primitive components (accordion, button, card, input, modal, progress-ring, select, slider, toggle)
  - `welcome/` — Welcome window
  - `wizard/` — Onboarding wizard (shell, progress, voice toggle, 10 steps)
- `src/hooks/` — Custom hooks (`use-accounts`, `use-account-sync`, `use-critical-expense`, `use-currency`, `use-display-prefs`, `use-haptic`, `use-local-db`, `use-news-prefs`, `use-shared-board`, `use-voice`)
- `src/i18n/` — Internationalization (messages, request, server)
- `src/lib/`
  - `auth/` — Auth utilities (`e2e-auth-override`, `route-guard`, `routes`)
  - `convex/` — Convex HTTP client, sync snapshots
  - `db/` — Local IndexedDB wrapper (`local-db.ts`)
  - `http/` — HTTP utilities
  - `legal/` — Legal agreement / consent recording helpers
  - `news/` — RSS fetcher
  - `types/` — Budget types
  - `utils/` — `cn`, `compound-calculator`, `currency`, `thai-category-mapper`
  - `animation/` — Animation presets
  - `colors/` — Theme color tokens
- `src/middleware.ts` — Convex Auth Next.js middleware (protects `/dashboard`, `/settings`, `/wizard`, `/api/v1/auth/bootstrap`). Note: `src/lib/auth/routes.ts` defines `AUTH_ROUTES.continue = "/auth/continue"`, but no page implements that route and it is not in the protected prefixes; post-auth users land on `/dashboard`.
- `src/test/` — Test setup, smoke test
- `src/types/` — TypeScript declarations (Next PWA, Speech API)
- `convex/` — Convex backend
  - `auth.ts` — Convex Auth config (Password provider)
  - `http.ts` — HTTP router (auth routes)
  - `schema.ts` — Convex schema (`authTables`, `userProfiles`, `sharedBoards`, `accounts`, `boardMembers`, `accountBoards`, `invites`, `dailySnapshots`, `legalAgreements`, `cookieConsents`)
  - `snapshots.ts` — `upsertDailySnapshot` mutation (daily backup from SW)
  - `lib/auth.ts` — Auth helpers (`requireIdentity`, `getAuthUserId`)
  - `_generated/` — Convex generated types

### Runtime Flow

The root app is auth-first, local-first PWA:

1. `/` decides whether the visitor stays on the welcome window, enters the launch wizard, or lands on the main board.
2. Language selection → stored in `localStorage` (`budgetbitch:locale`).
3. PWA install prompt shown after language selection.
4. Signed-in users → redirect to `/wizard` (if not complete) or `/dashboard` (if complete).
5. Protected surfaces: `/dashboard`, `/settings`, `/wizard`, `/api/v1/auth/bootstrap`. (`/auth/continue` is a route constant in `src/lib/auth/routes.ts` but has no page implementation and is not protected.)
6. Convex handles auth, realtime data, and daily snapshot persistence; Accounts/Invites tables power multi-board shared budgeting with automatic lossless cross-account sync.
7. IndexedDB + Service Worker provide offline-first UX; data syncs to Convex daily.
8. Market Watch surfaces localized finance news (RSS via `/api/news`) inside the dashboard; legal pages record consent server-side (`legalAgreements`, `cookieConsents`).

### Data Ownership

- **Convex** — Authoritative backend: auth, `dailySnapshots` table, realtime subscriptions.
- **IndexedDB** — Local cache for offline reads/writes; budget wizard profile, transactions, settings.
- **Service Worker** — Background sync: posts daily snapshots to Convex via `upsertDailySnapshot`.
- **Server-side secrets** — Convex Auth config, environment variables.

### Root App Rules

- Keep route logic thin; move business rules into `src/components/` or `src/lib/`.
- Keep UI reusable and scan-friendly in `src/components/**`.
- Keep auth and redirect safety centralized through `src/middleware.ts`, `src/lib/auth/routes.ts`, and shared auth helpers under `src/lib/auth/**`.
- Local-first: write to IndexedDB immediately, sync to Convex asynchronously.
- Use Convex realtime for live updates where needed (auth state, snapshots).

## 2) Testing and Verification

### Root App

- Unit/component tests live beside source under `src/**/*.test.tsx`.
- E2E tests live under `tests/e2e/`.
- Validation scripts: `npm run lint`, `npm test`, `npm run build`.

## 3) Practical Navigation Rule

Work in the root app by default.

## 4) Key Convex Patterns (from guidelines)

- **Auth:** `ctx.auth.getUserIdentity()` in queries/mutations/actions; never accept `userId` as argument.
- **Schema:** Define in `convex/schema.ts`; use `defineTable`, `v.*` validators; index naming `by_field1_and_field2`.
- **Queries:** Use `.withIndex()` not `.filter()`; prefer `.take()` or pagination over `.collect()`.
- **Mutations:** Use `ctx.db.patch` / `ctx.db.replace`; batch large operations with `ctx.scheduler.runAfter`.
- **Actions:** `"use node";` at top for Node.js built-ins; no `ctx.db` access; `fetch()` available in default runtime.
- **HTTP:** Defined in `convex/http.ts` with `httpAction`; registered at exact path.
- **Testing:** Use `convex-test` with `vitest`, `environment: "edge-runtime"`, module map from `import.meta.glob`.