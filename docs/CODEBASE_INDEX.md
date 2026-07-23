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
    B --> B2[(app)/dashboard\nprotected dashboard entry]
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
    C --> C11[accounts/]
    C --> C12[launch/]
    C --> C13[legal/]
    C --> C14[shared-board/]
    C --> C15[start-smart/]
    C --> C16[providers/]

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
│   │   │   ├── dashboard/page.tsx
│   │   │   └── wizard/page.tsx
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset/page.tsx
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── accounts/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── i18n/
│   │   ├── layout/
│   │   ├── launch/
│   │   ├── legal/
│   │   ├── mobile/
│   │   ├── onboarding/
│   │   ├── pwa/
│   │   ├── providers/
│   │   ├── shared-board/
│   │   ├── start-smart/
│   │   ├── ui/
│   │   ├── welcome/
│   │   └── wizard/
│   ├── hooks/
│   ├── lib/
│   │   ├── auth/
│   │   ├── convex/
│   │   ├── db/
│   │   ├── http/
│   │   ├── legal/
│   │   ├── news/
│   │   ├── types/
│   │   └── utils/
│   ├── i18n/
│   ├── modules/
│   │   ├── budgeting/
│   │   └── home-base/
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
```

## 1. High-value entry points

| Area             | File / Folder                      | Why it matters                                                                   |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| App shell        | `src/app/layout.tsx`               | Global layout and top-level app wrapper                                          |
| Root auth gate   | `src/app/page.tsx`                | Auth-first root gate for welcome, launch wizard, or landing board                |
| Auth bootstrap   | `src/lib/auth/routes.ts` (`continue`) | `routes.ts` defines `AUTH_ROUTES.continue = "/auth/continue"`, but no page implementation exists yet; post-auth users land on `/dashboard` |
| Route protection | `src/middleware.ts`                | Protected-surface handling for `/dashboard`, `/settings`, `/wizard`, and protected `/api/v1/auth/bootstrap` routes |
| Auth route map   | `src/lib/auth/routes.ts`           | Centralized auth route constants and protected-path prefix rules                 |
| Root config      | `next.config.ts`                   | Next.js runtime config, including dev origin allowance                           |
| Data model       | `convex/schema.ts`                 | Canonical schema for `dailySnapshots` + `authTables`                             |
| Dashboard data   | `src/components/dashboard/dashboard-shell.tsx` | Dashboard shell with panels, alerts sidebar, critical expenses modal           |

## 2. Route map

### App routes

| Route                        | File                                                      | Purpose                                                     |
| ---------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `/`                          | `src/app/page.tsx`                                        | Auth-first gate for welcome, wizard, or landing board       |
| `/sign-in`                   | `src/app/sign-in/page.tsx`                               | Convex Auth sign-in entry (email/password)                  |
| `/sign-up`                   | `src/app/sign-up/page.tsx`                               | Convex Auth sign-up entry (email/password)                  |
| `/forgot-password`           | `src/app/forgot-password/page.tsx`                       | Password reset request entry                                |
| `/reset`                     | `src/app/reset/page.tsx`                                 | Password reset completion (token from email)                |
| `/join`                      | `src/app/join/page.tsx`                                  | Join a shared board via invite link/QR                      |
| `/accounts`                  | `src/app/accounts/page.tsx`                              | Accounts — multi-board shared budgeting (boards, umbrellas, invites) |
| `/dashboard`                 | `src/app/(app)/dashboard/page.tsx`                       | Protected dashboard (post-auth landing target)              |
| `/wizard`                    | `src/app/(app)/wizard/page.tsx`                          | Protected launch wizard                                     |
| `/settings`                  | `src/app/settings/page.tsx`                             | Settings page (theme, sync status, Market Watch toggle)     |
| `/privacy`                   | `src/app/privacy/page.tsx`                              | Privacy policy page                                          |
| `/terms`                     | `src/app/terms/page.tsx`                                | Terms of service page                                       |
| `/cookie-policy`             | `src/app/cookie-policy/page.tsx`                        | Cookie policy page                                          |
| `/settings/integrations`     | Not yet implemented                                       | Provider connection hub (planned)                           |
| `/api/news`                  | `src/app/api/news/route.ts`                             | Market Watch RSS feed (localized finance news)              |
| `/api/legal/record-agreement` | `src/app/api/legal/record-agreement/route.ts`          | Records a signed legal-agreement (TOS/privacy/cookie)       |
| `/api/legal/record-cookie-consent` | `src/app/api/legal/record-cookie-consent/route.ts`  | Records a cookie-consent choice (server-recorded audit trail) |

## 3. Component index

### Dashboard components

| File / Folder                                            | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/dashboard/dashboard-shell.tsx`           | Main dashboard layout with panels, sidebar, modal    |
| `src/components/dashboard/daily-disposable-hero.tsx`     | Daily disposable income hero panel                   |
| `src/components/dashboard/alerts-sidebar.tsx`            | Alerts sidebar                                       |
| `src/components/dashboard/critical-expenses-modal.tsx`   | Critical expenses modal                              |
| `src/components/dashboard/bento-grid.tsx`             | Responsive bento grid layout for panels              |
| `src/components/dashboard/mobile-panel-tabs.tsx`         | Mobile panel tab switcher                            |
| `src/components/dashboard/priority-guide.tsx`            | Priority-alert strip (critical/warning/info tiers) with session-scoped dismissal |
| `src/components/dashboard/panels/`                       | Panel set: bills, budget-visual, budget-alerts, cash-flow-forecast, debt-payoff, savings-goals, expense-tracker, voice-expense-input, subscriptions, net-worth (+ section/header/form/items), emergency-fund, empty-state |

### Launch components

| File / Folder                                       | Purpose                                                        |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `src/components/launch/golden-splash.tsx`           | Brand splash overlay on the auth-first root gate (`src/app/page.tsx`) |
| `src/components/launch/manifesto-notification.tsx`  | Manifesto notification card rendered on the dashboard shell   |
| `src/components/launch/manifesto-interstitial.tsx`   | Manifesto interstitial gate shown before auth                 |

### Wizard components

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/wizard/wizard-shell.tsx`                 | Wizard shell with progress, voice toggle, steps      |
| `src/components/wizard/*`                                | Individual wizard step components                    |

### Accounts & shared-board components

| File / Folder                                       | Purpose                                                        |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `src/components/accounts/accounts-view.tsx`         | Accounts overview (boards, umbrellas, invites)                 |
| `src/components/accounts/account-switcher.tsx`      | Board/account switcher                                         |
| `src/components/accounts/account-sync-mount.tsx`    | Mounts automatic cross-account sync                            |
| `src/components/shared-board/shared-board-sync.tsx` | Shared couple-board keyed-merge sync UI                        |

### Welcome components

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/components/welcome/welcome-window.tsx`              | Welcome window for signed-out visitors               |

### Legal & layout components

| File / Folder                       | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| `src/components/legal/cookie-consent-banner.tsx` | Cookie consent banner                          |
| `src/components/legal/site-footer.tsx`           | Site footer (legal links)                      |
| `src/components/legal/legal-page.tsx`           | Reusable legal-page renderer                      |
| `src/components/layout/header-bar.tsx`          | Persistent header bar (nav, globe, wrench)       |

### Start Smart components

| File / Folder                       | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| `src/components/start-smart/panels/home-base-panel.tsx` | Money Survival Blueprint home-base panel   |

### Shared board & providers

| File / Folder                       | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| `src/components/providers/`         | App-level React context providers                    |

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
| `src/components/ui/toggle.tsx`       | Toggle primitive                                     |
| `src/components/ui/theme-toggle.tsx` | Theme toggle primitive                               |
| `src/components/ui/confetti.tsx`     | Confetti effect primitive                            |

## 4. Hooks index

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/hooks/use-local-db.ts` | IndexedDB wrapper for local-first data |
| `src/hooks/use-critical-expense.ts` | Critical expense tracking hook       |
| `src/hooks/use-voice.ts` | Voice input/output hook              |
| `src/hooks/use-accounts.ts` | Accounts (boards/umbrellas) state    |
| `src/hooks/use-account-sync.ts` | Automatic cross-account sync hook    |
| `src/hooks/use-currency.ts` | Location-driven currency formatting  |
| `src/hooks/use-display-prefs.ts` | Display preferences (theme, numerals) |
| `src/hooks/use-haptic.ts` | Haptic feedback (mobile)             |
| `src/hooks/use-news-prefs.ts` | Market Watch news preferences        |
| `src/hooks/use-shared-board.ts` | Shared couple-board sync state       |

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

### HTTP

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/lib/http/client-ip.ts` | Client IP / geolocation resolution (used for location-driven currency) |

### Database (IndexedDB)

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/lib/db/local-db.ts`  | IndexedDB wrapper for local-first data |

### Legal

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/lib/legal/versions.ts` | Legal document version registry    |
| `src/lib/legal/content.ts`   | Legal page content (TOS/privacy/cookie) |

### News (Market Watch)

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `src/lib/news/rss-fetcher.ts` | RSS fetcher for localized finance news |

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
- **userProfiles** — Per-user launch profile, share code, linked/joined boards
- **sharedBoards** — Two-member shared couple boards (memberA/memberB, board data, updatedAt/By)
- **accounts** — Budgeting accounts (umbrella, name, inviteCode, owner, optional boardId)
- **boardMembers** — Board membership (boardId, userId, role owner/member)
- **accountBoards** — Shared multi-board state (up to 5 boards, 7 umbrellas, members, data)
- **invites** — Board/account invites (pending/accepted/declined, token)
- **dailySnapshots** — User daily financial snapshots with wizard profile, totals, critical expense commitment
- **legalAgreements** — Signed legal-agreement records (TOS/privacy/cookie)
- **cookieConsents** — Cookie-consent choices (server-recorded audit trail)

## 7. Testing map

### Unit / component tests

- Located beside the code they exercise under `src/**`
- Pattern: `*.test.ts` or `*.test.tsx`

Useful anchors (representative files that exist):

- `src/app/page.test.tsx`
- `src/middleware.test.ts`
- `src/components/welcome/welcome-window.test.tsx`
- `src/components/dashboard/dashboard-shell.test.tsx`
- `src/components/dashboard/panels/budget-ring.test.tsx`
- `src/components/dashboard/mobile-panel-tabs.test.tsx`
- `src/components/dashboard/bento-grid.test.tsx`
- `src/lib/convex/http-client.test.ts`
- `src/lib/auth/route-guard.test.ts`
- `src/components/ui/modal.test.tsx`

### E2E tests

| File                                      | Coverage                               |
| ----------------------------------------- | -------------------------------------- |
| `tests/e2e/dogfood.spec.ts`               | Signed-in root gate path (auth-first entry) |

## 8. Non-primary subtree note

| Path                     | Status                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `WelcomeWindow-startup/` | Legacy visual reference folder; not part of the active root auth-first flow          |

## 9. Suggested navigation recipes

### I want to change auth entry or the root gate

1. Start at `src/app/page.tsx`
2. Check `src/components/welcome/**`, `src/app/sign-in/**`, `src/app/sign-up/**`, `src/app/(app)/dashboard/**`, and `src/app/(app)/wizard/**`
3. Check `src/lib/auth/routes.ts`, `src/lib/auth/route-guard.ts`, and related auth helpers
4. Re-run the related route tests plus `tests/e2e/dogfood.spec.ts`

### I want to change dashboard UI or data behavior

1. Start at `src/components/dashboard/dashboard-shell.tsx`
2. Check individual panel components in `src/components/dashboard/`
3. Check `src/hooks/use-local-db.ts` for local data access
4. Re-run dashboard component tests and `tests/e2e/dogfood.spec.ts`

### I want to change the onboarding wizard

1. Start at `src/components/wizard/wizard-shell.tsx`
2. Check individual step components in `src/components/wizard/`
3. Re-run wizard component tests

### I want to change Convex backend

1. Edit `convex/schema.ts` for schema changes
2. Edit `convex/snapshots.ts` for snapshot mutations
3. Edit `convex/http.ts` for HTTP endpoints
4. Run `npx convex dev` to push changes

### I want to change database shape (IndexedDB)

1. Edit `src/lib/db/local-db.ts`
2. Update related hooks in `src/hooks/use-local-db.ts`
3. Re-run related tests

## 10. CI/CD & Automation Infrastructure

| Directory / File | Purpose |
| :--- | :--- |
| `.github/workflows/ci.yml` | Main 9-stage quality gate pipeline (`lint`, `typecheck`, `test`, `convex-test`, `idb-schema-guard`, `deploy-guard`, `build`, `e2e`, `security-audit`) |
| `.github/workflows/release-draft.yml` | Tag-triggered (`v*`) release notes and GitHub release drafting workflow |
| `.github/workflows/rollback.yml` | Manual Vercel production deployment rollback workflow (`npx vercel rollback`) |
| `.github/workflows/update-dependencies.yml` | Weekly automated dependency upgrade and security audit workflow |
| `.github/dependabot.yml` | Dependabot configuration for weekly `npm` and `github-actions` vulnerability scanning |
| `.github/PULL_REQUEST_TEMPLATE.md` | Mandatory PR quality gate checklist and risk assessment template |
| `scripts/run-full-ci.mjs` | Local unified quality gate runner script (`npm run ci`) |
| `scripts/check-idb-stores.mjs` | IndexedDB schema guard script ensuring object stores in `USER_DATA_STORES` are created in `upgrade()` |
| `scripts/check-convex-deployment.mjs` | Vercel production prebuild guard ensuring `NEXT_PUBLIC_CONVEX_URL` matches `steady-ox-280` |
| `docs/CI_CD.md` | Master operational handbook for CI/CD, build guards, secrets, and production rollbacks |