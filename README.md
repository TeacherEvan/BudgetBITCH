# BudgetBITCH

BudgetBITCH is a cinematic, privacy-first budgeting application built with Next.js App Router, Prisma, Neon, Convex Auth, Inngest, Resend, Vercel, and Playwright.

## Navigation docs

- `docs/DEV_TREE.md` — project tree graph and quick orientation map
- `docs/CODEBASE_INDEX.md` — route/module/component index for future navigation

## Features in Phase 1

- Start Smart onboarding that generates a Money Survival Blueprint
- Learn! story-driven lessons linked from blueprint recommendations
- Jobs hub with blueprint-aware seeded listing recommendations
- Connected Finance expansion for banking, investing, payroll, tax, and finance-ops guidance
- protected dashboard routes
- workspace roles and audit-log foundations
- budget health scoring and due-soon automation
- notification fanout and email template scaffolding
- provider connection hub for Claude, OpenAI, GitHub Copilot, and OpenClaw
- auth-first root entry that sends signed-out visitors to the welcome window, signed-in users without a saved launch profile to the launch wizard, and signed-in users with a saved launch profile to the landing board
- privacy shield disclosures and consent receipt helpers
- encrypted provider-secret vault primitives and revoke flow
- API endpoints for auth bootstrap, budget health, Start Smart blueprint generation, Learn recommendations/module detail, Jobs search/recommendations, and integration connect/revoke
- compact launch wizard preferences with searchable city selection and threshold-based loading feedback

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- Neon Postgres
- Convex
- Convex Auth
- Inngest
- Resend
- Sentry
- Vercel
- Vitest
- Playwright

## Codebase shape

- `src/app/**` contains routes, route groups, layouts, and API handlers
- `src/app/page.tsx`, `src/app/sign-in/**`, `src/app/sign-up/**`, and `src/app/(app)/auth/continue/**` define the auth-first root entry and post-auth bootstrap path
- `src/components/start-smart/**` contains reusable UI for the Money Survival Blueprint flow
- `src/components/learn/**` contains reusable UI for the Learn! hub and lesson detail flow
- `src/components/jobs/**` contains reusable UI for the Jobs hub and job detail flow
- `src/modules/**` contains business/domain logic grouped by capability
- `src/components/integrations/**` contains reusable UI for the connection hub and provider wizards
- `prisma/**` contains the schema and checked-in migration history
- `tests/e2e/**` contains Playwright journeys for the auth-first root flow, dashboard, Start Smart, Learn!, Jobs, and provider wizards
- `budgetbitch/` is a separate nested Convex prototype/reference subtree and is **not** the primary app being built from the repo root

## Auth-first root flow

- `/` is the auth-first gate: signed-out visitors stay on the welcome window, signed-in visitors without a completed launch profile move into the launch wizard, and signed-in visitors with a completed launch profile land on the root board.
- `/sign-in` and `/sign-up` keep only sanitized in-app `redirectTo` targets. Safe root and dashboard targets are routed through `/auth/continue` before the final landing step.
- `/auth/continue` is the post-auth bootstrap boundary. It shows the final local-setup panel, then the continue action resolves any missing local user and workspace records before redirecting to the safe post-auth destination.
- `middleware.ts` recognizes `/auth/continue`, `/dashboard`, `/settings`, and `/api/v1` as the protected surface. Signed-out browser routes redirect to `/sign-in` and protected API routes return JSON authentication errors.

## Local setup

1. Copy environment values from `.env.example` into `.env.local`.
2. Install dependencies with `npm install`.
3. Create or link a Convex deployment with Convex Auth enabled, then set `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, and `SITE_URL`.
4. Set `PROVIDER_SECRET_ENCRYPTION_KEY` to a long random server-side secret before using integration connect/revoke routes under `/settings/integrations`.
5. When using Neon, set `DATABASE_URL` to the pooled connection string from the Neon **Connect** dialog and `DIRECT_URL` to the direct connection string.
6. If you plan to run `prisma migrate dev`, optionally set `SHADOW_DATABASE_URL` to a dedicated direct-connection shadow database.
7. Set `CONVEX_SYNC_SECRET` in both the Next.js/Vercel environment and the Convex deployment so auth bootstrap profile sync and projection replay use the same trusted secret.
8. Set `CRON_SECRET` in Vercel so the scheduled replay route can authenticate Vercel Cron requests.
9. Mirror the same Neon, Convex, projection, and provider-secret variables in Vercel before shipping preview or production deployments.
10. Generate the Prisma client with `npm run db:generate`.
11. Start development with `npm run dev`.
12. For browser tests, keep the Playwright web server on its dedicated webpack path. `playwright.config.ts` now starts `npm run dev -- --webpack --port 3100` through `scripts/run-with-sanitized-env.mjs`, with server reuse disabled, so local auth values do not change the auth-root test behavior and Turbopack does not hang on the first `/` request.

## Verification

Current workspace verification status:

- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run db:generate`
- `npm run build`

Current browser-test note:

- `npm run test:e2e` uses a dedicated webpack-backed dev server on port `3100` with server reuse disabled so the suite does not attach to a hanging Turbopack process.
- The Playwright web server strips local auth env on purpose so signed-out welcome coverage and the non-production signed-in fallback stay deterministic even when `.env.local` contains real dev keys.
- Playwright root coverage is split between `tests/e2e/welcome-auth.spec.ts` for signed-out entry behavior and `tests/e2e/smoke.spec.ts` for the signed-in root gate path.

For deeper orientation, start with `docs/DEV_TREE.md`, then use `docs/CODEBASE_INDEX.md` to jump to the right route, module, or test.

## Launch wizard notes

- Launch preferences remain local-only in `localStorage` under `budgetbitch:launch-profile`.
- The signed-in root E2E override is non-production-only and uses `budgetbitch:e2e-auth-state` only to exercise the signed-in root flow when auth client config is missing locally.
- Searchable city suggestions are loaded on demand from a small curated catalog instead of shipping every option up front.
- The launch loading window appears only when deferred transition work runs long enough to cross the threshold, and the money-themed art is prepared only when that loading state is needed.

## Database notes

The initial Prisma SQL migration is checked in under `prisma/migrations/20260406112000_init_core_schema/migration.sql`.

Client generation, tests, and builds can run without a live database, but Prisma migration status and `migrate dev` require a reachable PostgreSQL instance.

For Neon + Prisma 7 in this repo:

- use `DATABASE_URL` for your pooled application/runtime connection
- use `DIRECT_URL` for Prisma CLI operations
- use `SHADOW_DATABASE_URL` only if you want a dedicated shadow database for `prisma migrate dev`
- `prisma.config.ts` now requires `DIRECT_URL` for non-generate Prisma CLI work when `DATABASE_URL` points at a pooled Neon host, which avoids PgBouncer transaction-mode issues during schema operations
- the runtime Prisma client warns if `DATABASE_URL` points at a direct Neon host so you can move request traffic onto the pooled Neon endpoint before you hit connection-pressure issues

If you have a real PostgreSQL instance available, run:

- `npm run db:migrate -- --name init_core_schema`

## Neon + Convex runtime split

- Neon is the canonical store for durable financial and workspace records.
- Convex holds derived live state for daily check-ins, alert inbox rows, and workspace activity.
- `POST /api/v1/check-ins` writes the durable check-in first, then queues a `ProjectionOutbox` job.
- `/api/internal/projections/check-ins/replay` replays queued jobs into Convex using `CONVEX_SYNC_SECRET`.
- Vercel Cron calls `/api/cron/projections/check-ins/replay` once per day by default using `CRON_SECRET`, which keeps the default `vercel.json` compatible with the lowest-cost Hobby plan.
- If you need faster live projection on Vercel, raise the cron frequency on a Pro plan or point an external scheduler at the same route.
- Convex Auth email/password accounts are created by users through `/sign-up`; end users do not add environment files or OAuth credentials.

## Environment variables

See `.env.example` for the full list of required variables, including authentication, Convex projection sync, Sentry, and provider-secret encryption settings.

Environment notes:

- `CONVEX_DEPLOYMENT` identifies the Convex deployment for CLI/codegen commands.
- `NEXT_PUBLIC_CONVEX_URL` must be the Convex cloud URL, for example `https://steady-ox-280.convex.cloud`. Because it is a public Next.js variable, Vercel bakes it into the browser bundle at build time, so changing it requires a redeploy.
- `CONVEX_SITE_URL` must be the Convex site URL used as the Convex Auth issuer, for example `https://steady-ox-280.convex.site`.
- `SITE_URL` must be the app origin accepted by Convex Auth redirects, for example `http://localhost:3000` locally and `https://budget-bitch-green.vercel.app` in production.
- `CONVEX_SYNC_SECRET` must be set to the same long random value in the Next.js/Vercel environment and in the Convex deployment; `/auth/continue` and projection replay both depend on it for trusted server-side Convex sync.
- `PROVIDER_SECRET_ENCRYPTION_KEY` is only required when you want to exercise the encrypted integration connect/revoke routes.
- `RESEND_API_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, and `WEBHOOK_SIGNING_SECRET` remain scaffolded placeholders for email and webhook surfaces that are not active in the current root app slice.

## Start Smart regional data

The Start Smart flow uses curated, attributable regional inputs rather than open-ended scraping. Seeded assumptions keep the wizard responsive, then higher-trust data can refine those defaults when available. Major assumptions are labeled as verified, estimated, or user-entered so the resulting blueprint remains explainable.

## Learn recommendation model

The Learn! phase uses a static lesson catalog plus deterministic recommendation logic derived from stored Money Survival Blueprint signals. Recommendations are based on the latest persisted blueprint snapshot for a workspace, not on freeform AI generation or open-web content fetching.

## Jobs + Connected Finance model

The Jobs phase currently uses seeded job listings plus deterministic blueprint-aware ranking rather than live job-board ingestion. The Connected Finance expansion is guidance-first in this slice: newly added banking, investing, payroll, tax, and finance-ops providers extend the registry metadata and hub organization without introducing new auth flows yet.
