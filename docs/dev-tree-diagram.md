# BudgetBITCH Dev Tree Diagram

> **Purpose:** Quick navigation map for AI agents. Load this file to understand the codebase structure at a glance.

---

## Root Structure

```
BudgetBITCH/
├── .cache/                          # 🚫 GITIGNORED — Agent token cache, temp files
├── .github/                         # GitHub workflows, copilot instructions
├── .vercel/                         # Vercel deployment config
├── .worktrees/                      # Git worktrees
├── convex/                          # Convex backend (auth + daily snapshots ONLY)
│   ├── _generated/                  # Auto-generated (don't edit)
│   ├── schema.ts                    # 📋 Schema: authTables + dailySnapshots
│   ├── auth.config.ts               # Convex Auth configuration
│   ├── snapshots.ts                 # 📝 Mutation: upsertDailySnapshot
│   └── tsconfig.json
├── docs/                            # Documentation
│   ├── plans/                       # Design & implementation plans
│   │   ├── .archive/                 # Completed/verified plans (badged)
│   │   │   └── 2026-06-13-budgetbitch-complete-revamp-design.md
│   └── dev-tree-diagram.md          # THIS FILE
├── public/                          # Static assets
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker (workbox)
├── scripts/                         # Build scripts
├── src/                             # 🎯 MAIN SOURCE CODE
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout: Providers (ConvexAuth, next-intl, PWA, Voice)
│   │   ├── page.tsx                 # Landing → welcome gate / dashboard redirect
│   │   ├── globals.css              # Global styles: 3 themes (amber/dark/gold)
│   │   ├── sign-in/page.tsx        # Convex Auth sign-in (email/password)
│   │   ├── sign-up/page.tsx        # Convex Auth sign-up (email/password)
│   │   ├── forgot-password/page.tsx # Password reset request
│   │   ├── reset/page.tsx          # Password reset completion (token from email)
│   │   ├── (app)/
│   │   │   ├── dashboard/page.tsx   # DashboardShell (protected, post-auth landing)
│   │   │   └── wizard/page.tsx      # WizardShell (protected)
│   │   ├── components/                  # React components
│   │   │   ├── onboarding/
│   │   │   │   └── language-select-modal.tsx    # 🎯 FIRST SCREEN — Thai/English
│   │   │   ├── pwa/
│   │   │   │   └── install-prompt.tsx           # Pre-wizard PWA install
│   │   │   ├── wizard/
│   │   │   │   ├── wizard-shell.tsx              # 10-step voice-guided wizard
│   │   │   │   ├── wizard-progress.tsx           # Progress indicator
│   │   │   │   ├── voice-toggle.tsx              # Voice ON/OFF
│   │   │   │   └── steps/                        # 10 step components
│   │   │   │       ├── step-income.tsx           # Q1: Monthly income
│   │   │   │       ├── step-rent.tsx             # Q2: Rent/Mortgage
│   │   │   │       ├── step-transport.tsx        # Q3: Transport (Grab, BTS, fuel)
│   │   │   │       ├── step-phone-internet.tsx   # Q4: Phone/Internet
│   │   │   │       ├── step-subscriptions.tsx    # Q5: Subscriptions
│   │   │   │       ├── step-entertainment.tsx    # Q6: Entertainment
│   │   │   │       ├── step-healthcare.tsx       # Q7: Healthcare
│   │   │   │       ├── step-savings-rate.tsx     # Q8: Savings % (slider)
│   │   │   │       ├── step-risk-tolerance.tsx   # Q9: Low/Med/High
│   │   │   │       └── step-location-consent.tsx # Q10: Location + privacy disclaimer
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard-shell.tsx           # Main dashboard layout
│   │   │   │   ├── daily-disposable-hero.tsx     # 🎯 ONE BIG NUMBER: Daily disposable
│   │   │   │   ├── critical-expenses-modal.tsx   # 8 items + compound calculator
│   │   │   │   ├── alerts-sidebar.tsx            # Actionable RSS alerts / Market Watch (TH/EN)
│   │   │   │   ├── bento-grid.tsx                # Responsive bento grid layout
│   │   │   │   ├── mobile-panel-tabs.tsx         # Mobile panel tab switcher
│   │   │   │   ├── import-csv-modal.tsx          # CSV transaction import
│   │   │   │   └── panels/                       # Accordion panels
│   │   │   │       ├── expense-tracker.tsx       # Category tracking + budgets
│   │   │   │       ├── budget-visual.tsx         # Bar chart: Income vs Expense
│   │   │   │       ├── budget-alerts.tsx         # Budget alert generation
│   │   │   │       ├── budget-ring.tsx           # Savings-rate progress ring
│   │   │   │       ├── bills.tsx                 # Due-soon + Thai holidays
│   │   │   │       ├── savings-goals.tsx         # Progress rings
│   │   │   │       ├── net-worth.tsx             # Assets - Liabilities (+ section/header/form/items/types/skeleton)
│   │   │   │       ├── subscriptions.tsx         # Detected recurring (TrueWallet, GrabPay) (+ skeleton)
│   │   │   │       ├── emergency-fund.tsx        # Target + progress (+ skeleton)
│   │   │   │       ├── debt-payoff.tsx           # Avalanche/Snowball
│   │   │   │       ├── cash-flow-forecast.tsx    # 30/60/90 day projection
│   │   │   │       ├── voice-expense-input.tsx   # Voice-driven expense entry
│   │   │   │       └── empty-state.tsx           # Empty panel fallback
│   │   │   ├── accounts/                        # Multi-board shared budgeting + cross-account sync
│   │   │   │   ├── accounts-view.tsx
│   │   │   │   ├── account-switcher.tsx
│   │   │   │   └── account-sync-mount.tsx
│   │   │   ├── shared-board/                    # Shared couple-board UI (keyed-merge sync)
│   │   │   │   └── shared-board-sync.tsx
│   │   │   ├── launch/                          # Cinematic splash, manifesto interstitial/notification
│   │   │   │   ├── golden-splash.tsx
│   │   │   │   ├── manifesto-interstitial.tsx
│   │   │   │   └── manifesto-notification.tsx
│   │   │   ├── layout/                          # Header bar (nav, globe, wrench)
│   │   │   │   └── header-bar.tsx
│   │   │   ├── legal/                           # Cookie consent, site footer, legal pages
│   │   │   │   ├── cookie-consent-banner.tsx
│   │   │   │   ├── site-footer.tsx
│   │   │   │   └── legal-page.tsx
│   │   │   ├── mobile/                          # Mobile panel frame
│   │   │   ├── start-smart/                     # Money Survival Blueprint panels
│   │   │   │   └── panels/home-base-panel.tsx
│   │   │   ├── auth/                             # Account recovery, entry panel, password form
│   │   │   ├── i18n/                             # Locale switcher
│   │   │   ├── onboarding/                      # Language select modal (first screen)
│   │   │   ├── pwa/                             # Install prompt
│   │   │   ├── providers/                       # App-level React context providers
│   │   │   ├── welcome/                         # Welcome window
│   │   │   ├── wizard/                          # Onboarding wizard (shell, steps, voice toggle)
│   │   │   └── ui/                              # Shared primitives
│   │   │       ├── accordion.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── confetti.tsx
│   │   │       ├── input.tsx
│   │   │       ├── modal.tsx
│   │   │       ├── progress-ring.tsx
│   │   │       ├── select.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── theme-toggle.tsx
│   │   │       └── toggle.tsx
│   ├── hooks/                               # Custom React hooks
│   │   ├── use-voice.ts                 # 🎯 Web Speech API (STT/TTS)
│   │   ├── use-local-db.ts              # IndexedDB reactor (idb)
│   │   ├── use-critical-expense.ts      # Critical expense state
│   │   ├── use-haptic.ts                # Haptic feedback (mobile)
│   │   ├── use-shared-board.ts          # Shared couple-board sync state
│   │   ├── use-accounts.ts              # Accounts (boards/umbrellas) state
│   │   ├── use-account-sync.ts          # Automatic cross-account sync
│   │   ├── use-currency.ts              # Location-driven currency formatting
│   │   ├── use-display-prefs.ts         # Display preferences (theme, numerals)
│   │   ├── use-news-prefs.ts            # Market Watch news preferences
│   │   │
│   │   # Daily Convex snapshot sync lives in src/lib/convex/sync-snapshots.ts
│   │   # + convex/snapshots.ts (no use-daily-snapshot.ts hook).
│   ├── lib/                               # Core libraries
│   │   ├── auth/                          # Auth utilities (e2e-auth-override, route-guard, routes)
│   │   ├── convex/                        # Convex HTTP client, sync snapshots
│   │   ├── db/                            # Local IndexedDB wrapper (local-db.ts)
│   │   ├── http/                          # Client IP / geolocation (location-driven currency)
│   │   ├── legal/                         # Legal versions + content (TOS/privacy/cookie)
│   │   ├── news/                          # RSS fetcher (rss-parser) — Market Watch
│   │   ├── types/                         # Budget types
│   │   ├── utils/                         # cn, compound-calculator, currency, thai-category-mapper
│   │   ├── animation/                     # Animation presets
│   │   └── colors/                        # Theme color tokens
│   └── middleware.ts                    # Auth middleware (minimal)
├── .cache/                              # 🚫 GITIGNORED — Agent token cache
├── .gitignore                           # 📝 .cache/, *.idb, local-db-*
├── AGENTS.md                            # Agent instructions
├── ARCHITECTURE.MD                      # Architecture doc
├── CLAUDE.md                            # Claude instructions
├── next.config.ts                       # Next.js config + next-pwa + i18n
├── package.json                         # 📝 PRUNED deps (no Prisma/Neon/Inngest/Resend/Sentry)
├── postcss.config.mjs                   # Tailwind PostCSS
├── README.md                            # Project readme
├── tsconfig.json                        # TypeScript config
└── vitest.config.ts                     # Vitest config
```

---

## Key Files for Agents (Priority Order)

| Priority | File | Why |
|----------|------|-----|
| 1 | `docs/dev-tree-diagram.md` | **This file** — start here |
| 2 | `docs/plans/.archive/2026-06-13-budgetbitch-complete-revamp-design.md` | Full design spec (archived) |
| 3 | `src/lib/types/budget.ts` | All data models |
| 4 | `src/lib/db/local-db.ts` | Local DB API |
| 5 | `src/components/wizard/wizard-shell.tsx` | Onboarding flow |
| 6 | `src/components/dashboard/dashboard-shell.tsx` | Main app screen |
| 7 | `src/hooks/use-voice.ts` | Voice STT/TTS |
| 8 | `src/lib/news/rss-fetcher.ts` | Localized alerts |
| 9 | `convex/schema.ts` | Backend schema |
| 10 | `convex/snapshots.ts` | Daily sync mutation |

---

## Data Flow (Mental Model)

```
User Action
    │
    ▼
┌─────────────────────────────────────┐
│  React Components (src/components/) │
│  - Wizard steps                     │
│  - Dashboard panels                 │
│  - Critical expense modal           │
└──────────────┬──────────────────────┘
               │ use-local-db.ts hook
               ▼
┌─────────────────────────────────────┐
│  Local DB (src/lib/db/local-db.ts)  │
│  - IndexedDB via idb                │
│  - CRUD + migrations                │
│  - Reacts to changes                │
└──────────────┬──────────────────────┘
               │
               ▼ (daily, background)
┌─────────────────────────────────────┐
│  Service Worker                     │
│  - Triggers Convex sync             │
│  - Offline queue                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Convex (convex/snapshots.ts)       │
│  - upsertDailySnapshot mutation     │
│  - Auth via Convex Auth             │
└─────────────────────────────────────┘
```

---

## Common Tasks & Where to Look

| Task | Files to Touch |
|------|----------------|
| Add wizard question | `src/components/wizard/steps/`, `src/lib/types/budget.ts`, `src/lib/db/local-db.ts` |
| Add dashboard panel | `src/components/dashboard/panels/`, `src/components/dashboard/dashboard-shell.tsx` |
| New critical expense | `src/lib/types/budget.ts` (CRITICAL_EXPENSES), `critical-expenses-modal.tsx` |
| Change RSS source | `src/lib/news/rss-fetcher.ts` (RSS_FEEDS constant) |
| Add Thai category alias | `src/lib/utils/thai-category-mapper.ts` |
| Modify compound calc | `src/lib/utils/compound-calculator.ts` |
| Change locale behavior | `src/components/onboarding/language-select-modal.tsx`, `src/i18n/*` (request/server/messages) |
| Update Convex schema | `convex/schema.ts`, `convex/snapshots.ts` |
| Add PWA feature | `public/manifest.json`, `public/sw.js`, `next.config.ts` |
| Add accounts / board / umbrella | `src/components/accounts/`, `src/hooks/use-accounts.ts`, `src/hooks/use-account-sync.ts`, `convex/schema.ts` |
| Change location-driven currency | `src/hooks/use-currency.ts`, `src/lib/http/client-ip.ts` |
| Add legal page / consent | `src/components/legal/`, `src/lib/legal/*`, `src/app/api/legal/*` |

---

## Gitignore Additions

```gitignore
# Agent cache
.cache/

# Local DB (dev only)
*.idb
local-db-*

# PWA
public/sw.js.map
public/manifest.json.map
```

---

## Known Gaps (verified 2026-07-19)

- **`middleware.ts` → `proxy.ts`**: Next.js 16.2 deprecates the `middleware.ts`
  convention in favor of `proxy.ts`. The root `src/middleware.ts` still works
  (warning only). `@convex-dev/auth@0.0.92` does **not** yet export a `proxy`
  variant of `convexAuthNextjsMiddleware`, so do not rename the file/export until
  the auth library adds proxy support. Tracked, not a code change.
- **Multiple lockfiles warning**: `budgetbitch/package-lock.json` (nested
  prototype subtree) triggers Next's "additional lockfiles" build warning.
  Benign — leave the prototype untouched; do not hoist its lockfile.

---

## Quick Commands

```bash
# Dev
npm run dev

# Build
npm run build

# Lint
npm run lint

# Test
npm test

# Test watch
npm run test:watch

# E2E
npm run test:e2e

# Convex dev
npx convex dev

# Type check
npx tsc --noEmit
```

---

## Legend

- 🎯 **Critical path** — Core feature, high touch
- 📝 **Config/data** — Schema, types, constants
- 🗑️ **To remove** — Legacy code, delete in revamp
- 🚫 **Gitignored** — Don't commit