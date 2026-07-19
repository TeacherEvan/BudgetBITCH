# ARCHITECTURE.MD

## Purpose

This repository contains two separate Next.js + Convex codebases:

1. The **root BudgetBITCH app** in the repository root, which is the primary product.
2. The **nested `budgetbitch/` subtree**, which is a separate Convex prototype/reference app.

Treat them as distinct systems. The root app is the one to extend unless a task explicitly says otherwise.

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
  - `dashboard/` — Dashboard shell, panels (8), alerts sidebar, critical expenses modal, daily disposable hero
  - `i18n/` — Locale switcher
  - `layout/` — Header bar
  - `mobile/` — Mobile panel frame
  - `onboarding/` — Language select modal
  - `pwa/` — Install prompt
  - `ui/` — Primitive components (accordion, button, card, input, modal, progress-ring, select, slider, toggle)
  - `welcome/` — Welcome window
  - `wizard/` — Onboarding wizard (shell, progress, voice toggle, 10 steps)
- `src/hooks/` — Custom hooks (`use-critical-expense`, `use-local-db`, `use-voice`)
- `src/i18n/` — Internationalization (messages, request, server)
- `src/lib/`
  - `auth/` — Auth utilities (`e2e-auth-override`, `route-guard`, `routes`)
  - `convex/` — Convex HTTP client, sync snapshots
  - `db/` — Local IndexedDB wrapper (`local-db.ts`)
  - `news/` — RSS fetcher
  - `types/` — Budget types
  - `url.ts` — URL utilities
  - `utils/` — `cn`, `compound-calculator`, `currency`, `thai-category-mapper`
- `src/middleware.ts` — Convex Auth Next.js middleware (protects `/dashboard`, `/settings`, `/wizard`, `/api/v1/auth/bootstrap`). Note: `src/lib/auth/routes.ts` defines `AUTH_ROUTES.continue = "/auth/continue"`, but no page implements that route and it is not in the protected prefixes; post-auth users land on `/dashboard`.
- `src/test/` — Test setup, smoke test
- `src/types/` — TypeScript declarations (Next PWA, Speech API)
- `convex/` — Convex backend
  - `auth.ts` — Convex Auth config (Password provider)
  - `http.ts` — HTTP router (auth routes)
  - `schema.ts` — Convex schema (`dailySnapshots` + `authTables`)
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
6. Convex handles auth, realtime data, and daily snapshot persistence.
7. IndexedDB + Service Worker provide offline-first UX; data syncs to Convex daily.

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

## 2) Nested `budgetbitch/` Prototype Architecture

### Stack

- Next.js
- React
- Convex
- WorkOS AuthKit
- Tailwind CSS

### Shape

The prototype uses a simpler app-router layout:

- `budgetbitch/app/**` — route entries, callback route, root page, server pages
- `budgetbitch/convex/**` — Convex functions, auth config, schema, generated artifacts
- `budgetbitch/components/**` — shared client UI
- `budgetbitch/proxy.ts` — route protection

### Purpose

This subtree is a separate starter/prototype environment. It is useful as a reference, but it is not part of the root app build, test, or import graph.

## 3) Cross-System Boundaries

- Do not import code from `budgetbitch/` into the root app.
- Do not assume a route or module name in one tree exists in the other.
- When documenting or changing behavior, always specify which tree you mean.

## 4) Testing and Verification

### Root App

- Unit/component tests live beside source under `src/**/*.test.tsx`.
- E2E tests live under `tests/e2e/`.
- Validation scripts: `npm run lint`, `npm test`, `npm run build`.

### Prototype

- Verify it with its own app-local commands and Convex workflow.
- Treat its auth, routes, and backend as isolated from the root app.

## 5) Practical Navigation Rule

If a task does not explicitly mention the nested prototype, work in the root app.

## 6) Key Convex Patterns (from guidelines)

- **Auth:** `ctx.auth.getUserIdentity()` in queries/mutations/actions; never accept `userId` as argument.
- **Schema:** Define in `convex/schema.ts`; use `defineTable`, `v.*` validators; index naming `by_field1_and_field2`.
- **Queries:** Use `.withIndex()` not `.filter()`; prefer `.take()` or pagination over `.collect()`.
- **Mutations:** Use `ctx.db.patch` / `ctx.db.replace`; batch large operations with `ctx.scheduler.runAfter`.
- **Actions:** `"use node";` at top for Node.js built-ins; no `ctx.db` access; `fetch()` available in default runtime.
- **HTTP:** Defined in `convex/http.ts` with `httpAction`; registered at exact path.
- **Testing:** Use `convex-test` with `vitest`, `environment: "edge-runtime"`, module map from `import.meta.glob`.