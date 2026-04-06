# BudgetBITCH

BudgetBITCH is a cinematic, privacy-first budgeting application built with Next.js App Router, Prisma, Clerk, Inngest, Resend, and Playwright.

## Features in Phase 1

- protected dashboard routes
- workspace roles and audit-log foundations
- budget health scoring and due-soon automation
- notification fanout and email template scaffolding
- provider connection hub for Claude, OpenAI, GitHub Copilot, and OpenClaw
- privacy shield disclosures and consent receipt helpers
- encrypted provider-secret vault primitives and revoke flow
- API endpoints for budget health and integration connect/revoke

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- Clerk
- Inngest
- Resend
- Sentry
- Vitest
- Playwright

## Local setup

1. Copy environment values from `.env.example` into `.env.local`.
2. Install dependencies with `npm install`.
3. Set `PROVIDER_SECRET_ENCRYPTION_KEY` to a long random server-side secret before using integration connect/revoke routes.
4. Ensure `DATABASE_URL` points to a reachable PostgreSQL instance.
5. Generate the Prisma client with `npm run db:generate`.
6. Start development with `npm run dev`.

## Verification

The project has been verified in this workspace with:

- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run db:generate`
- `npm run build`

## Database notes

The initial Prisma SQL migration is checked in under `prisma/migrations/20260406112000_init_core_schema/migration.sql`.

Client generation, tests, and builds can run without a live database, but Prisma migration status and `migrate dev` require a reachable PostgreSQL instance.

If you have a real PostgreSQL instance available, run:

- `npm run db:migrate -- --name init_core_schema`

## Environment variables

See `.env.example` for the full list of required variables, including authentication, email, webhook signing, Sentry, and provider-secret encryption settings.
