# Dev Tree Graph

This file is a fast orientation map for the active BudgetBITCH app.

## Active app graph

```mermaid
flowchart TD
  A[README.md] --> B[src/app]
  A --> C[src/modules]
  A --> D[src/components]
  A --> E[prisma]
  A --> F[tests/e2e]
  A --> G[src/lib]
  A --> H[src/inngest]

  B --> B1[page.tsx\nauth-first root gate]
  B --> B1d[sign-in\nAuth.js Google sign-in entry]
  B --> B1e[sign-up\nredirects into sign-in]
  B --> B1f[(app)/auth/continue\npost-auth local bootstrap boundary]
  B --> B1a[(app)/start-smart\nMoney Survival Blueprint wizard]
  B --> B1b[(app)/learn\nLearn hub + lessons]
  B --> B1c[(app)/jobs\nJobs hub + detail]
  B --> B2[(app)/dashboard]
  B --> B3[(app)/settings/integrations]
  B --> B4[api/v1]

  B4 --> B41[budgets/health/route.ts]
  B4 --> B40[auth/bootstrap/route.ts]
  B4 --> B46[learn/recommendations/route.ts]
  B4 --> B47[learn/modules/[slug]/route.ts]
  B4 --> B48[jobs/search/route.ts]
  B4 --> B49[jobs/recommendations/route.ts]
  B4 --> B44[start-smart/regional-data/route.ts]
  B4 --> B45[start-smart/blueprint/route.ts]
  B4 --> B42[integrations/connect/route.ts]
  B4 --> B43[integrations/revoke/route.ts]

  C --> C1[audit]
  C --> C2[automation]
  C --> C3[budgets]
  C --> C4[calendar]
  C --> C5[email]
  C --> C6[integrations]
  C --> C11[start-smart]
  C --> C12[learn]
  C --> C7[jobs]
  C --> C8[notifications]
  C --> C9[privacy]
  C --> C10[workspaces]

  D --> D1[integrations UI primitives]
  D --> D2[start-smart UI primitives]
  D --> D3[learn UI primitives]
  D --> D4[jobs UI primitives]
  E --> E1[schema.prisma]
  E --> E2[migrations]
  F --> F1[welcome-auth root entry coverage]
  F --> F2[signed-in root smoke + dashboard + wizard journeys + Start Smart + Learn + Jobs]
  G --> G1[auth config + route guards]
  H --> H1[Inngest client]
```

## Practical filesystem tree

```text
.
├── README.md
├── docs/
│   ├── CODEBASE_INDEX.md
│   └── DEV_TREE.md
├── src/middleware.ts
├── next.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── 20260406112000_init_core_schema/
│       │   └── migration.sql
│       └── migration_lock.toml
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── (app)/
│   │   │   ├── auth/
│   │   │   │   └── continue/
│   │   │   ├── learn/
│   │   │   ├── jobs/
│   │   │   ├── start-smart/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.test.tsx
│   │   │   └── settings/
│   │   │       └── integrations/
│   │   │           ├── page.tsx
│   │   │           ├── page.test.tsx
│   │   │           ├── claude/
│   │   │           ├── openai/
│   │   │           ├── copilot/
│   │   │           └── openclaw/
│   │   └── api/
│   │       └── v1/
│   │           ├── auth/bootstrap/route.ts
│   │           ├── budgets/health/route.ts
│   │           ├── jobs/
│   │           │   ├── recommendations/route.ts
│   │           │   └── search/route.ts
│   │           ├── learn/
│   │           │   ├── recommendations/route.ts
│   │           │   └── modules/[slug]/route.ts
│   │           ├── start-smart/
│   │           │   ├── blueprint/route.ts
│   │           │   └── regional-data/route.ts
│   │           └── integrations/
│   │               ├── connect/route.ts
│   │               └── revoke/route.ts
│   ├── components/
│   │   ├── integrations/
│   │   ├── jobs/
│   │   ├── learn/
│   │   └── start-smart/
│   ├── inngest/
│   │   └── client.ts
│   ├── lib/
│   │   └── auth/
│   ├── modules/
│   │   ├── audit/
│   │   ├── automation/
│   │   ├── budgets/
│   │   ├── calendar/
│   │   ├── email/
│   │   ├── integrations/
│   │   ├── learn/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   ├── privacy/
│   │   └── workspaces/
│   └── test/
│       ├── setup.ts
│       └── smoke.test.ts
├── tests/
│   └── e2e/
└── WelcomeWindow-startup/
    └── WelcomeScreen.tsx
```

## Scope notes

- `src/**` is the active application code for the root Next.js app.
- `prisma/**` is the authoritative data model and checked-in migration history.
- `src/components/welcome/**` holds the signed-out welcome window shown by the root auth gate and is the right entry point for feature-summary landing copy.
- `src/components/auth/**`, `src/modules/auth/**`, and `src/lib/auth/**` hold the shared auth entry UI, redirect sanitizing, Auth.js session handling, and local bootstrap helpers used by the root auth flow.
- `src/components/launch/**` holds the one-time startup questionnaire logic used after login and before the normal signed-in landing state.
- `tests/e2e/**` contains Playwright journey coverage, including a split between signed-out welcome-entry auth coverage and signed-in root smoke coverage.
- `WelcomeWindow-startup/WelcomeScreen.tsx` is a leftover visual reference and is not part of the active root auth flow.
- `budgetbitch/` is a separate nested prototype/reference subtree and is excluded from the root TypeScript project.

## Where to start by task

- **UI route change:** start in `src/app/**`, then check `src/components/**`
- **Business rule change:** start in `src/modules/**`
- **API behavior change:** start in `src/app/api/**`, then follow calls into `src/modules/**`
- **Schema or migration change:** start in `prisma/schema.prisma`
- **Auth gate change:** start in `src/app/page.tsx`, `src/components/welcome/**`, `src/app/sign-in/**`, `src/app/sign-up/**`, `src/app/(app)/auth/continue/**`, then check `src/components/auth/**`, `src/modules/auth/**`, `src/lib/auth/**`, and `middleware.ts`
- **Startup questionnaire change:** start in `src/app/page.tsx` and `src/components/launch/**`, then check `src/modules/launch/**` and the root-entry tests.
- **Integration wizard change:** start in `src/app/(app)/settings/integrations/**` and `src/components/integrations/**`
- **Start Smart onboarding change:** start in `src/app/(app)/start-smart/**`, then check `src/components/start-smart/**` and `src/modules/start-smart/**`
- **Learn! lesson or recommendation change:** start in `src/app/(app)/learn/**`, then check `src/components/learn/**` and `src/modules/learn/**`
- **Jobs listing or fit change:** start in `src/app/(app)/jobs/**`, then check `src/components/jobs/**` and `src/modules/jobs/**`
- **Regression verification:** use `src/**/*.test.ts[x]` and `tests/e2e/*.spec.ts`
