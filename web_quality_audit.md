# Web Quality Audit: BudgetBITCH (Root App)

**Date:** 2026-06-22
**Project:** BudgetBITCH Root Next.js/Convex PWA
**Auditor:** Antigravity (web-quality-audit skill)

---

## Audit Results

### Critical Issues (4 found)

1. **[Best Practices/Performance] Incorrect Service Worker Caching Routes**
   - **File:** `public/sw.js:3`
   - **Impact:** The service worker caches `/calculator` and `/notes` routes. These routes do not exist in the root app. It does not cache the actual root app routes: `/dashboard`, `/wizard`, or `/settings`. Offline PWA support is completely non-functional for the main application.
   - **Fix:** Update `SAFE_ROUTE_SHELLS` in [sw.js](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/public/sw.js) to:
     ```javascript
     const SAFE_ROUTE_SHELLS = ["/", "/dashboard", "/wizard", "/settings"];
     ```

2. **[Best Practices] Service Worker Registration Defect**
   - **File:** `src/lib/convex/sync-snapshots.ts:66`
   - **Impact:** The registration function `registerSyncWorker` is never imported or called anywhere in the app. The service worker is never registered in the browser, leaving the offline capabilities completely disabled.
   - **Fix:** Import and invoke `registerSyncWorker()` in [layout.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/app/layout.tsx) or a root client provider:
     ```typescript
     import { registerSyncWorker } from '@/lib/convex/sync-snapshots';
     // Call inside a client-side useEffect at root
     useEffect(() => {
       registerSyncWorker();
     }, []);
     ```

3. **[Convex Integration] commented-out Snapshot Synchronization**
   - **File:** `src/lib/convex/sync-snapshots.ts:42-54`
   - **Impact:** `syncDailySnapshot` and `flushOfflineQueue` contain commented-out calls to Convex and use dummy mock data instead of retrieving real data from IndexedDB. Local-first IndexedDB data is never backed up to Convex.
   - **Fix:** Implement proper IndexedDB reading and invoke `convex.mutation` inside [sync-snapshots.ts](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/convex/sync-snapshots.ts).

4. **[SEO/Best Practices] Missing Web App Manifest Link**
   - **File:** `src/app/layout.tsx:30-35`
   - **Impact:** The HTML head does not link to the web app manifest (`/manifest.json`). The application fails PWA installability audits on mobile and desktop browsers.
   - **Fix:** Add a link to the manifest in the head of [layout.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/app/layout.tsx):
     ```tsx
     <link rel="manifest" href="/manifest.json" />
     ```

---

### High Priority (3 found)

1. **[Performance/Purity] Impure Render Path Calculations**
   - **Files:** [cash-flow-forecast.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/components/dashboard/panels/cash-flow-forecast.tsx#L35) and [savings-goals.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/components/dashboard/panels/savings-goals.tsx#L182)
   - **Impact:** Direct calls to `Math.random()` and `Date.now()` during the render phase trigger `react-hooks/purity` errors. This causes layout shifts and unpredictable state values on re-renders.
   - **Fix:** Wrap the daily flow computations and date differences in `useMemo`.

2. **[Performance/Purity] Synchronous setState Inside useEffect**
   - **File:** [voice-expense-input.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/components/dashboard/panels/voice-expense-input.tsx#L162)
   - **Impact:** `setParsedExpense(parsed)` is called synchronously inside a `useEffect` callback without boundary checks, triggering the `react-hooks/set-state-in-effect` lint error and causing cascading renders.
   - **Fix:** Guard or schedule the state update asynchronously or shift the action logic out of the effect cycle.

3. **[Best Practices] 12 Vitest Failures in Test Suites**
   - **Files:** `src/hooks/use-local-db.test.ts` and `src/hooks/use-voice.test.ts`
   - **Impact:** Broken mock definitions fail the test suites, preventing regression validation.
   - **Fix:** Correct the missing db mocks in [use-local-db.test.ts](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/hooks/use-local-db.test.ts) and the global window mock mapping in [use-voice.test.ts](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/hooks/use-voice.test.ts).

---

### Medium Priority (2 found)

1. **[Best Practices] Hoisted Declarations Called Before Definition**
   - **Files:** [dashboard-client.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/app/(app)/dashboard/dashboard-client.tsx#L30) and [wizard-client.tsx](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/app/(app)/wizard/wizard-client.tsx#L30)
   - **Impact:** Arrow functions `initializeBudgets` and `checkWizardStatus` are referenced inside `useEffect` before their declaration.
   - **Fix:** Reorder definitions so the functions are defined before they are used in hook dependencies or calls.

2. **[Best Practices] Excessive Type `any` Usages**
   - **Files:** Various hooks and components (42 occurrences)
   - **Impact:** Compromises TypeScript's compile-time safety and increases runtime error risk.
   - **Fix:** Replace `any` with strict typing or schema-defined interfaces.

---

## Summary

- **Performance:** 4 issues (2 critical, 2 high)
- **Accessibility:** 0 major issues (native tags and aria structures present)
- **SEO:** 1 issue (1 critical - missing manifest link)
- **Best Practices:** 4 issues (2 critical, 2 high)

---

## Recommended Priority

1. **Resolve Test & SW Setup (Critical):**
   - Bind `<link rel="manifest">` in layout.
   - Rectify the route cache shells and register the service worker correctly.
   - Repair Vitest mocks to restore a passing test suite.
2. **Eliminate Impurity / Effect Errors (High):**
   - Wrap impure calculations in `useMemo`.
   - Prevent synchronous state updates in the voice effect.
3. **Refactor Code Hygiene (Medium/Low):**
   - Adjust hoisting order in dashboard and wizard client files.
   - Remove unused variables and imports.
