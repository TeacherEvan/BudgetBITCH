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
│   │   └── 2026-06-13-budgetbitch-complete-revamp-design.md
│   └── dev-tree-diagram.md          # THIS FILE
├── public/                          # Static assets
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker (workbox)
├── scripts/                         # Build scripts
├── src/                             # 🎯 MAIN SOURCE CODE
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout: Providers (ConvexAuth, next-intl, PWA, Voice)
│   │   ├── page.tsx                 # Landing → LanguageSelect → redirect
│   │   ├── globals.css              # Global styles: 3 themes (amber/dark/gold)
│   │   ├── sign-in/[[...page]].tsx  # Convex Auth sign-in
│   │   ├── sign-up/[[...page]].tsx  # Convex Auth sign-up
│   │   ├── wizard/
│   │   │   └── page.tsx             # WizardShell (protected)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # DashboardShell (protected)
│   │   └── settings/
│   │       └── page.tsx             # Settings (protected)
│   ├── components/                  # React components
│   │   ├── onboarding/
│   │   │   └── language-select-modal.tsx    # 🎯 FIRST SCREEN — Thai/English
│   │   ├── pwa/
│   │   │   └── install-prompt.tsx           # Pre-wizard PWA install
│   │   ├── wizard/
│   │   │   ├── wizard-shell.tsx              # 10-step voice-guided wizard
│   │   │   ├── wizard-progress.tsx           # Progress indicator
│   │   │   ├── voice-toggle.tsx              # Voice ON/OFF
│   │   │   └── steps/                        # 10 step components
│   │   │       ├── step-income.tsx           # Q1: Monthly income
│   │   │       ├── step-rent.tsx             # Q2: Rent/Mortgage
│   │   │       ├── step-transport.tsx        # Q3: Transport (Grab, BTS, fuel)
│   │   │       ├── step-phone-internet.tsx   # Q4: Phone/Internet
│   │   │       ├── step-subscriptions.tsx    # Q5: Subscriptions
│   │   │       ├── step-entertainment.tsx    # Q6: Entertainment
│   │   │       ├── step-healthcare.tsx       # Q7: Healthcare
│   │   │       ├── step-savings-rate.tsx     # Q8: Savings % (slider)
│   │   │       ├── step-risk-tolerance.tsx   # Q9: Low/Med/High
│   │   │       └── step-location-consent.tsx # Q10: Location + privacy disclaimer
│   │   ├── dashboard/
│   │   │   ├── dashboard-shell.tsx           # Main dashboard layout
│   │   │   ├── daily-disposable-hero.tsx     # 🎯 ONE BIG NUMBER: Daily disposable
│   │   │   ├── critical-expenses-modal.tsx   # 8 items + compound calculator
│   │   │   ├── alerts-sidebar.tsx            # Actionable RSS alerts (TH/EN)
│   │   │   └── panels/                       # 9 Accordion panels (not tabs)
│   │   │       ├── expense-tracker.tsx       # Category tracking + budgets
│   │   │       ├── budget-visual.tsx         # Bar chart: Income vs Expense
│   │   │       ├── bills.tsx                 # Due-soon + Thai holidays
│   │   │       ├── savings-goals.tsx         # Progress rings
│   │   │       ├── net-worth.tsx             # Assets - Liabilities
│   │   │       ├── subscriptions.tsx         # Detected recurring (TrueWallet, GrabPay)
│   │   │       ├── emergency-fund.tsx        # Target + progress
│   │   │       ├── debt-payoff.tsx           # Avalanche/Snowball
│   │   │       └── cash-flow-forecast.tsx    # 30/60/90 day projection
│   │   ├── layout/
│   │   │   └── header-bar.tsx                # 🎯 Globe🌐 + Wrench🔧 (persistent)
│   │   ├── auth/                             # Minimal Convex Auth UI
│   │   └── ui/                               # Shared primitives
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── modal.tsx
│   │       ├── accordion.tsx
│   │       ├── input.tsx
│   │       ├── slider.tsx
│   │       ├── select.tsx
│   │       ├── toggle.tsx
│   │       └── progress-ring.tsx
│   ├── hooks/                               # Custom React hooks
│   │   ├── use-voice.ts                 # 🎯 Web Speech API (STT/TTS)
│   │   ├── use-local-db.ts              # IndexedDB reactor (idb)
│   │   ├── use-critical-expense.ts      # Critical expense state
│   │   └── use-daily-snapshot.ts        # Convex sync trigger (SW)
│   ├── lib/                               # Core libraries
│   │   ├── db/
│   │   │   └── local-db.ts              # 🎯 idb wrapper: CRUD + migrations v1
│   │   ├── convex/
│   │   │   └── sync-snapshots.ts        # Daily push to Convex
│   │   ├── news/
│   │   │   └── rss-fetcher.ts           # RSS parsing + caching (TH/EN, 6h TTL)
│   │   ├── utils/
│   │   │   ├── thai-category-mapper.ts  # Voice Thai → ExpenseCategory
│   │   │   ├── compound-calculator.ts   # Critical expense projections
│   │   │   ├── currency.ts              # THB/USD formatting (Intl)
│   │   │   └── date.ts                  # Thai calendar, holidays
│   │   └── types/
│   │       ├── budget.ts                # All TypeScript interfaces
│   │       ├── speech.d.ts              # Web Speech API types
│   │       └── next-pwa.d.ts            # Next PWA types
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
| 2 | `docs/plans/2026-06-13-budgetbitch-complete-revamp-design.md` | Full design spec |
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
| Change locale behavior | `src/components/onboarding/language-select-modal.tsx`, `src/hooks/use-locale.ts` |
| Update Convex schema | `convex/schema.ts`, `convex/snapshots.ts` |
| Add PWA feature | `public/manifest.json`, `public/sw.js`, `next.config.ts` |

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