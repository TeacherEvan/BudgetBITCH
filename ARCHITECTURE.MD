# ARCHITECTURE.MD

## Purpose

This repository contains two separate Next.js + Convex codebases:

1. The **root BudgetBITCH app** in the repository root, which is the primary product.
2. The **nested `budgetbitch/` subtree**, which is a separate Convex prototype/reference app.

Treat them as distinct systems. The root app is the one to extend unless a task explicitly says otherwise.

## 1) Root app architecture

### Stack

- Next.js App Router
- React 19 + TypeScript
- Prisma 7 + Neon Postgres
- Convex for derived live state and Convex Auth email/password accounts
- Inngest for async/event-driven jobs
- Resend for email
- Sentry for observability
- Vercel for deployment and cron

### Directory boundaries

- `src/app/**` — routes, route groups, layouts, API handlers
- `src/components/**` — reusable UI
- `src/modules/**` — domain and business logic
- `src/lib/**` — small shared helpers such as auth config
- `prisma/**` — canonical schema and migration history
- `tests/e2e/**` — Playwright journeys

### Runtime flow

The root app is auth-first:

1. `/` decides whether the visitor stays on the welcome window, enters the launch wizard, or lands on the main board.
2. Signed-in users pass through `/auth/continue` for local bootstrap and safe redirect resolution.
3. Protected product surfaces live under the app route group, including Start Smart, Learn, Jobs, Dashboard, and Integrations.
4. API routes in `src/app/api/v1/**` delegate real work into `src/modules/**`.

### Data ownership

- **Prisma + Neon** hold the durable product data.
- **Convex** holds derived live state that benefits from quick replay or projection.
- **Inngest** carries background/event work.
- **Server-side secrets** stay in server-only code paths.

### Root app rules

- Keep route logic thin; move business rules into `src/modules/**`.
- Keep UI reusable and scan-friendly in `src/components/**`.
- Keep auth and redirect safety centralized.
- Keep API handlers as orchestration layers, not business-rule homes.

## 2) Nested `budgetbitch/` prototype architecture

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

## 3) Cross-system boundaries

- Do not import code from `budgetbitch/` into the root app.
- Do not assume a route or module name in one tree exists in the other.
- When documenting or changing behavior, always specify which tree you mean.

## 4) Testing and verification

### Root app

- Unit/component tests live beside source under `src/**`.
- End-to-end tests live under `tests/e2e/**`.
- Validation scripts are `npm run lint`, `npm test`, and `npm run build`.

### Prototype

- Verify it with its own app-local commands and Convex workflow.
- Treat its auth, routes, and backend as isolated from the root app.

## 5) Practical navigation rule

If a task does not explicitly mention the nested prototype, work in the root app.

