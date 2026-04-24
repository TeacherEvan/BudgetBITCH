# Codebase Index

This index is a future-navigation cheat sheet for the active root application.

## 1. High-value entry points

| Area             | File / Folder          | Why it matters                                                           |
| ---------------- | ---------------------- | ------------------------------------------------------------------------ |
| App shell        | `src/app/layout.tsx`   | Global layout and top-level app wrapper                                  |
| Root auth gate   | `src/app/page.tsx`     | Auth-first root gate for welcome, launch wizard, or landing board        |
| Auth bootstrap   | `src/app/(app)/auth/continue/page.tsx` | Post-Clerk local bootstrap and safe redirect boundary     |
| Route protection | `middleware.ts`        | Protected-surface fallback handling for auth continue, dashboard, settings, and `/api/v1` |
| Root config      | `next.config.ts`       | Next.js runtime config, including dev origin allowance                   |
| Prisma config    | `prisma.config.ts`     | Prisma 7 config and env loading                                          |
| Data model       | `prisma/schema.prisma` | Canonical schema for workspaces, budgets, reminders, audit, integrations |

## 2. Route map

### App routes

| Route                             | File                                                    | Purpose                            |
| --------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `/`                               | `src/app/page.tsx`                                      | Auth-first gate for welcome, wizard, or landing board |
| `/sign-in`                        | `src/app/sign-in/[[...sign-in]]/page.tsx`               | Clerk sign-in entry with sanitized `redirectTo` handling |
| `/sign-up`                        | `src/app/sign-up/[[...sign-up]]/page.tsx`               | Clerk sign-up entry with sanitized `redirectTo` handling |
| `/auth/continue`                  | `src/app/(app)/auth/continue/page.tsx`                  | Post-Clerk bootstrap and safe post-auth redirect |
| `/start-smart`                    | `src/app/(app)/start-smart/page.tsx`                    | Money Survival Blueprint wizard    |
| `/learn`                          | `src/app/(app)/learn/page.tsx`                          | Learn! recommendation hub          |
| `/learn/[slug]`                   | `src/app/(app)/learn/[slug]/page.tsx`                   | Learn! lesson detail               |
| `/jobs`                           | `src/app/(app)/jobs/page.tsx`                           | Jobs hub with recommended listings |
| `/jobs/[slug]`                    | `src/app/(app)/jobs/[slug]/page.tsx`                    | Job detail + fit impact summary    |
| `/dashboard`                      | `src/app/(app)/dashboard/page.tsx`                      | Protected dashboard shell          |
| `/settings/integrations`          | `src/app/(app)/settings/integrations/page.tsx`          | Provider connection hub            |
| `/settings/integrations/claude`   | `src/app/(app)/settings/integrations/claude/page.tsx`   | Claude setup wizard                |
| `/settings/integrations/openai`   | `src/app/(app)/settings/integrations/openai/page.tsx`   | OpenAI setup wizard                |
| `/settings/integrations/copilot`  | `src/app/(app)/settings/integrations/copilot/page.tsx`  | GitHub Copilot setup wizard        |
| `/settings/integrations/openclaw` | `src/app/(app)/settings/integrations/openclaw/page.tsx` | OpenClaw setup wizard              |
| `/settings/integrations/gemini`   | `src/app/(app)/settings/integrations/gemini/page.tsx`   | Gemini setup wizard                |
| `/settings/integrations/perplexity` | `src/app/(app)/settings/integrations/perplexity/page.tsx` | Perplexity setup wizard         |
| `/settings/integrations/mistral`  | `src/app/(app)/settings/integrations/mistral/page.tsx`  | Mistral setup wizard               |
| `/settings/integrations/wise`     | `src/app/(app)/settings/integrations/wise/page.tsx`     | Wise setup wizard                  |
| `/settings/integrations/revolut`  | `src/app/(app)/settings/integrations/revolut/page.tsx`  | Revolut setup wizard               |
| `/settings/integrations/paypal`   | `src/app/(app)/settings/integrations/paypal/page.tsx`   | PayPal setup wizard                |
| `/settings/integrations/xero`     | `src/app/(app)/settings/integrations/xero/page.tsx`     | Xero setup wizard                  |
| `/settings/integrations/deel`     | `src/app/(app)/settings/integrations/deel/page.tsx`     | Deel setup wizard                  |

### API routes

- `POST /api/v1/budgets/health` → `src/app/api/v1/budgets/health/route.ts` — validates budget payloads and returns health scoring
- `POST /api/v1/auth/bootstrap` → `src/app/api/v1/auth/bootstrap/route.ts` — boots or reuses the local user/workspace records for an authenticated Clerk session
- `POST /api/v1/start-smart/regional-data` → `src/app/api/v1/start-smart/regional-data/route.ts` — returns a normalized region snapshot with trust metadata
- `POST /api/v1/start-smart/blueprint` → `src/app/api/v1/start-smart/blueprint/route.ts` — builds a Money Survival Blueprint and attempts persistence
- `POST /api/v1/learn/recommendations` → `src/app/api/v1/learn/recommendations/route.ts` — resolves lesson recommendations from the latest stored blueprint
- `GET /api/v1/learn/modules/[slug]` → `src/app/api/v1/learn/modules/[slug]/route.ts` — returns canonical Learn! lesson detail by slug
- `POST /api/v1/jobs/search` → `src/app/api/v1/jobs/search/route.ts` — filters the seeded jobs catalog by practical constraints
- `POST /api/v1/jobs/recommendations` → `src/app/api/v1/jobs/recommendations/route.ts` — ranks jobs using the latest stored blueprint signals
- `POST /api/v1/integrations/connect` → `src/app/api/v1/integrations/connect/route.ts` — validates connect requests, seals secrets, emits audit payload
- `POST /api/v1/integrations/revoke` → `src/app/api/v1/integrations/revoke/route.ts` — marks vault entries revoked and emits audit payload

## 3. Domain module index

- **Auth** — `src/modules/auth/*.ts`, `src/lib/auth/*.ts` — redirect sanitizing, Clerk config checks, Clerk-user helpers, and local bootstrap wiring
- **Start Smart** — `src/modules/start-smart/*.ts` — profile normalization, regional data, blueprint generation, and wizard state
- **Learn!** — `src/modules/learn/*.ts` — lesson schema, module catalog, blueprint signal extraction, and recommendation resolution
- **Jobs** — `src/modules/jobs/*.ts` — seeded jobs catalog, filter schema, blueprint signal extraction, and fit scoring
- **Workspaces** — `src/modules/workspaces/permissions.ts` — role permission helpers
- **Audit** — `src/modules/audit/audit-log.ts`, `src/modules/audit/integration-audit.ts` — normalized audit event payload builders
- **Budgets** — `src/modules/budgets/budget-health.ts` — budget health scoring
- **Automation** — `src/modules/automation/rules/bill-due-soon.ts` — due-soon trigger rule
- **Notifications** — `src/modules/notifications/fanout.ts` — channel fanout selection
- **Email** — `src/modules/email/templates/bill-due-soon.tsx` — React Email template for reminders
- **Calendar** — `src/modules/calendar/project-reminder.ts` — reminder-to-calendar projection
- **Integrations** — `src/modules/integrations/*.ts` — provider registry, webhook signing, wizard machine, and vault helpers
- **Jobs** — `src/modules/jobs/reminder-job.ts` — Inngest payload builder
- **Privacy** — `src/modules/privacy/consent-ledger.ts` — consent receipt payload creation
- **Inngest client** — `src/inngest/client.ts` — shared event client bootstrap

## 4. Integration subsystem map

### Shared UI primitives

| File                                                       | Purpose                           |
| ---------------------------------------------------------- | --------------------------------- |
| `src/components/integrations/provider-card.tsx`            | Hub card per provider             |
| `src/components/integrations/tool-rail.tsx`                | Shared explicit action rail       |
| `src/components/integrations/privacy-badge.tsx`            | Small privacy promise badge       |
| `src/components/integrations/provider-wizard-shell.tsx`    | Shared wizard frame and back-link |
| `src/components/integrations/official-link-list.tsx`       | Official login/docs links         |
| `src/components/integrations/privacy-disclosure-panel.tsx` | Privacy disclosure copy           |
| `src/components/integrations/risk-checklist.tsx`           | Checklist-style warnings          |
| `src/components/integrations/system-access-warning.tsx`    | System access warning panel       |

### Integration logic

- `src/modules/integrations/provider-types.ts` — Shared provider type definitions + categories
- `src/modules/integrations/provider-registry.ts` — Canonical provider metadata across AI, banking, finance ops, tax, and payroll providers
- `src/modules/integrations/integration-actions.ts` — Shared explicit CTA deck builder for hub and wizard screens
- `src/modules/integrations/integration-gateway.ts` — Thin server-side connect/revoke orchestration wrapper
- `src/modules/integrations/wizard-machine.ts` — Simple wizard step state transitions
- `src/modules/integrations/sign-webhook.ts` — HMAC-SHA256 signing helper
- `src/modules/integrations/connection-vault.ts` — Secret sealing + revoke metadata helpers

Wizard routes currently cover Claude, OpenAI, GitHub Copilot, OpenClaw, Gemini, Perplexity, Mistral, Wise, Revolut, PayPal, Xero, and Deel.

## 5. Testing map

### Unit / component tests

- Located beside the code they exercise under `src/**`
- Pattern: `*.test.ts` or `*.test.tsx`

Useful anchors:

- `src/app/(app)/dashboard/page.test.tsx`
- `src/app/(app)/jobs/**/*.test.tsx`
- `src/app/(app)/learn/**/*.test.tsx`
- `src/app/(app)/settings/integrations/**/*.test.tsx`
- `src/modules/**/*.test.ts`

### E2E tests

| File                                      | Coverage                               |
| ----------------------------------------- | -------------------------------------- |
| `tests/e2e/welcome-auth.spec.ts`          | Signed-out root entry, welcome auth links, and preserved `redirectTo` |
| `tests/e2e/smoke.spec.ts`                 | Signed-in root gate smoke for wizard-first and landing-first paths |
| `tests/e2e/dashboard.spec.ts`             | Dashboard visual slice                 |
| `tests/e2e/start-smart.spec.ts`           | Start Smart wizard to blueprint result |
| `tests/e2e/learn.spec.ts`                 | Start Smart to Learn lesson journey    |
| `tests/e2e/jobs.spec.ts`                  | Landing to Jobs detail journey         |
| `tests/e2e/integrations-claude.spec.ts`   | Claude wizard navigation               |
| `tests/e2e/integrations-gemini.spec.ts`   | Gemini wizard navigation               |
| `tests/e2e/integrations-openai.spec.ts`   | OpenAI wizard navigation               |
| `tests/e2e/integrations-copilot.spec.ts`  | Copilot wizard navigation              |
| `tests/e2e/integrations-openclaw.spec.ts` | OpenClaw wizard navigation             |
| `tests/e2e/integrations-tool-rail.spec.ts` | Explicit tool rail labels on setup page|

## 6. Data + infrastructure files

| File                                                              | Purpose                             |
| ----------------------------------------------------------------- | ----------------------------------- |
| `prisma/schema.prisma`                                            | Root schema                         |
| `prisma/migrations/20260406112000_init_core_schema/migration.sql` | Initial checked-in migration        |
| `prisma.config.ts`                                                | Prisma 7 runtime config             |
| `playwright.config.ts`                                            | E2E runtime + local webpack-backed web server |
| `vitest.config.ts`                                                | Unit/component test config          |
| `eslint.config.mjs`                                               | Root lint rules and ignore patterns |
| `sentry.client.config.ts`                                         | Client-side Sentry bootstrap        |
| `sentry.server.config.ts`                                         | Server-side Sentry bootstrap        |

## 7. Non-primary subtree note

| Path                     | Status                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `budgetbitch/`           | Separate nested Convex prototype/reference app; excluded from root TypeScript project |
| `WelcomeWindow-startup/` | Legacy visual reference folder; not part of the active root auth-first flow          |

## 8. Suggested navigation recipes

### I want to change a provider wizard

1. Start at `src/app/(app)/settings/integrations/<provider>/page.tsx`
2. Check shared UI in `src/components/integrations/**`
3. Check provider metadata in `src/modules/integrations/provider-registry.ts`
4. Re-run the provider page test + matching e2e spec

### I want to change auth entry or the root gate

1. Start at `src/app/page.tsx`
2. Check `src/components/welcome/**`, `src/app/sign-in/**`, `src/app/sign-up/**`, and `src/app/(app)/auth/continue/**`
3. Check `src/modules/auth/post-auth-redirect.ts` and related auth helpers
4. Re-run the related route tests plus `tests/e2e/welcome-auth.spec.ts` and `tests/e2e/smoke.spec.ts`

### I want to change business logic

1. Start in `src/modules/<domain>/**`
2. Update colocated unit test first
3. Follow any dependent API route in `src/app/api/**`

### I want to change Start Smart onboarding

1. Start at `src/app/(app)/start-smart/page.tsx`
2. Check shared wizard UI in `src/components/start-smart/**`
3. Check domain logic in `src/modules/start-smart/**`
4. Re-run the route tests plus `tests/e2e/start-smart.spec.ts`

### I want to change Learn recommendations or lessons

1. Start at `src/app/(app)/learn/**`
2. Check shared lesson UI in `src/components/learn/**`
3. Check recommendation logic in `src/modules/learn/**`
4. Re-run the Learn route tests plus `tests/e2e/learn.spec.ts`

### I want to change Jobs recommendations or listings

1. Start at `src/app/(app)/jobs/**`
2. Check shared jobs UI in `src/components/jobs/**`
3. Check fit and filter logic in `src/modules/jobs/**`
4. Re-run the Jobs route tests plus `tests/e2e/jobs.spec.ts`

### I want to change database shape

1. Edit `prisma/schema.prisma`
2. Generate/update migration under `prisma/migrations/**`
3. Run `npm run db:generate`
4. Re-check any affected routes/modules/tests

### I want to trace an integration connect request

1. `src/app/(app)/settings/integrations/**`
2. `src/components/integrations/**`
3. `src/app/api/v1/integrations/connect/route.ts`
4. `src/modules/integrations/connection-vault.ts`
5. `src/modules/audit/integration-audit.ts`

