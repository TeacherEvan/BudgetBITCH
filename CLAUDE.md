# Budget Boss (BudgetBITCH repo) — Agent Instructions

Canonical conventions for AI agents and humans working in this repository.
This file mirrors [AGENTS.md](AGENTS.md); keep both in sync when editing.

The app's user-facing display name is **Budget Boss**. `BudgetBITCH` is the
repository / package name only — never put it in UI copy.

---

## 1. Repository shape

One Next.js + Convex codebase rooted at the repository root. There is no second
app tree (a nested `budgetbitch/` prototype existed and was removed 2026-07-20).

```
src/
├── app/          # App Router routes, layouts, API route handlers
├── components/   # React UI, grouped by feature
├── modules/      # Pure-TS domain logic (budgeting, home-base) — no React
├── lib/          # Cross-cutting utils (auth, convex, db, news, receipt, sms-parser)
├── hooks/        # Custom React hooks
├── i18n/         # next-intl catalogs (en, es, fr, de, pt, zh) + request/server
├── types/        # Ambient TS declarations
convex/           # Convex backend — read convex/_generated/ai/guidelines.md first
tests/e2e/        # Playwright specs
scripts/          # Build/CI guard scripts
```

Start from `docs/README.md` → `docs/CODEBASE_INDEX.md`, then the smallest
relevant surface. Don't start in `src/components/**` before checking
`src/app/**` or `src/modules/**`.

---

## 2. Stack (verified against `package.json`)

- Next.js 14 (App Router), React 18, TypeScript strict, path alias `@/*` → `src/*`
- Convex 1.34 — auth (`@convex-dev/auth` Password provider), database, realtime, HTTP
- IndexedDB via `idb` for local-first data; `public/sw.js` service worker for PWA sync
- next-intl v4 (cookie `bb-locale`), Tailwind CSS v4, framer-motion, recharts, zod
- tesseract.js (client OCR) + Gemini 2.5 Flash via `convex/receipts.ts` (server OCR)
- web-push (VAPID), qrcode.react, lottie-react, @rive-app/canvas, rss-parser
- Vitest + React Testing Library (unit), Playwright (E2E), ESLint 8 (`.eslintrc.json`)

There is **no** Prisma, Postgres, Inngest, Clerk, or Sentry in this repo. Do not
add them. `next-auth` is installed and `src/auth.ts` + `src/app/api/auth/[...nextauth]`
exist as an unwired Google-provider scaffold — the shipped auth path is Convex Auth.

---

## 3. Workflow

1. Edit domain logic in `src/modules/**` or `src/lib/**` before touching UI.
2. Update the colocated unit test (`*.test.ts[x]` beside the source).
3. Update the route/API handler, then the UI.
4. Verify: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:convex`,
   `npm run build` — or `npm run ci` to run the whole local gate chain.
5. E2E for user-facing flows: `npm run test:e2e` (Playwright, dev server on 3100).

Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `ci:`, `chore:`.

---

## 4. Convex rules

**Always read `convex/_generated/ai/guidelines.md` before changing Convex code.**
It overrides training-data assumptions. Key rules:

- Public API: `query` / `mutation` / `action`. Private: `internal*` variants.
- Always declare `args` validators with `v.*` from `convex/values`.
- Derive identity from `ctx.auth.getUserIdentity()`; never accept `userId` as an arg.
- Use `.withIndex()` — never `.filter()`. Never unbounded `.collect()`; use
  `.take()` or pagination. Index naming: `by_field1_and_field2`.
- Node-only actions need `"use node";` at the top and live in their own file
  (e.g. `convex/pushSend.ts`).
- Backend tests use `convex-test` + vitest (`npm run test:convex`).

Convex agent skills can be reinstalled with `npx convex ai-files install`.

---

## 5. Auth & route protection

- Convex Auth (email/password) via `@convex-dev/auth`; tokens are stored in
  `localStorage` (not cookies) so in-app mobile webviews (LINE, WhatsApp) work.
- There is no `src/middleware.ts`. Protection is client-side: `<RequireAuth />`
  plus `src/lib/auth/routes.ts` / `route-guard.ts`.
- Protected prefixes: `/dashboard`, `/accounts`, `/settings`, `/wizard`,
  `/api/v1/auth/bootstrap`. `AUTH_ROUTES.continue = "/auth/continue"` is a
  constant with no page behind it; post-auth users land on `/dashboard`.

---

## 6. React & UI conventions

- Server Components by default; add `'use client'` only for hooks/interactivity.
- Tailwind classes over inline styles; reuse `src/components/ui/**` primitives.
- Explicit action copy (`Open setup wizard`), not vague CTAs.
- Scan-first cards: headline → key facts → one fit cue → primary action.
- Preserve heading order inside reusable card components.
- Accent themes are dark-base only: `gold` (default), `amber`, `emerald`
  (`src/hooks/use-display-prefs.ts`, `src/app/globals.css`). No light mode yet.

---

## 7. Local-first data

- Write to IndexedDB (`src/lib/db/local-db.ts`) immediately; sync to Convex async.
- `src/lib/convex/sync-snapshots.ts` posts the daily snapshot via
  `upsertDailySnapshot`; failures queue in IndexedDB (`syncQueue` store)
  and replay on the `online` event.
- Adding an IndexedDB store means adding a `createObjectStore` call in `upgrade()`
  — enforced by `npm run check:idb`.

---

## 8. Common pitfalls

| Pitfall | Correct approach |
|---|---|
| Editing UI before finding the domain module | Start in `src/modules/**` / `src/lib/**` |
| Assuming Prisma / Clerk / Inngest exist | They don't — Convex + IndexedDB only |
| Skipping Convex guidelines | Read `convex/_generated/ai/guidelines.md` first |
| `.collect()` or `.filter()` in Convex | Indexes + `withIndex` + `.take()` |
| Passing `userId` from the client for authz | `ctx.auth.getUserIdentity()` server-side |
| Unnecessary `'use client'` | Default to Server Components |
| New IndexedDB store without `upgrade()` | `npm run check:idb` will fail the build |
| Writing "BudgetBITCH" in UI copy | Display name is "Budget Boss" |

---

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
