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

  B --> B1[page.tsx\nwelcome + landing flow]
  B --> B2[(app)/dashboard]
  B --> B3[(app)/settings/integrations]
  B --> B4[api/v1]

  B4 --> B41[budgets/health/route.ts]
  B4 --> B42[integrations/connect/route.ts]
  B4 --> B43[integrations/revoke/route.ts]

  C --> C1[audit]
  C --> C2[automation]
  C --> C3[budgets]
  C --> C4[calendar]
  C --> C5[email]
  C --> C6[integrations]
  C --> C7[jobs]
  C --> C8[notifications]
  C --> C9[privacy]
  C --> C10[workspaces]

  D --> D1[integrations UI primitives]
  E --> E1[schema.prisma]
  E --> E2[migrations]
  F --> F1[dashboard + wizard journeys]
  G --> G1[route-guard]
  H --> H1[Inngest client]
```

## Practical filesystem tree

```text
.
├── README.md
├── docs/
│   ├── CODEBASE_INDEX.md
│   └── DEV_TREE.md
├── middleware.ts
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
│   │   ├── (app)/
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
│   │           ├── budgets/health/route.ts
│   │           └── integrations/
│   │               ├── connect/route.ts
│   │               └── revoke/route.ts
│   ├── components/
│   │   └── integrations/
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
- `tests/e2e/**` contains Playwright journey coverage.
- `WelcomeWindow-startup/WelcomeScreen.tsx` is used by `src/app/page.tsx`, but the folder is excluded from root TypeScript compilation.
- `budgetbitch/` is a separate nested prototype/reference subtree and is excluded from the root TypeScript project.

## Where to start by task

- **UI route change:** start in `src/app/**`, then check `src/components/**`
- **Business rule change:** start in `src/modules/**`
- **API behavior change:** start in `src/app/api/**`, then follow calls into `src/modules/**`
- **Schema or migration change:** start in `prisma/schema.prisma`
- **Auth gate change:** start in `middleware.ts` and `src/lib/auth/route-guard.ts`
- **Integration wizard change:** start in `src/app/(app)/settings/integrations/**` and `src/components/integrations/**`
- **Regression verification:** use `src/**/*.test.ts[x]` and `tests/e2e/*.spec.ts`
