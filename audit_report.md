# Audit Report: BudgetBITCH (Root App)

**Date:** 2026-06-13 15:45 UTC
**Scope:** Root BudgetBITCH app (excluding `budgetbitch/` prototype and `.worktrees/`)
**Reviewer:** automated (code-review skill Phase 1)

---

## 1. File Inventory

| Language | Files | Lines | Avg Size |
|----------|-------|-------|----------|
| TypeScript | 106 | 11,087 | 104 |
| JSON | 1 | 12,122 | 12,122 |
| **Total** | **107** | **23,209** | **-** |

### Top 20 Largest Files

```
 12122 ./package-lock.json
  1548 ./src/i18n/messages.ts
   501 ./WelcomeWindow-startup/WelcomeScreen.tsx
   413 ./src/app/settings/page.tsx
   370 ./src/lib/db/local-db.ts
   330 ./src/hooks/use-local-db.ts
   295 ./src/components/dashboard/critical-expenses-modal.tsx
   275 ./src/components/dashboard/panels/savings-goals.tsx
   273 ./src/components/wizard/wizard-shell.tsx
   252 ./src/components/dashboard/panels/bills.tsx
   233 ./src/components/dashboard/dashboard-shell.tsx
   226 ./src/components/dashboard/panels/expense-tracker.tsx
   204 ./src/lib/utils/thai-category-mapper.ts
   201 ./src/lib/types/budget.ts
   199 ./src/components/dashboard/panels/debt-payoff.tsx
   183 ./src/hooks/use-voice.ts
   171 ./src/components/wizard/steps/step-location-consent.tsx
   146 ./src/components/dashboard/alerts-sidebar.tsx
   145 ./src/middleware.test.ts
   143 ./convex/_generated/server.d.ts
```

### Directory Structure (Root App)

```
src/
├── app/
│   ├── page.tsx                    # Landing page / auth routing
│   └── settings/page.tsx           # Settings page
├── components/
│   ├── auth/                       # Auth UI components
│   ├── dashboard/                  # Dashboard panels & widgets
│   │   └── panels/                 # 8 dashboard panels
│   ├── i18n/                       # Locale switcher
│   ├── layout/                     # Header bar
│   ├── mobile/                     # Mobile panel frame
│   ├── onboarding/                 # Language select modal
│   ├── pwa/                        # Install prompt
│   ├── ui/                         # 8 primitive UI components
│   ├── welcome/                    # Welcome window
│   └── wizard/                     # Onboarding wizard (10 steps + shell)
├── hooks/                          # 3 custom hooks
├── i18n/                           # Internationalization (messages, request, server)
├── lib/
│   ├── auth/                       # Auth utilities (routes, e2e-override, route-guard)
│   ├── convex/                     # Convex HTTP client & sync
│   ├── db/                         # Local IndexedDB wrapper
│   ├── news/                       # RSS fetcher
│   ├── types/                      # Budget types
│   ├── url.ts                      # URL utilities
│   └── utils/                      # 4 utility modules
├── middleware.ts                   # Convex Auth Next.js middleware
├── test/                           # Test setup & smoke test
├── types/                          # TypeScript declarations
convex/
├── auth.ts                         # Convex Auth config (Password provider)
├── http.ts                         # HTTP router (auth routes)
├── schema.ts                       # Convex schema (dailySnapshots + authTables)
├── snapshots.ts                    # upsertDailySnapshot mutation
├── lib/auth.ts                     # Auth helpers (requireIdentity, getAuthUserId)
└── _generated/                     # Convex generated types
```

---

## 2. Dependency Graph

### External Dependencies (package.json)

**Production:**
- `@convex-dev/auth` ^0.0.92 — Convex Auth integration
- `convex` ^1.34.1 — Convex client & server
- `date-fns` ^4.1.0 — Date formatting
- `framer-motion` ^12.38.0 — Animations
- `idb` ^8.0.0 — IndexedDB wrapper
- `lucide-react` ^1.7.0 — Icons
- `next` ^16.2.2 — Next.js App Router
- `next-intl` ^4.4.0 — Internationalization
- `next-pwa` ^5.6.0 — PWA support
- `react` ^19.2.4 / `react-dom` ^19.2.4 — React 19
- `recharts` ^3.8.1 — Charts
- `rss-parser` ^3.13.0 — RSS parsing
- `zod` ^4.3.6 — Validation

**Development:**
- `@playwright/test` ^1.59.1 — E2E testing
- `@tailwindcss/postcss` ^4.2.2 — Tailwind CSS v4
- `@testing-library/jest-dom` ^6.9.1 — Test utilities
- `@testing-library/react` ^16.3.2 — React testing
- `@types/node` ^25.5.2, `@types/react` ^19.2.14, `@types/react-dom` ^19.2.3
- `@vitest/coverage-v8` ^4.1.2 — Coverage
- `dotenv-cli` ^11.0.0 — Env loading
- `eslint` ^9.39.4 + `eslint-config-next` ^16.2.2 — Linting
- `jsdom` ^29.0.1 — DOM for tests
- `tailwindcss` ^4.2.2 — Tailwind CSS v4
- `typescript` ^6.0.2 — TypeScript 6
- `vitest` ^4.1.2 — Unit testing

### Internal Module Imports (Top 30)

```
import { useConvexAuth } from "@convex-dev/auth/react"
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { convexAuth } from "@convex-dev/auth/server"
import { Password } from "@convex-dev/auth/providers/Password"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { httpRouter, httpAction } from "convex/server"
import { defineSchema, defineTable } from "convex/server"
import { authTables } from "@convex-dev/auth/server"
import { normalizeConvexCloudUrl } from "@/lib/url"
import { hasNonProductionSignedInE2eOverrideFromHeaders } from "@/lib/auth/e2e-auth-override"
import { AUTH_ROUTES, isProtectedPath, isApiPath } from "@/lib/auth/routes"
import { PWAInstallPrompt } from "@/components/pwa/install-prompt"
import { WelcomeWindow } from "@/components/welcome/welcome-window"
import { LanguageSelectModal } from "@/components/onboarding/language-select-modal"
```

---

## 3. Test Baseline

| Metric | Value |
|--------|-------|
| Unit test files | 7 |
| Total tests | 26 |
| Passing | 26 |
| Failing | 0 |
| Skipped | 0 |
| Coverage | Not configured |

**Test Files & Counts:**
- `src/lib/convex/http-client.test.ts` — 3 tests
- `src/components/auth/auth-account-recovery-button.test.tsx` — 2 tests
- `src/components/welcome/welcome-window.test.tsx` — 2 tests
- `src/middleware.test.ts` — 10 tests
- `src/lib/url.test.ts` — 6 tests
- `src/lib/auth/route-guard.test.ts` — 2 tests
- `src/test/smoke.test.ts` — 1 test

**E2E Tests:** None present (`tests/e2e/` directory exists but empty)

---

## 4. Lint Baseline (ESLint 9 + Next.js config)

### Summary
- **Errors:** 0
- **Warnings:** ~30 (all `@typescript-eslint/no-unused-vars`)

### Warning Details (by file)

| File | Warnings | Types |
|------|----------|-------|
| `src/app/page.tsx` | 2 | unused `redirect`, `showInstallPrompt` |
| `src/app/settings/page.tsx` | 2 | unused `VolumeX`, `Save` imports |
| `src/components/dashboard/critical-expenses-modal.tsx` | 3 | unused vars |
| `src/components/dashboard/panels/bills.tsx` | 2 | unused vars |
| `src/components/dashboard/panels/budget-visual.tsx` | 2 | unused vars |
| `src/components/dashboard/panels/cash-flow-forecast.tsx` | 1 | unused var |
| `src/components/dashboard/panels/debt-payoff.tsx` | 1 | unused var |
| `src/components/dashboard/panels/emergency-fund.tsx` | 2 | unused vars |
| `src/components/dashboard/panels/expense-tracker.tsx` | 2 | unused vars |
| `src/components/dashboard/panels/net-worth.tsx` | 1 | unused var |
| `src/components/dashboard/panels/savings-goals.tsx` | 2 | unused vars |
| `src/components/dashboard/panels/subscriptions.tsx` | 1 | unused var |
| `src/components/wizard/wizard-shell.tsx` | 2 | unused vars |
| `src/components/wizard/steps/step-income.tsx` | 1 | unused var |
| `src/components/wizard/steps/step-rent.tsx` | 1 | unused var |
| `src/components/wizard/steps/step-transport.tsx` | 1 | unused var |
| `src/hooks/use-critical-expense.ts` | 1 | unused var |
| `src/hooks/use-voice.ts` | 1 | unused var |
| `src/lib/auth/route-guard.ts` | 1 | unused var |
| `src/lib/utils/currency.ts` | 1 | unused var |

**No other lint rules triggered** (no complexity, no security, no import order issues).

---

## 5. TypeScript Type Checking

```bash
npx tsc --noEmit
```
**Result:** ✅ **PASS** — No type errors.

---

## 6. TODOs/FIXMEs/XXXs

**None found** — `rg "TODO|FIXME|XXX" --type ts --type tsx --type js` returns empty.

---

## 7. Architecture Observations (vs ARCHITECTURE.MD)

| ARCHITECTURE.MD Claim | Actual State | Notes |
|-----------------------|--------------|-------|
| "Prisma 7 + Neon Postgres" | **Removed** | Recent commit migrated to Convex-only |
| "Inngest for async/event-driven jobs" | **Removed** | No Inngest imports found |
| "Resend for email" | **Removed** | No Resend imports found |
| "Sentry for observability" | **Removed** | No Sentry imports found |
| "API routes in `src/app/api/v1/**`" | **Removed** | Entire `src/app/api/` deleted in recent commit |
| "Protected product surfaces: Start Smart, Learn, Jobs, Dashboard, Integrations" | **Partially** | Dashboard, Wizard, Settings present; `/jobs`, `/learn`, `/integrations` routes missing |
| "`src/modules/dashboard/dashboard-data.ts` composition boundary" | **Removed** | Entire `src/modules/` deleted; dashboard logic now in `src/components/dashboard/panels/` |

**Key Finding:** The ARCHITECTURE.MD document describes the **old architecture** (pre-migration). The current codebase is a Convex-only, local-first PWA with no Prisma, Inngest, Resend, Sentry, or traditional API routes.

---

## 8. Scope Confirmation

**Scope approved?** [ ] Yes / [ ] No — adjust and re-audit

**Notes:**
- Run `npm run build` to verify production build passes
- E2E tests need to be created in `tests/e2e/`
- Coverage reporting not configured
- ARCHITECTURE.MD needs updating to match current Convex-only architecture
- ~30 unused variable warnings should be cleaned up (low priority)

---

## Next Steps

1. **Confirm scope** — Is the root app the correct target? (exclude `budgetbitch/` prototype)
2. **Proceed to Phase 2 (Review)** — Structural & semantic analysis against Convex guidelines and project conventions
3. **Prioritize:**
   - Update ARCHITECTURE.MD to reflect reality
   - Clean up unused variable warnings
   - Add Convex function tests (using `convex-test` + `vitest`)
   - Create E2E tests for critical flows (auth → wizard → dashboard)