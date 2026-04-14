# BudgetBITCH

BudgetBITCH is a cinematic, privacy-first budgeting application built with Next.js App Router, Prisma, Neon, Convex, Clerk, Inngest, Resend, Vercel, and Playwright.

## Navigation docs

- `.private-docs/docs/DEV_TREE.md` — project tree graph and quick orientation map
- `.private-docs/docs/CODEBASE_INDEX.md` — route/module/component index for future navigation

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
- privacy shield disclosures and consent receipt helpers
- encrypted provider-secret vault primitives and revoke flow
- API endpoints for budget health, Start Smart blueprint generation, Learn recommendations/module detail, Jobs search/recommendations, and integration connect/revoke

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- Neon Postgres
- Convex
- Clerk
- Inngest
- Resend
- Sentry
- Vercel
- Vitest
- Playwright

## Codebase shape

- `src/app/**` contains routes, route groups, layouts, and API handlers
- `src/components/start-smart/**` contains reusable UI for the Money Survival Blueprint flow
- `src/components/learn/**` contains reusable UI for the Learn! hub and lesson detail flow
- `src/components/jobs/**` contains reusable UI for the Jobs hub and job detail flow
- `src/lib/auth/**` contains request auth and workspace resolution helpers shared by protected routes
- `src/modules/**` contains business/domain logic grouped by capability
- `src/modules/workspaces/**` contains workspace membership and personal-workspace bootstrap logic
- `src/components/integrations/**` contains reusable UI for the connection hub and provider wizards
- `prisma/**` contains the schema and checked-in migration history
- `tests/e2e/**` contains Playwright journeys for the landing flow, dashboard, Start Smart, Learn!, Jobs, and provider wizards
- `budgetbitch/` is a separate nested Convex prototype/reference subtree and is **not** the primary app being built from the repo root

## Local setup

1. Copy environment values from `.env.example` into `.env.local`.
2. Install dependencies with `npm install`.
3. Set `PROVIDER_SECRET_ENCRYPTION_KEY` to a long random server-side secret before using integration connect/revoke routes.
4. When using Neon, set `DATABASE_URL` to the pooled connection string from the Neon **Connect** dialog and `DIRECT_URL` to the direct connection string.
5. If you plan to run `prisma migrate dev`, optionally set `SHADOW_DATABASE_URL` to a dedicated direct-connection shadow database.
6. Create or link a Convex deployment, then set `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CLERK_JWT_ISSUER_DOMAIN`, and `CONVEX_SYNC_SECRET`.
7. Set `CRON_SECRET` in Vercel so the scheduled replay route can authenticate Vercel Cron requests.
8. Mirror the same Neon, Clerk, and Convex environment variables in Vercel before shipping preview or production deployments.
9. Generate the Prisma client with `npm run db:generate`.
10. Start development with `npm run dev`.
11. For deterministic local Playwright runs, keep the non-secret `E2E_BYPASS_AUTH*` and `E2E_TEST_*` values from `.env.example` available only in the test runtime.

## Verification

Useful verification commands for this workspace:

- `npm run lint`
- `npm run test`
- `npm run db:generate`
- `npm run build`

Playwright runs use an explicit local auth bypass configured in `playwright.config.ts`, but the full `npm run test:e2e` pass should still be treated as unresolved until the remaining verification issue on this branch is closed.

For deeper orientation, start with `.private-docs/docs/DEV_TREE.md`, then use `.private-docs/docs/CODEBASE_INDEX.md` to jump to the right route, module, or test.

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
- Replace any placeholder `CLERK_JWT_ISSUER_DOMAIN` value with your real Clerk issuer before relying on Convex auth in local or Vercel environments.

## Environment variables

See `.env.example` for the full list of required variables, including authentication, email, webhook signing, Sentry, and provider-secret encryption settings.

The Playwright bypass variables are intentionally non-secret: `E2E_BYPASS_AUTH`, `E2E_BYPASS_AUTH_SOURCE`, `E2E_TEST_CLERK_USER_ID`, `E2E_TEST_EMAIL`, and `E2E_TEST_NAME`. They only activate the synthetic request profile when the app is running under `NODE_ENV=test` and the source guard is set to `playwright`.

## Protected workspace bootstrap

Protected app routes and workspace-backed API flows resolve auth through `src/lib/auth/request-auth.ts` and workspace context through `src/lib/auth/workspace-access.ts`.

If a signed-in user does not already belong to a workspace, `src/modules/workspaces/personal-workspace.ts` creates a personal workspace automatically and returns that membership as the current context. Start Smart persistence and the Dashboard, Learn, and Jobs experiences all use that resolved workspace so they can share the same latest persisted Money Survival Blueprint instead of drifting onto separate demo or per-page state.

## Start Smart regional data

The Start Smart flow uses curated, attributable regional inputs rather than open-ended scraping. Seeded assumptions keep the wizard responsive, then higher-trust data can refine those defaults when available. Major assumptions are labeled as verified, estimated, or user-entered so the resulting blueprint remains explainable.

## Learn recommendation model

The Learn! phase uses a static lesson catalog plus deterministic recommendation logic derived from stored Money Survival Blueprint signals. Recommendations are based on the latest persisted blueprint snapshot for a workspace, not on freeform AI generation or open-web content fetching.

## Jobs + Connected Finance model

The Jobs phase currently uses seeded job listings plus deterministic blueprint-aware ranking rather than live job-board ingestion. The Connected Finance expansion is guidance-first in this slice: newly added banking, investing, payroll, tax, and finance-ops providers extend the registry metadata and hub organization without introducing new auth flows yet.
