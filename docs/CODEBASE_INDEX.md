# Codebase Index

This index is a future-navigation cheat sheet for the active root application.

## 0. Orientation graph

```mermaid
flowchart TD
    A[README.md] --> B[src/app]
    A --> C[src/components]
    A --> D[src/lib]
    A --> E[src/hooks]
    A --> F[src/i18n]
    A --> G[tests/e2e]
    A --> H[convex]

    B --> B1[page.tsx\nauth-first root gate]
    B --> B2[(app)/auth/continue\npost-auth local bootstrap boundary]
    B --> B3[settings/page.tsx\nSettings page]

    C --> C1[auth/]
    C --> C2[dashboard/]
    C --> C3[i18n/]
    C --> C4[layout/]
    C --> C5[mobile/]
    C --> C6[onboarding/]
    C --> C7[pwa/]
    C --> C8[ui/]
    C --> C9[welcome/]
    C --> C10[wizard/]

    D --> D1[auth/]
    D --> D2[convex/]
    D --> D3[db/]
    D --> D4[location/]
    D --> D5[news/]
    D --> D6[types/]
    D --> D7[utils/]
```

## 0.1 Practical filesystem tree

```text
.
├── README.md
├── docs/
│   └── CODEBASE_INDEX.md
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── (app)/
│   │   │   └── auth/continue/page.tsx
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── i18n/
│   │   ├── layout/
│   │   ├── mobile/
│   │   ├── onboarding/
│   │   ├── pwa/
│   │   ├── ui/
│   │   ├── welcome/
│   │   └── wizard/
│   ├── hooks/
│   ├── lib/
│   │   ├── auth/
│   │   ├── convex/
│   │   ├── db/
│   │   ├── location/
│   │   ├── news/
│   │   ├── types/
│   │   └── utils/
│   ├── i18n/
│   ├── middleware.ts
│   ├── test/
│   └── types/
├── convex/
│   ├── auth.config.ts
│   ├── auth.ts
│   ├── http.ts
│   ├── schema.ts
│   ├── snapshots.ts
│   └── lib/auth.ts
├── tests/
│   └── e2e/
├── public/
│   └── sw.js
└── budgetbitch/
```

## 1. High-value entry points

| Area             | File / Folder                      | Why it matters                                                                   |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| App shell        | `src/app/layout.tsx`               | Global layout and top-level app wrapper                                          |
| Root auth gate   | `src/app/page.tsx`                 | Auth-first root gate for welcome, launch wizard, or landing board                |
| Auth bootstrap   | `src/app/(app)/auth/continue/page.tsx` | Post-auth local bootstrap and safe redirect boundary                       |
| Route protection | `src/middleware.ts`                | Protected-surface handling for auth continue, dashboard, settings, and protected `/api/v1` routes |
| Auth route map   | `src/lib/auth/routes.ts`           | Centralized auth route constants and protected-path prefix rules                 |
| Root config      | `next.config.ts`                   | Next.js runtime config, including dev origin allowance                           |
| Data model       | `convex/schema.ts`                 | Canonical schema for `dailySnapshots` + `authTables`                             |
| Dashboard data   | `src/components/dashboard/dashboard-shell.tsx` | Dashboard shell with panels, alerts sidebar, critical expenses modal           |

## 2. Route map

### App routes

| Route                        | File                                                      | Purpose                                                     |
| ---------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `/`                          | `src/app/page.tsx`                                        | Auth-first gate for welcome, wizard, or landing board       |
| `/sign-in`                   | Handled by Convex Auth via `/api/convex-auth`             | Convex Auth sign-in entry                                   |
| `/sign-up`                   | Handled by Convex Auth via `/api/convex-auth`             | Convex Auth sign-up entry                                   |
| `/auth/continue`             | `src/app/(app)/auth/continue/page.tsx`                    | Post-auth bootstrap and safe post-auth redirect             |
| `/settings`                  | `src/app/settings/page.tsx`                               | Settings page (theme, sync status)                          |
| `/settings/integrations`     | Not yet implemented                                       | Provider connection hub (planned)                           |

## 3. Component index

### Dashboard components

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/dashboard/dashboard-shell.tsx`           | Main dashboard layout with panels, sidebar, modal    |
| `src/components/dashboard/daily-disposable-hero.tsx`     | Daily disposable income hero panel                   |
| `src/components/dashboard/budget-visual.tsx`             | Budget visualization panel                           |
| `src/components/dashboard/bills.tsx`                     | Bills tracking panel                                 |
| `src/components/dashboard/cash-flow-forecast.tsx`        | Cash flow forecast panel                             |
| `src/components/dashboard/debt-payoff.tsx`               | Debt payoff visualization panel                      |
| `src/components/dashboard/alerts-sidebar.tsx`            | Alerts sidebar                                       |
| `src/components/dashboard/critical-expenses-modal.tsx`   | Critical expenses modal                              |

### Wizard components

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/wizard/wizard-shell.tsx`                 | Wizard shell with progress, voice toggle, steps      |
| `src/components/wizard/*`                                | Individual wizard step components                    |

### Welcome components

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/welcome/welcome-window.tsx`              | Welcome window for signed-out visitors               |

### UI primitives

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/ui/button.tsx`                           | Button primitive                                     |
| `src/components/ui/card.tsx`                             | Card primitive                                       |
| `src/components/ui/input.tsx`                            | Input primitive                                      |
| `src/components/ui/modal.tsx`                            | Modal primitive                                      |
| `src/components/ui/accordion.tsx`                        | Accordion primitive                                  |
| `src/components/ui/progress-ring.tsx`                    | Progress ring primitive                              |
| `src/components/ui/select.tsx`                           | Select primitive                                     |
| `src/components/ui/slider.tsx`                           | Slider primitive                                     |
| `src/components/ui/toggle.tsx`                           | Toggle primitive                                     |

## 4. Hooks index

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/hooks/use-local-db.ts` | IndexedDB wrapper for local-first data |
| `src/hooks/use-critical-expense.ts` | Critical expense tracking hook       |
| `src/hooks/use-voice.ts` | Voice input/output hook              |

## 5. Library index

### Auth

| File                              | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `src/lib/auth/routes.ts`          | Centralized auth route constants and protected-path prefix rules |
| `src/lib/auth/route-guard.ts`     | Route guard utilities                      |
| `src/lib/auth/e2e-auth-override.ts` | Non-production E2E auth override           |

### Convex

| File                              | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `src/lib/convex/http-client.ts`   | Convex HTTP client for server-side calls   |
| `src/lib/convex/sync-snapshots.ts` | Snapshot sync utilities                    |

### Database (IndexedDB)

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/lib/db/local-db.ts`  | IndexedDB wrapper for local-first data |

### Utils

| File                              | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `src/lib/utils/cn.ts`             | Classnames utility                         |
| `src/lib/utils/compound-calculator.ts` | Compound interest calculator             |
| `src/lib/utils/currency.ts`       | Currency formatting utilities              |
| `src/lib/utils/thai-category-mapper.ts` | Thai category mapping                   |

## 6. Convex backend

| File                 | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `convex/auth.config.ts` | Convex Auth configuration (Password provider)      |
| `convex/auth.ts`     | Convex Auth server config                            |
| `convex/http.ts`     | HTTP router (auth routes)                            |
| `convex/schema.ts`   | Convex schema (`dailySnapshots` + `authTables`)      |
| `convex/snapshots.ts` | `upsertDailySnapshot` mutation (daily backup from SW) |
| `convex/lib/auth.ts` | Auth helpers (`requireIdentity`, `getAuthUserId`)    |

### Database schema

- **authTables** — Provided by `@convex-dev/auth` (users, sessions, etc.)
- **dailySnapshots** — User daily financial snapshots with wizard profile, totals, critical expense commitment

## 7. Testing map

### Unit / component tests

- Located beside the code they exercise under `src/**`
- Pattern: `*.test.ts` or `*.test.tsx`

Useful anchors:

- `src/app/page.test.tsx`
- `src/app/(app)/auth/continue/page.test.tsx`
- `src/components/dashboard/*.test.tsx`
- `src/components/welcome/*.test.tsx`
- `src/components/wizard/*.test.tsx`
- `src/lib/convex/*.test.ts`
- `src/lib/auth/*.test.ts`
- `src/middleware.test.ts`

### E2E tests

| File                                      | Coverage                               |
| ----------------------------------------- | -------------------------------------- |
| `tests/e2e/welcome-auth.spec.ts`          | Signed-out root entry, welcome auth links, and preserved `redirectTo` |
| `tests/e2e/smoke.spec.ts`                 | Signed-in root gate smoke for wizard-first and landing-first paths |

## 8. Non-primary subtree note

| Path                     | Status                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `budgetbitch/`           | Separate nested Convex prototype/reference app; excluded from root TypeScript project |
| `WelcomeWindow-startup/` | Legacy visual reference folder; not part of the active root auth-first flow          |

## 9. Suggested navigation recipes

### I want to change auth entry or the root gate

1. Start at `src/app/page.tsx`
2. Check `src/components/welcome/**`, `src/app/(app)/auth/continue/**`
3. Check `src/lib/auth/routes.ts`, `src/lib/auth/route-guard.ts`, and related auth helpers
4. Re-run the related route tests plus `tests/e2e/welcome-auth.spec.ts` and `tests/e2e/smoke.spec.ts`

### I want to change dashboard UI or data behavior

1. Start at `src/components/dashboard/dashboard-shell.tsx`
2. Check individual panel components in `src/components/dashboard/`
3. Check `src/hooks/use-local-db.ts` for local data access
4. Re-run dashboard component tests and `tests/e2e/smoke.spec.ts`

### I want to change the onboarding wizard

1. Start at `src/components/wizard/wizard-shell.tsx`
2. Check individual step components in `src/components/wizard/`
2. Re-run wizard component tests

### I want to change Convex backend

1. Edit `convex/schema.ts` for schema changes
2. Edit `convex/snapshots.ts` for snapshot mutations
3. Edit `convex/http.ts` for HTTP endpoints
4. Run `npx convex dev` to push changes

### I want to change database shape (IndexedDB)

1. Edit `src/lib/db/local-db.ts`
2. Update related hooks in `src/hooks/use-local-db.ts`
3. Re-run related tests