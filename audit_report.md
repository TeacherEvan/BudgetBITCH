# Phase 1: Codebase Audit Report — BudgetBITCH

**Date:** 2026-07-23  
**Target:** Full Codebase (`BudgetBITCH`)  
**Framework:** Next.js 16 + React 19 + Convex Backend + TailwindCSS + Vitest / Playwright  

---

## 1. Executive Summary & Inventory

- **Total Source/Test Files:** 270 files (`.tsx`: 142, `.ts`: 126, `.js`/`.mjs`: 2)
- **Total Lines of Code:** ~36,972 LOC
- **Entry Points:**
  - Web Frontend: `src/app/` (Next.js 16 App Router)
  - State & Local Storage DB: `src/lib/db/local-db.ts` (IndexedDB via `idb`) & `src/hooks/use-local-db.ts`
  - Backend API / Realtime: `convex/` (Convex cloud functions & schema)
  - Internationalization: `src/i18n/`
- **Key Modules & Directories:**
  - `convex/`: Backend functions (`accounts.ts`, `sharedBoards.ts`, `snapshots.ts`, `receipts.ts`, `legal.ts`, `auth.ts`)
  - `src/components/`: Dashboard panels (`bills.tsx`, `expense-tracker.tsx`, `subscriptions.tsx`, `savings-goals.tsx`), Settings, Modals, Accounts UI
  - `src/lib/`: IndexedDB store (`local-db.ts`), SMS Parsers (`src/lib/sms-parser/`), Convex client integration (`sync-snapshots.ts`), Utilities
  - `src/hooks/`: Reactive state custom hooks (`use-local-db.ts`, `use-accounts.ts`, `use-shared-board.ts`)

---

## 2. Dependency Graph (High Level)

```
[Next.js App Router (src/app/)]
   │
   ├──> [React UI Components (src/components/)]
   │       ├──> [Hooks (src/hooks/use-local-db.ts, use-accounts.ts, etc.)]
   │       │       ├──> [IndexedDB Local Storage (src/lib/db/local-db.ts)]
   │       │       └──> [Convex Client Sync (src/lib/convex/sync-snapshots.ts)]
   │       └──> [I18n (src/i18n/messages.ts)]
   │
   └──> [Convex Backend API (convex/)]
           ├──> Schema & Tables (`accounts`, `sharedBoards`, `dailySnapshots`, `receipts`)
           ├──> Auth Integration (`@convex-dev/auth`)
           └──> Gemini AI API Actions (`receipts.ts`)
```

---

## 3. Test Coverage Baseline

| Suite | Runner | Test Files | Total Tests | Pass Rate | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend / Core Unit** | Vitest | 65 | 435 passed | 100% (435/435) | ~48.8s |
| **Convex Backend Unit** | Vitest (`convex-test`) | 6 | 43 passed | 100% (43/43) | ~1.5s |
| **Total Test Baseline** | — | **71** | **478 passed** | **100%** | **~50.3s** |

---

## 4. Static Analysis & Lint Baseline

- **ESLint Errors:** 0 errors
- **ESLint Warnings:** 13 warnings (all related to `@typescript-eslint/no-unused-vars` in `src/lib/sms-parser/patterns/*.ts` files: `generic.ts`, `sg.ts`, `th.ts`, `us.ts`)
- **TODOs / FIXMEs / XXXs:** 0 found across all codebase files

---

## 5. Scope Confirmation & Gate

- **Scope:** Full codebase audit (Frontend, Local Storage, Hooks, Convex Backend).
- **Status:** Phase 1 Complete. Ready for Phase 2: Review (Structural & Semantic Analysis).
