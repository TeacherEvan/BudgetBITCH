# Codebase Index

Navigation cheat sheet for the active root application (Budget Boss).

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
    A --> I[src/modules]

    B --> B1[page.tsx\nauth-first root gate]
    B --> B2[(app)/dashboard\nprotected dashboard entry]
    B --> B3[settings/page.tsx\nSettings page]

    C --> C1[auth/]
    C --> C2[dashboard/]
    C --> C3[wizard/]
    C --> C4[layout/]
    C --> C5[mobile/]
    C --> C6[onboarding/]
    C --> C7[pwa/]
    C --> C8[ui/]
    C --> C9[welcome/]
    C --> C10[receipt/]
    C --> C11[accounts/]
    C --> C12[launch/]
    C --> C13[legal/]
    C --> C14[shared-board/]
    C --> C15[start-smart/]
    C --> C16[providers/]
    C --> C17[sms/]
    C --> C18[settings/]

    D --> D1[auth/]
    D --> D2[convex/]
    D --> D3[db/]
    D --> D4[receipt/]
    D --> D5[news/]
    D --> D6[sms-parser/]
    D --> D7[utils/]
```

## 0.1 Practical filesystem tree

```text
.
├── README.md
├── ARCHITECTURE.md
├── AGENTS.md / CLAUDE.md
├── docs/
│   ├── README.md
│   ├── CI_CD.md
│   ├── CODEBASE_INDEX.md
│   └── FEATURE_IDEAS.md
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── (app)/
│   │   │   ├── dashboard/{page.tsx,dashboard-client.tsx}
│   │   │   └── wizard/{page.tsx,wizard-client.tsx}
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── join/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── quick-add/page.tsx
│   │   ├── sms-confirm/page.tsx
│   │   ├── security/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── cookie-policy/page.tsx
│   │   ├── share-target/route.ts
│   │   └── api/
│   │       ├── news/route.ts
│   │       ├── news/vicinity/route.ts
│   │       ├── legal/record-agreement/route.ts
│   │       ├── legal/record-cookie-consent/route.ts
│   │       └── auth/[...nextauth]/route.ts   # unwired NextAuth scaffold
│   ├── components/        # see §3
│   ├── hooks/             # see §4
│   ├── lib/               # see §5
│   ├── i18n/
│   │   ├── locales/{en,es,fr,de,pt,zh}.ts
│   │   ├── messages.ts
│   │   ├── request.ts
│   │   └── server.ts
│   ├── modules/
│   │   ├── budgeting/
│   │   └── home-base/
│   ├── test/
│   └── types/
├── convex/                # see §6
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   └── integration/
├── scripts/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── tesseract/
```

## 1. High-value entry points

| Area | File / Folder | Why it matters |
| --- | --- | --- |
| App shell | `src/app/layout.tsx` | Global layout, providers, PWA registration |
| Root auth gate | `src/app/page.tsx` | Auth-first gate: welcome, wizard, or board |
| Client auth guard | `src/lib/auth/route-guard.ts` | Protected-surface handling for `/dashboard`, `/accounts`, `/settings`, `/wizard`, `/api/v1/auth/bootstrap` |
| Auth route map | `src/lib/auth/routes.ts` | Auth route constants + protected-path prefixes. `AUTH_ROUTES.continue = "/auth/continue"` has no page behind it |
| Root config | `next.config.ts` | Next.js runtime config |
| Data model | `convex/schema.ts` | Canonical Convex schema (14 tables + `authTables`) |
| Local data model | `src/lib/db/local-db.ts` | IndexedDB stores, migrations, integrity |
| Dashboard | `src/components/dashboard/dashboard-shell.tsx` | Panels, sidebar, modals, view modes |
| Receipt engine | `convex/lib/receipt/engine.ts` | Deterministic scraper shared by client + server |

## 2. Route map

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Auth-first gate for welcome, wizard, or board |
| `/sign-in` | `src/app/sign-in/page.tsx` | Convex Auth sign-in (email/password) |
| `/sign-up` | `src/app/sign-up/page.tsx` | Convex Auth sign-up (email/password) |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Password reset request |
| `/reset` | `src/app/reset/page.tsx` | Password reset completion (token from email) |
| `/join` | `src/app/join/page.tsx` | Join a shared board via invite link/QR |
| `/accounts` | `src/app/accounts/page.tsx` | Multi-board shared budgeting (boards, umbrellas, invites) |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | Protected dashboard (post-auth landing) |
| `/wizard` | `src/app/(app)/wizard/page.tsx` | Protected 10-step launch wizard |
| `/settings` | `src/app/settings/page.tsx` | Settings (theme, currency, sync, data, admin) |
| `/quick-add` | `src/app/quick-add/page.tsx` | Standalone PWA widget: Camera (photo → HF bot TeacherBOY → Gemini → Convex → editable review; no LINE ID) + Inbox + Income; no manual amount; Repeat Purchase "+" |
| `/sms-confirm` | `src/app/sms-confirm/page.tsx` | Confirm a parsed bank SMS into a transaction |
| `/security` | `src/app/security/page.tsx` | Security disclosure page |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy |
| `/terms` | `src/app/terms/page.tsx` | Terms of service |
| `/cookie-policy` | `src/app/cookie-policy/page.tsx` | Cookie policy |
| `/share-target` | `src/app/share-target/route.ts` | PWA Web Share Target (POST → 303 → `/sms-confirm`) |
| `/api/news` | `src/app/api/news/route.ts` | Market Watch RSS feed |
| `/api/news/vicinity` | `src/app/api/news/vicinity/route.ts` | Location-gated vicinity feeds |
| `/api/legal/record-agreement` | `src/app/api/legal/record-agreement/route.ts` | Records a signed legal agreement |
| `/api/legal/record-cookie-consent` | `src/app/api/legal/record-cookie-consent/route.ts` | Records a cookie-consent choice |
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | Unwired NextAuth Google scaffold (`src/auth.ts`) — not the shipped auth path |

## 3. Component index

### Dashboard

| File / Folder | Purpose |
| --- | --- |
| `dashboard/dashboard-shell.tsx` | Main layout: panels, sidebar, modals, view modes |
| `dashboard/daily-disposable-hero.tsx` | Daily disposable income hero |
| `dashboard/alerts-sidebar.tsx` | Alerts sidebar |
| `dashboard/priority-guide.tsx` | Priority-alert strip with session-scoped dismissal |
| `dashboard/bento-grid.tsx` | Responsive bento grid layout |
| `dashboard/mobile-panel-tabs.tsx` | Mobile panel tab switcher |
| `dashboard/panelConfig.ts` | Panel registry/config |
| `dashboard/critical-expenses-modal.tsx` | Critical-expense cut-one flow |
| `dashboard/scenario-sandbox-modal.tsx` | What-If scenario sandbox (goal seek) |
| `dashboard/add-income-modal.tsx` | Add-income entry modal |
| `dashboard/budget-variance-grid.tsx` | Budget vs actual variance grid |
| `dashboard/cash-flow-projection-card.tsx` | Cash-flow projection card |
| `dashboard/category-pivot-card.tsx` | Category pivot breakdown |
| `dashboard/currency-converter-card.tsx` | Currency converter |
| `dashboard/animated-feed-list.tsx`, `feed-card.tsx` | Vicinity-aware animated feeds |
| `dashboard/panels/` | bills, budget-alerts, budget-ring, budget-visual, cash-flow-forecast, debt-payoff, emergency-fund, empty-state, expense-tracker, import-csv-modal, income-inflow-panel, net-worth (+ section/header/form/items/types/skeleton), purchase-note-modal, savings-goals, subscriptions |

### Wizard

| File | Purpose |
| --- | --- |
| `wizard/wizard-shell.tsx` | 10-step shell (income → rent → phone/internet → healthcare → transport → entertainment → subscriptions → savings rate → risk tolerance → location consent) |
| `wizard/wizard-progress.tsx` | Progress indicator |
| `wizard/steps/` | Step components, incl. `step-receipt-scan.tsx` (built, not currently in `STEPS`) |

### Accounts, shared board & SMS

| File | Purpose |
| --- | --- |
| `accounts/accounts-view.tsx` | Accounts overview (boards, umbrellas, invites) |
| `accounts/account-switcher.tsx` | Board/account switcher |
| `accounts/account-sync-mount.tsx` | Mounts automatic cross-account sync |
| `shared-board/shared-board-sync.tsx` | Shared couple-board keyed-merge sync UI |
| `sms/sms-confirm.tsx` | Confirm a shared bank SMS into a transaction |

### Auth, launch & welcome

| File | Purpose |
| --- | --- |
| `auth/clean-auth-card.tsx` | Sign-in / sign-up card (Convex Auth) |
| `auth/convex-password-auth-form.tsx` | Email/password form |
| `auth/forgot-password-form.tsx`, `reset-password-form.tsx` | Recovery flow |
| `auth/auth-account-recovery-button.tsx` | Account recovery entry |
| `auth/require-auth.tsx` | Client-side protected-surface wrapper |
| `auth/auth-entry-panel.tsx` | Auth page shell/side panel |
| `launch/golden-splash.tsx` | Brand splash overlay on the root gate |
| `launch/manifesto-interstitial.tsx`, `manifesto-notification.tsx` | Manifesto surfaces |
| `welcome/welcome-window.tsx` | Welcome window for signed-out visitors |
| `onboarding/language-select-modal.tsx` | First-launch language prompt (6 locales) |

### Settings, admin, receipts & misc

| File | Purpose |
| --- | --- |
| `settings/account-settings-card.tsx` | Account settings |
| `settings/preference-settings-card.tsx` | Theme/currency/display preferences |
| `settings/data-backup-card.tsx`, `decrypt-import-modal.tsx` | Encrypted export/import |
| `settings/partner-sharing-card.tsx` | Partner/board sharing controls |
| `settings/change-password-modal.tsx` | Password change |
| `settings/storage-diagnostics-modal.tsx` | Quota, integrity scan, checkpoints |
| `admin/admin-bug-reports.tsx` | Admin bug-report review (action-log history) |
| `bug-report/bug-report-modal.tsx` | Bug report with last 20 actions |
| `receipt/receipt-verify-sheet.tsx` | Receipt scan verification sheet |
| `pro-tips/pro-tips-card.tsx`, `pro-tips-modal.tsx` | Pro tips |
| `privacy/weekly-disclaimer.tsx` | Recurring privacy disclosure |
| `webview/webview-banner.tsx` | In-app webview notice |
| `legal/cookie-consent-banner.tsx`, `site-footer.tsx`, `legal-page.tsx` | Legal surfaces |
| `layout/header-bar.tsx` | Persistent header bar |
| `mobile/mobile-panel-frame.tsx`, `fixed-screen-shell.tsx` | Mobile framing |
| `providers/convex-client-provider.tsx`, `theme-provider.tsx` | App providers |
| `pwa/pwa-register.tsx`, `install-prompt.tsx` | Service worker + install |
| `start-smart/panels/home-base-panel.tsx` | Money Survival Blueprint home base |

### UI primitives

`ui/`: `accordion`, `button`, `card`, `confetti`, `error-boundary`, `input`,
`modal`, `money-sync-loading`, `progress-ring`, `select`, `slider`,
`sync-status-indicator`, `theme-toggle`, `toggle`.

## 4. Hooks index

| File | Purpose |
| --- | --- |
| `use-local-db.ts` | IndexedDB wrapper for local-first data |
| `use-budgets.ts` / `use-expenses.ts` | Budget and expense state |
| `use-critical-expense.ts` | Critical expense tracking |
| `use-accounts.ts` / `use-account-sync.ts` | Accounts state + cross-account sync |
| `use-shared-board.ts` | Shared couple-board sync state |
| `use-currency.ts` / `use-currency-override.ts` | Location-driven currency + manual override |
| `use-resolved-location.ts` | Resolved location for currency/feeds |
| `use-display-prefs.ts` / `use-display-detection.ts` / `use-shimmer-pref.ts` | Display prefs (graph type, accent: gold/amber/emerald), device detection, motion prefs |
| `use-news-prefs.ts` / `use-vicinity-feeds.ts` | Market Watch prefs and vicinity feeds |
| `use-receipt-scan.ts` | Receipt capture + OCR orchestration |
| `use-purchase-notes.ts` | Purchase notes |
| `use-haptic.ts` / `use-shake.ts` | Haptics and shake gesture |

## 5. Library index

| Area | Files |
| --- | --- |
| Auth | `auth/routes.ts`, `route-guard.ts`, `session.ts`, `session-claims.ts`, `e2e-auth-override.ts` |
| Convex | `convex/http-client.ts`, `convex/sync-snapshots.ts` |
| IndexedDB | `db/local-db.ts`, `db/stores/*`, `db/crypto-backup.ts`, `db/backup-schema.ts`, `db/current-member.ts` |
| Receipts | `receipt/ocr-worker.ts`, `receipt/preprocess.ts`, `receipt/engine-client.ts` |
| SMS | `sms-parser/index.ts`, `detect.ts`, `patterns/{eu,sg,us,generic}.ts` |
| News | `news/rss-fetcher.ts`, `news/vicinity-registry.ts`, `news/vicinity-resolver.ts` |
| Legal | `legal/versions.ts`, `legal/content.ts` |
| Notifications | `notifications/notification-prefs.ts` |
| HTTP | `http/client-ip.ts`, `url.ts`, `webview.ts` |
| Utils | `utils/action-logger.ts`, `budget-alerts.ts`, `budget-calculator.ts`, `cn.ts`, `compound-calculator.ts`, `currency.ts`, `date.ts` |
| Types | `types/budget.ts`, `types/accounts.ts` |
| Domain modules | `modules/budgeting/{csv-import,csv-export,daily-cash-snapshot,subscription-trim-hints}.ts`, `modules/home-base/{home-base-store,home-base-schema,location-permission,reverse-geocode-label}.ts` |

## 6. Convex backend

| File | Purpose |
| --- | --- |
| `auth.ts` / `auth.config.ts` | Convex Auth (Password provider + Resend email) |
| `http.ts` | HTTP router (auth routes) |
| `schema.ts` | Canonical schema (see below) |
| `snapshots.ts` | `upsertDailySnapshot` mutation (daily backup from SW) |
| `accounts/` | `accountCrud`, `accountInvites`, `accountBoardSync`, `purchaseNotes`, helpers, types |
| `boardMerge.ts` | Keyed-merge for shared boards |
| `sharedBoards.ts` | Couple-board queries/mutations |
| `receipts.ts` | `parseReceipt` action (Gemini 2.5 Flash), scrape/answer/confirm, offline draft sync, template snapshot |
| `lib/receipt/` | Shared scraper engine: normalise, amounts, dates, extract_merchant/total/details, validate, confidence, learning, fingerprint, metrics, questions, templates |
| `push.ts` / `pushSend.ts` | Web Push subscriptions + VAPID sender (`"use node"`) |
| `feedback.ts` | Bug reports / feedback sink + admin email |
| `legal.ts` | Legal agreement + cookie consent recording |
| `lib/auth.ts` | Auth helpers (`requireIdentity`, `getAuthUserId`) |

### Database schema

- **authTables** — provided by `@convex-dev/auth` (users, sessions, etc.)
- **userProfiles** — per-user launch profile, share code, linked/joined boards
- **sharedBoards** — two-member shared couple boards
- **accounts** — budgeting accounts (umbrella, name, inviteCode, owner, boardId)
- **boardMembers** — board membership (boardId, userId, role)
- **accountBoards** — shared multi-board state (up to 5 boards, 7 umbrellas)
- **invites** — board/account invites (pending/accepted/declined, token)
- **dailySnapshots** — daily financial snapshots with wizard profile and totals
- **legalAgreements** — signed legal-agreement records
- **cookieConsents** — cookie-consent audit trail
- **pushSubscriptions** — Web Push (VAPID) subscriptions
- **feedbackReports** — bug reports with the reporter's last 20 action logs
- **receipts** — parsed receipts (amount, merchant, category, date, raw response, image metadata)
- **receiptTemplates** — learned per-merchant parse templates
- **merchantAliases** — merchant name normalization aliases

## 7. Testing map

### Unit / component tests

- Colocated beside the code they exercise (`*.test.ts` / `*.test.tsx`), ~126 files
  across `src/**` and `convex/**`.
- Run with `npm test` (app) and `npm run test:convex` (Convex, `convex-test`).

Useful anchors:

- `src/app/page.test.tsx`
- `src/components/welcome/welcome-window.test.tsx`
- `src/components/dashboard/dashboard-shell.test.tsx`
- `src/components/wizard/wizard-shell.test.tsx`
- `src/lib/db/local-db.test.tsx`
- `src/lib/auth/route-guard.test.ts`
- `convex/lib/receipt/engine.test.ts`

### E2E tests

25 spec files under `tests/e2e/` share `helpers.ts` (real sign-in via
`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`, consent dismissal, error collector).

| File | Coverage |
| --- | --- |
| `dogfood.spec.ts` | Signed-in root gate path (auth-first entry) |
| `auth.spec.ts`, `auth-entry.spec.ts`, `account-deletion.spec.ts` | Sign-in/sign-up, route guards, deletion |
| `wizard.spec.ts`, `launch-onboarding.spec.ts` | Onboarding, splash, manifesto, locale select |
| `dashboard.spec.ts` | Shell render, view modes, sidebar panels, What-If sandbox |
| `settings.spec.ts`, `diagnostics.spec.ts` | Settings surfaces, storage diagnostics & recovery |
| `market-watch.spec.ts` | Location-gated vicinity feeds |
| `accounts.spec.ts`, `shared-board.spec.ts`, `join.spec.ts` | Multi-account boards, couple sync, invites |
| `pwa-offline.spec.ts`, `pwa-webview.spec.ts`, `share-target.spec.ts`, `sms-confirm.spec.ts` | PWA offline/webview, share target, SMS confirm |
| `quick-add-manual.spec.ts`, `pro-tips.spec.ts`, `start-smart.spec.ts`, `mobile.spec.ts` | Quick add, pro tips, Start Smart, mobile layout |
| `i18n.spec.ts`, `security.spec.ts`, `route-smoke.spec.ts`, `legal-pages.spec.ts` | Localization, headers/CSP, route smoke, legal |

## 8. Non-primary subtree note

| Path | Status |
| --- | --- |
| `WelcomeWindow-startup/` | Legacy visual reference folder; not part of the active flow |
| `src/auth.ts`, `src/app/api/auth/[...nextauth]/` | Unwired NextAuth Google scaffold; shipped auth is Convex Auth |

## 9. Navigation recipes

### Change auth entry or the root gate

1. `src/app/page.tsx`
2. `src/components/welcome/**`, `src/app/sign-in/**`, `src/app/sign-up/**`,
   `src/app/(app)/dashboard/**`, `src/app/(app)/wizard/**`
3. `src/lib/auth/routes.ts`, `src/lib/auth/route-guard.ts`
4. Re-run route tests plus `tests/e2e/dogfood.spec.ts`

### Change dashboard UI or data behavior

1. `src/components/dashboard/dashboard-shell.tsx`
2. Panels in `src/components/dashboard/panels/` + `panelConfig.ts`
3. `src/hooks/use-local-db.ts` for local data access
4. Re-run dashboard component tests and `tests/e2e/dashboard.spec.ts`

### Change the onboarding wizard

1. `src/components/wizard/wizard-shell.tsx` (`STEPS` array + `renderStep`)
2. Step components in `src/components/wizard/steps/`
3. Re-run `wizard-shell.test.tsx` and `tests/e2e/wizard.spec.ts`

### Change receipt parsing

1. `convex/lib/receipt/**` (shared deterministic engine + its colocated tests)
2. `convex/receipts.ts` for the Gemini action and mutations
3. `src/lib/receipt/**` and `src/hooks/use-receipt-scan.ts` for the client path

### Change Convex backend

1. `convex/schema.ts` for schema changes
2. The relevant function file (`snapshots.ts`, `accounts/`, `receipts.ts`, …)
3. `convex/http.ts` for HTTP endpoints
4. `npx convex dev` to push; `npm run test:convex` to verify

### Change database shape (IndexedDB)

1. `src/lib/db/local-db.ts` (add the store to `USER_DATA_STORES` **and**
   `createObjectStore` in `upgrade()`)
2. Update related hooks/stores under `src/lib/db/stores/` and `src/hooks/`
3. Run `npm run check:idb` and the related tests

## 10. CI/CD & automation infrastructure

| Directory / File | Purpose |
| --- | --- |
| `.github/workflows/ci.yml` | Main pipeline: `lint`, `typecheck`, `test`, `convex-test`, `build`, `e2e`, `deploy-guard`, `security-audit`, `idb-schema-guard` |
| `.github/workflows/release-draft.yml` | Tag-triggered (`v*`) release notes + GitHub release draft |
| `.github/workflows/rollback.yml` | Manual Vercel production rollback (`npx vercel rollback`) |
| `.github/workflows/update-dependencies.yml` | Scheduled dependency upgrade + audit PR |
| `.github/dependabot.yml` | Daily `npm` + `github-actions` dependency scanning |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR quality gate checklist and risk assessment |
| `scripts/run-full-ci.mjs` | Local unified quality gate runner (`npm run ci`) |
| `scripts/check-idb-stores.mjs` | IndexedDB schema guard |
| `scripts/check-convex-imports.mjs` | Convex import resolution guard |
| `scripts/check-convex-deployment.mjs` | Vercel prebuild guard on `NEXT_PUBLIC_CONVEX_URL` |
| `scripts/copy-tesseract-assets.mjs` | Copies tesseract.js assets into `public/` (postinstall) |
| `scripts/rotate-vapid.ts` | Generates/rotates Web Push VAPID keys |
| `scripts/run-with-sanitized-env.mjs` | Env sanitizer wrapper for dev/build/start |
| `docs/CI_CD.md` | Operational handbook for CI/CD, guards, and rollbacks |
