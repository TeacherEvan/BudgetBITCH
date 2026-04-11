# BudgetBITCH

BudgetBITCH is a cinematic, privacy-first budgeting application built with Next.js App Router, Prisma, Neon, Convex, Clerk, Inngest, Resend, Vercel, and Playwright.

## Navigation docs

- `docs/DEV_TREE.md` — project tree graph and quick orientation map
- `docs/CODEBASE_INDEX.md` — route/module/component index for future navigation

## Documentation boundaries

- `README.md`, `docs/DEV_TREE.md`, and `docs/CODEBASE_INDEX.md` are the canonical root-app orientation docs.
- `.github/copilot-instructions.md` is the root Copilot guidance file.
- `AGENTS.md` and `CLAUDE.md` are Convex-specific guidance notes; they can be merged with each other if the repo ever wants a single Convex instruction file.
- `docs/frontend-audit-2026-04-07.md`, `.github/superpower/**`, `budgetbitch/**`, `.agents/**`, `.github/.agents/**`, and generated Convex/skill markdown are reference or tooling artifacts, not primary root-app docs.

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
- `src/modules/**` contains business/domain logic grouped by capability
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
10. Before a real deploy, apply checked-in Prisma migrations with `npm run db:migrate:deploy`.
11. Start development with `npm run dev`.

## Verification

The project has been verified in this workspace with:

- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run db:generate`
- `npm run build`

For deeper orientation, start with `docs/DEV_TREE.md`, then use `docs/CODEBASE_INDEX.md` to jump to the right route, module, or test.

## Database notes

The initial Prisma SQL migration is checked in under `prisma/migrations/20260406112000_init_core_schema/migration.sql`.

Client generation, tests, and builds can run without a live database, but Prisma migration status and `migrate dev` require a reachable PostgreSQL instance.

For Neon + Prisma 7 in this repo:

- use `DATABASE_URL` for your pooled application/runtime connection
- use `DIRECT_URL` for Prisma CLI operations
- use `SHADOW_DATABASE_URL` only if you want a dedicated shadow database for `prisma migrate dev`

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

## Start Smart regional data

The Start Smart flow uses curated, attributable regional inputs rather than open-ended scraping. Seeded assumptions keep the wizard responsive, then higher-trust data can refine those defaults when available. Major assumptions are labeled as verified, estimated, or user-entered so the resulting blueprint remains explainable.

## Learn recommendation model

The Learn! phase uses a static lesson catalog plus deterministic recommendation logic derived from stored Money Survival Blueprint signals. Recommendations are based on the latest persisted blueprint snapshot for a workspace, not on freeform AI generation or open-web content fetching.

## Jobs + Connected Finance model

The Jobs phase currently uses seeded job listings plus deterministic blueprint-aware ranking rather than live job-board ingestion. The Connected Finance expansion is guidance-first in this slice: newly added banking, investing, payroll, tax, and finance-ops providers extend the registry metadata and hub organization without introducing new auth flows yet.
