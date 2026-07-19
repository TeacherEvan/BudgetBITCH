# BudgetBITCH

BudgetBITCH is a cinematic, privacy-first budgeting application built with Next.js App Router, Convex (auth, database, realtime), IndexedDB for local-first offline data, Service Worker for PWA sync, next-intl for i18n (Thai/English), Tailwind CSS v4, framer-motion, recharts, and zod.

## Navigation docs

- `docs/CODEBASE_INDEX.md` — consolidated orientation map, route/module index, and practical filesystem tree

## Features in Phase 1

- Start Smart onboarding that generates a Money Survival Blueprint
- Learn! story-driven lessons linked from blueprint recommendations
- Jobs hub with blueprint-aware seeded listing recommendations
- Connected Finance expansion for banking, investing, payroll, tax, and finance-ops guidance
- protected dashboard routes
- workspace roles and audit-log foundations
- budget health scoring and due-soon automation
- notification fanout and email template scaffolding
- auth-first root entry that sends signed-out visitors to the welcome window, signed-in users without a saved launch profile to the launch wizard, and signed-in users with a saved launch profile to the landing board
- privacy shield disclosures and consent receipt helpers
- API endpoints for auth bootstrap, budget health, Start Smart blueprint generation, Learn recommendations/module detail, Jobs search/recommendations

> Planned (not yet implemented in the current root app slice): the provider connection hub (Claude, OpenAI, GitHub Copilot, OpenClaw, Gemini, Perplexity, Mistral, Wise, Revolut, PayPal, Xero, Deel), the encrypted provider-secret vault primitives and revoke flow, and the integration connect/revoke API under `/settings/integrations`. These are tracked in `docs/CODEBASE_INDEX.md` (route map) and the revamp design plan, but no route or components exist yet.
- compact launch wizard preferences with searchable city selection and threshold-based loading feedback

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
- `src/app/page.tsx`, `src/app/sign-in/**`, `src/app/sign-up/**`, and `src/app/(app)/auth/continue/**` define the auth-first root entry and post-auth bootstrap path
- `src/lib/auth/routes.ts` centralizes protected path prefixes and auth route constants used by route protection
- `src/modules/**` contains business/domain logic grouped by capability; currently `src/modules/budgeting/` (budget math) and `src/modules/home-base/` (root board orchestration)
- `src/components/start-smart/**` contains reusable UI for the Money Survival Blueprint flow
- `src/components/dashboard/`, `src/components/wizard/`, `src/components/welcome/`, `src/components/auth/`, `src/components/shared-board/`, and `src/components/mobile/` hold the primary UI surfaces
- `src/components/integrations/**` and the `/settings/integrations` route do not exist yet — the provider connection hub is planned (see "Planned" note above); no route or components are present
- `tests/e2e/**` currently holds `dogfood.spec.ts`, which exercises the signed-in root gate path. The welcome-auth/smoke split is not yet present.
- `budgetbitch/` is a separate nested Convex prototype/reference subtree and is **not** the primary app being built from the repo root

## Auth-first root flow

- `/` is the auth-first gate: signed-out visitors stay on the welcome window, signed-in visitors without a completed launch profile move into the launch wizard, and signed-in visitors with a completed launch profile land on the root board.
- `/sign-in` and `/sign-up` keep only sanitized in-app `redirectTo` targets. Safe root and dashboard targets are routed through `/auth/continue` before the final landing step.
- `/auth/continue` is the post-auth bootstrap boundary. It shows the final local-setup panel, then the continue action resolves any missing local user and workspace records before redirecting to the safe post-auth destination.
- `src/middleware.ts` protects the shared product surface by reading the centralized prefixes in `src/lib/auth/routes.ts`. Signed-out browser routes redirect to `/sign-in`, protected API routes return JSON authentication errors, and the non-production signed-in E2E override is still honored for protected coverage.

## Local setup

1. Copy environment values from `.env.example` into `.env.local`.
2. Install dependencies with `npm install`.
3. Create or link a Convex deployment with Convex Auth enabled, then set `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, and `SITE_URL`.
4. Set `PROVIDER_SECRET_ENCRYPTION_KEY` to a long random server-side secret before using integration connect/revoke routes under `/settings/integrations`.
5. Set `CONVEX_SYNC_SECRET` in both the Next.js/Vercel environment and the Convex deployment so auth bootstrap profile sync and projection replay use the same trusted secret.
6. Set `CRON_SECRET` in Vercel so the scheduled replay route can authenticate Vercel Cron requests.
7. Mirror the same Convex, projection, and provider-secret variables in Vercel before shipping preview or production deployments.
8. Start development with `npm run dev`.
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

### Daily snapshot flow

- `POST /api/v1/check-ins` writes the durable check-in first, then queues a `ProjectionOutbox` job.
- `/api/internal/projections/check-ins/replay` replays queued jobs into Convex using `CONVEX_SYNC_SECRET`.
- Vercel Cron calls `/api/cron/projections/check-ins/replay` once per day by default using `CRON_SECRET`, which keeps the default `vercel.json` compatible with the lowest-cost Hobby plan.
- If you need faster live projection on Vercel, raise the cron frequency on a Pro plan or point an external scheduler at the same route.
- Convex Auth email/password accounts are created by users through `/sign-up`; end users do not add environment files or OAuth credentials.

## Environment variables

See `.env.example` for the full list of required variables, including authentication, Convex projection sync, and provider-secret encryption settings.

Environment notes:

- `CONVEX_DEPLOYMENT` identifies the Convex deployment for CLI/codegen commands.
- `NEXT_PUBLIC_CONVEX_URL` must be the Convex cloud URL, for example `https://steady-ox-280.convex.cloud`. Because it is a public Next.js variable, Vercel bakes it into the browser bundle at build time, so changing it requires a redeploy.
- `CONVEX_SITE_URL` must be the Convex site URL used as the Convex Auth issuer, for example `https://steady-ox-280.convex.site`.
- `SITE_URL` must be the app origin accepted by Convex Auth redirects, for example `http://localhost:3000` locally and `https://budget-bitch-green.vercel.app` in production.
- `CONVEX_SYNC_SECRET` must be set to the same long random value in the Next.js/Vercel environment and in the Convex deployment; `/auth/continue` and projection replay both depend on it for trusted server-side Convex sync.
- `PROVIDER_SECRET_ENCRYPTION_KEY` is only required when you want to exercise the encrypted integration connect/revoke routes. No `/settings/integrations` route or components exist yet, so this is currently unused; it is reserved for the planned provider-vault work tracked in `docs/CODEBASE_INDEX.md`.
- Email (`RESEND_API_KEY`) and webhook/queue (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `WEBHOOK_SIGNING_SECRET`) surfaces are not active in the current root app slice and are not present in `.env.example`. They are listed here only so a future integration slice can add them without colliding with the existing Convex sync secrets.

## Start Smart regional data

The Start Smart flow uses curated, attributable regional inputs rather than open-ended scraping. Seeded assumptions keep the wizard responsive, then higher-trust data can refine those defaults when available. Major assumptions are labeled as verified, estimated, or user-entered so the resulting blueprint remains explainable.

## Learn recommendation model

The Learn! phase uses a static lesson catalog plus deterministic recommendation logic derived from stored Money Survival Blueprint signals. Recommendations are based on the latest persisted blueprint snapshot for a workspace, not on freeform AI generation or open-web content fetching.

## Jobs + Connected Finance model

The Jobs phase currently uses seeded job listings plus deterministic blueprint-aware ranking rather than live job-board ingestion. The Connected Finance expansion is guidance-first in this slice: newly added banking, investing, payroll, tax, and finance-ops providers extend the registry metadata and hub organization without introducing new auth flows yet.