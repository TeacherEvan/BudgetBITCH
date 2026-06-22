# Audit Report: BudgetBITCH (Root App)

**Date:** 2026-06-22
**Scope:** Root BudgetBITCH app (excluding `budgetbitch/` prototype and `.worktrees/`)
**Reviewer:** Antigravity (code-review skill Phase 1)

---

## 1. File Inventory

| Language | Files | Lines | Avg Size |
|----------|-------|-------|----------|
| TypeScript (TS) | 44 | 5,593 | 127 |
| TypeScript React (TSX) | 79 | 8,670 | 109 |
| Vanilla CSS | 1 | 485 | 485 |
| **Total (Hand-written)** | **124** | **14,748** | **118** |

*Note: Generated Convex files in `convex/_generated/` and third-party files are excluded from this inventory.*

### Top 20 Largest Files (excluding generated code)

```
 1677 ./src/i18n/messages.ts
  491 ./src/hooks/use-local-db.ts
  370 ./src/lib/db/local-db.ts
  359 ./src/app/settings/page.tsx
  337 ./src/hooks/use-voice.test.ts
  320 ./src/components/dashboard/panels/voice-expense-input.tsx
  295 ./src/components/dashboard/critical-expenses-modal.tsx
  290 ./src/components/dashboard/panels/subscriptions.tsx
  275 ./src/components/dashboard/panels/savings-goals.tsx
  274 ./src/components/wizard/wizard-shell.tsx
  267 ./src/components/dashboard/panels/expense-tracker.tsx
  246 ./src/components/dashboard/panels/bills.tsx
  242 ./src/components/pwa/install-prompt.test.tsx
  233 ./src/components/dashboard/panels/emergency-fund.tsx
  210 ./src/components/dashboard/panels/net-worth.tsx
  208 ./src/components/dashboard/dashboard-shell.tsx
  204 ./src/lib/utils/thai-category-mapper.ts
  201 ./src/lib/types/budget.ts
  193 ./src/components/dashboard/panels/debt-payoff.tsx
  183 ./src/hooks/use-voice.ts
```

### Directory Structure (Root App)

```
src/
├── app/
│   ├── (app)/
│   │   ├── dashboard/              # Dashboard page & client wrapper
│   │   └── wizard/                 # Onboarding wizard page & client wrapper
│   ├── layout.tsx                  # Global HTML/layout template
│   ├── page.tsx                    # Welcome page & routing logic
│   ├── settings/                   # App settings page & test
│   └── globals.css                 # Vanilla CSS stylesheets & Tailwind 4 imports
├── components/
│   ├── auth/                       # Auth pages (login, recovery)
│   ├── dashboard/                  # Core panels & widgets
│   │   └── panels/                 # 8 interactive dashboard panels
│   ├── layout/                     # Page header and nav
│   ├── onboarding/                 # Onboarding overlays (language select)
│   ├── pwa/                        # PWA install prompt & test
│   ├── ui/                         # Reusable primitives (modal, input, etc.)
│   ├── welcome/                    # Welcome window & startup setup
│   └── wizard/                     # Onboarding steps & inputs
├── hooks/                          # Core hooks (voice, local DB wrappers)
├── i18n/                           # Internationalization setup (next-intl)
├── lib/
│   ├── auth/                       # Middleware, e2e overrides, routes config
│   ├── convex/                     # Sync daily snapshots to Convex
│   ├── db/                         # Local IndexedDB (local-db.ts)
│   ├── news/                       # RSS news parser
│   └── utils/                      # Formatting, currency, & calculation utils
├── middleware.ts                   # Router protection & auth middleware
convex/
├── auth.ts                         # Convex Auth initialization
├── auth.config.ts                  # Provider list & configuration
├── http.ts                         # Routing auth actions
├── schema.ts                       # Snapshot & auth tables layout
├── snapshots.ts                    # Snapshot mutations
└── lib/
    └── auth.ts                     # Convex auth helpers
```

---

## 2. Dependency Graph

### Production Dependencies (`package.json`)
- `@convex-dev/auth` ^0.0.92 — Auth helpers for Convex.
- `convex` ^1.34.1 — Convex API client & sync.
- `date-fns` ^4.1.0 — Date utility calculations.
- `framer-motion` ^12.38.0 — Fluid animations.
- `idb` ^8.0.0 — IndexedDB promise wrapper.
- `lucide-react` ^1.7.0 — Icon system.
- `next` ^16.2.2 — Next.js framework (App Router).
- `next-intl` ^4.4.0 — Internationalization system.
- `next-pwa` ^5.6.0 — Service worker sync setup.
- `next-themes` ^0.4.6 — Dark/light mode switcher.
- `react` ^19.2.4 / `react-dom` ^19.2.4 — React 19 core.
- `recharts` ^3.8.1 — Visual data charts.
- `rss-parser` ^3.13.0 — RSS feed loading.
- `zod` ^4.3.6 — Data schema validation.

### Development & Build Tools
- `@tailwindcss/postcss` ^4.3.1 / `tailwindcss` ^4.2.2 — Tailwind styling engine.
- `@testing-library/react` / `@testing-library/jest-dom` — Testing helpers.
- `vitest` ^4.1.2 — Test suite execution.
- `@vitest/coverage-v8` ^4.1.2 — Coverage metrics.
- `eslint` ^9.39.4 — Static analysis.
- `typescript` ^6.0.2 — TypeScript compiler.
- `@playwright/test` ^1.59.1 — Browser E2E suite.

---

## 3. Test Baseline (Vitest)

| Metric | Value |
|--------|-------|
| Test files | 21 |
| Total tests | 118 |
| Passing tests | 106 |
| Failing tests | 12 |
| Pass Rate | **89.83%** |

### Failure Details

1. **`src/hooks/use-local-db.test.ts` (1 Failure)**
   - **Failed Test:** `use-local-db hooks > useDebtPayoff initializes without synchronous setState in effect`
   - **Reason:** `Error: [vitest] No "getAllDebts" export is defined on the "@/lib/db/local-db" mock.`
   - **Root Cause:** The mock in `use-local-db.test.ts` lists many DB functions but is missing `getAllDebts` (and also other newly added functions like `saveNetWorthSnapshot`, `getLatestNetWorthSnapshot`, `addDebt`, `updateDebt`, `deleteDebt`).

2. **`src/hooks/use-voice.test.ts` (11 Failures)**
   - **Failing Tests:** Voice settings parsing, settings loading/saving, and speak action constraints.
   - **Reason:** `isSupported` is evaluated as `undefined` (expected `true` or `false`).
   - **Root Cause:** The test setup mock overrides `global.window` completely without mapping `SpeechRecognition` or `webkitSpeechRecognition` to `global.window`. The hook reads `(window as any).SpeechRecognition`, which is therefore `undefined` during execution.

---

## 4. Lint Baseline (ESLint 9)

Running ESLint specifically targeting the root application files (`src` and `convex`):

| Severity | Count | Primary Rules Triggered |
|----------|-------|-------------------------|
| **Error** | 50 | `@typescript-eslint/no-explicit-any`, `no-use-before-define`, `react-hooks/purity`, `react-hooks/set-state-in-effect` |
| **Warning** | 69 | `@typescript-eslint/no-unused-vars`, `react-hooks/exhaustive-deps`, `eslint-disable` directive |
| **Total** | **119** | |

### Key Lint Issues by File

- **`src/app/(app)/dashboard/dashboard-client.tsx` (2 Errors, 3 Warnings)**
  - **Errors:** `initializeBudgets` and `checkWizardStatus` called before their initialization (due to hoisting patterns).
  - **Warnings:** Unused `t` and `saveProfile` variables; missing dependencies in `useEffect`.

- **`src/app/(app)/wizard/wizard-client.tsx` (1 Error, 3 Warnings)**
  - **Error:** `checkWizardStatus` called before its initialization.

- **`src/hooks/use-local-db.ts` (5 Errors, 1 Warning)**
  - **Errors:** 4 usages of type `any` instead of explicit types; 1 `prefer-const` violation (`emergencyGoal` is never reassigned).

- **`src/hooks/use-voice.test.ts` & `src/app/page.test.tsx` (10 Errors)**
  - **Errors:** 10 occurrences of `Unexpected any` in mock assignments.

- **`src/components/dashboard/panels/cash-flow-forecast.tsx` (1 Error, 4 Warnings)**
  - **Error:** `Math.random` is an impure function called directly during render (`react-hooks/purity`).

- **`src/components/dashboard/panels/savings-goals.tsx` (5 Errors, 1 Warning)**
  - **Error:** `Date.now` is an impure function called directly during render (`react-hooks/purity`); 4 occurrences of `any` type.

- **`src/components/dashboard/panels/voice-expense-input.tsx` (1 Error, 4 Warnings)**
  - **Error:** Calling `setState` synchronously within an effect (`react-hooks/set-state-in-effect` on line 162).

---

## 5. TypeScript Type Checking

Running `npx tsc --noEmit` on the codebase:
- **Result:** ✅ **PASS** — No compilation/type errors in the root project.

---

## 6. TODOs/FIXMEs/XXXs

- **Result:** None found. No `TODO`, `FIXME`, or `XXX` tags are present in `src/` or `convex/`.

---

## 7. Architecture Observations

The codebase structure matches the layout detailed in [ARCHITECTURE.MD](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/ARCHITECTURE.MD) perfectly. The system uses:
- IndexedDB for local-first reads and writes.
- Service Worker background sync.
- Convex as the backend database, authentication mechanism, and daily snapshot storage.
- isolated prototype folders (`budgetbitch/`) which are correctly separated from the build graph.

---

## Scope Confirmation & Next Steps

**Scope Approved?** [ ] Yes / [ ] No

Based on Phase 1: Audit, we have found several major issues that should be addressed in the subsequent phases:
1. **Fix Vitest suite setup errors:**
   - Add missing db mocks (`getAllDebts`, `saveNetWorthSnapshot`, `getLatestNetWorthSnapshot`, `addDebt`, etc.) in `use-local-db.test.ts`.
   - Correct window-level SpeechRecognition mocking in `use-voice.test.ts`.
2. **Resolve ESLint errors:**
   - Standardize hoisted callback definitions in Next.js page wrappers.
   - Refactor impure rendering values (`Math.random()`, `Date.now()`) into proper state or helper scopes.
   - Eliminate prohibited synchronous `setState` in the voice recognition effect.
   - Clean up explicit `any` usages.