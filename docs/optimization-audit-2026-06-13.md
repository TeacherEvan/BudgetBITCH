# BudgetBITCH Codebase Optimization Audit Report

**Date:** 2026-06-13
**Branch:** `main`
**Skill:** code-optimization

---

## Executive Summary

The BudgetBITCH codebase is a Next.js 16 + Convex + TypeScript budgeting application with a custom design system. While functional and well-structured in many areas, there are significant optimization opportunities across **TypeScript quality**, **React performance patterns**, **bundle size**, and **dead code elimination**.

**Total Issues Found:** 180 ESLint problems (56 errors, 124 warnings)
**Tests:** 26 passing
**Build Status:** Failing (Node 24 compatibility issue with Next.js 16)

---

## Phase 1: Analysis & Profiling Results

### 1.1 Static Analysis (ESLint)

| Category | Count | Severity |
|----------|-------|----------|
| `@typescript-eslint/no-explicit-any` | ~50 | Error - Type safety |
| `react-hooks/set-state-in-effect` | 5 | Error - Performance anti-pattern |
| `@typescript-eslint/no-unused-vars` | ~30 | Warning - Dead code |
| `react-hooks/exhaustive-deps` | 1 | Warning - Missing memo deps |
| Unused imports (lucide-react, date-fns) | ~15 | Warning - Bundle size |

### 1.2 Architecture Review

| Component | Files | Lines | Issues |
|-----------|-------|-------|--------|
| Hooks (`use-local-db.ts`) | 1 | 343 | Heavy `any` usage, sync setState in effects, dummy data |
| Dashboard Panels | 9 | ~1500 | `any` types, missing memoization, heavy imports |
| Settings Page | 1 | 409 | setState in effect, large inline labels object |
| UI Components | 9 | ~500 | Well-structured, no major issues |
| Types | 1 | 201 | Well-defined, underutilized |
| Local DB | 1 | 370 | Well-typed, not fully used by hooks |

### 1.3 Bundle Size Analysis (Dependencies)

| Package | Size (gzipped est.) | Usage | Optimization |
|---------|---------------------|-------|--------------|
| `recharts` | ~45KB | 1 component (budget-visual) | Dynamic import |
| `lucide-react` | ~25KB | 20+ components | Tree-shake per component |
| `date-fns` | ~15KB | Many components | Import individual functions |
| `framer-motion` | ~35KB | Installed, unused | Remove or use |
| `idb` | ~8KB | Local DB | Keep |
| `zod` | ~8KB | **UNUSED** | Remove |
| `next-pwa` | ~5KB | PWA config | Keep |

**Unused Dependencies (depcheck):**
- `zod` - Not imported anywhere
- `@tailwindcss/postcss` - Tailwind v4 uses native PostCSS
- `dotenv-cli` - Not used in scripts
- `tailwindcss` (devDep) - v4 doesn't need separate config

### 1.4 Performance Anti-Patterns Identified

#### A. Synchronous setState in useEffect (5 occurrences)
**Files:**
- `src/app/settings/page.tsx:37,40` - Theme & sync loading
- `src/hooks/use-local-db.ts:122,155,186` - Dummy data initialization

**Impact:** Cascading renders, reduced performance, React warning

#### B. Excessive `any` Types (~50 occurrences)
**Files:** `use-local-db.ts`, `budget-visual.tsx`, `bills.tsx`, `critical-expenses-modal.tsx`

**Impact:** No type safety, refactoring risk, poor IDE support

#### C. Missing Memoization
- `critical-expenses-modal.tsx`: `expenseList` recreated every render, `calculateCompoundProjection` called 4x per render
- `budget-visual.tsx`: `COLORS` array, `monthlyExpenses` computation, `budgetData` on every render
- `bills.tsx`: `categoryOptions`, `getDaysUntilDue` in render loop

#### D. Unnecessary Re-renders
- `dashboard-shell.tsx`: Imports unused `formatCurrency`, `profile`, `commitment`, `sidebarOpen`
- Large inline objects (`labels` in settings, `PANEL_CONFIG` in dashboard) recreated every render

---

## Phase 2: Prioritized Optimization Plan

### HIGH IMPACT, LOW EFFORT (Do First)

| # | Task | Files | Effort | Expected Gain |
|---|------|-------|--------|---------------|
| 1 | Remove unused `zod` dependency | `package.json` | 5 min | -8KB bundle |
| 2 | Remove unused devDeps (`@tailwindcss/postcss`, `dotenv-cli`, `tailwindcss`) | `package.json` | 5 min | Cleaner deps |
| 3 | Fix setState in useEffect → use state initializer or useRef | `settings/page.tsx`, `use-local-db.ts` | 30 min | Fix React warning, fewer renders |
| 4 | Remove unused imports (lucide-react, date-fns) | 8 files | 20 min | Tree-shaking |
| 5 | Replace `any` with proper types from `@/lib/types/budget` | 12 files | 60 min | Type safety |

### HIGH IMPACT, MEDIUM EFFORT (Plan)

| # | Task | Files | Effort | Expected Gain |
|---|------|-------|--------|---------------|
| 6 | Add `useMemo`/`useCallback` for expensive computations | `critical-expenses-modal.tsx`, `budget-visual.tsx`, `bills.tsx` | 45 min | Eliminate redundant calculations |
| 7 | Extract large inline objects to module constants | `settings/page.tsx`, `dashboard-shell.tsx` | 20 min | Reduce render overhead |
| 8 | Dynamic import for `recharts` (budget-visual) | `budget-visual.tsx`, `dashboard-shell.tsx` | 30 min | -45KB initial bundle |
| 9 | Fix `useMemo` deps (`expenseList` in critical-expenses-modal) | `critical-expenses-modal.tsx` | 10 min | Correct memoization |

### MEDIUM IMPACT, LOW EFFORT (Do If Time)

| # | Task | Files | Effort | Expected Gain |
|---|------|-------|--------|---------------|
| 10 | Convert date-fns imports to individual functions | 8 files | 30 min | Smaller bundle |
| 11 | Remove unused `framer-motion` or add animations | `package.json`, components | 15 min | Bundle or feature |
| 12 | Optimize lucide-react imports (named only what's used) | 20+ files | 30 min | Tree-shaking |

---

## Phase 3: Detailed Task Breakdown (TDD Format)

### Task 1: Remove Unused Dependencies

**Files:**
- Modify: `package.json`
- Test: `npm test` + `npm run build` (if fixed)

**Step 1: Baseline Test**
```bash
npm test
# Expected: 26 tests pass
```

**Step 2: Implement**
```json
// package.json - Remove from dependencies:
"zod": "^4.3.6",
// Remove from devDependencies:
"@tailwindcss/postcss": "^4.2.2",
"dotenv-cli": "^11.0.0",
"tailwindcss": "^4.2.2",
```

**Step 3: Verify**
```bash
npm test
npm run lint
# Expected: All pass, no zod references
```

**Step 4: Commit**
```bash
git add package.json && git commit -m "perf: remove unused dependencies (zod, @tailwindcss/postcss, dotenv-cli, tailwindcss)"
```

---

### Task 2: Fix setState in useEffect — Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`
- Test: `src/app/settings/page.test.tsx` (create if needed)

**Step 1: Write Failing Test**
```typescript
// Test that theme loads from localStorage without useEffect setState
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPage } from './page';

it('loads theme from localStorage on mount without cascading renders', () => {
  localStorage.setItem('budgetbitch:theme', 'dark');
  const { rerender } = render(<SettingsPage locale="en" />);
  expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
});
```

**Step 2: Run Test - Confirm Fail**
```bash
npm test src/app/settings/page.test.tsx
# Expected: FAIL - test file doesn't exist, or theme not applied correctly
```

**Step 3: Implement Fix**
```tsx
// src/app/settings/page.tsx
// Replace lines 29-42:
const [theme, setTheme] = useState<'amber' | 'dark' | 'gold'>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('budgetbitch:theme') as 'amber' | 'dark' | 'gold') || 'amber';
  }
  return 'amber';
});

const [lastSync, setLastSync] = useState<string | null>(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('budgetbitch:lastSync');
  }
  return null;
});

// Remove the useEffect (lines 34-42) entirely
```

**Step 4: Run Test - Confirm Pass**
```bash
npm test src/app/settings/page.test.tsx
# Expected: PASS
```

**Step 5: Commit**
```bash
git add src/app/settings/page.tsx src/app/settings/page.test.tsx && git commit -m "perf: fix setState in useEffect for theme/lastSync - use lazy initialization"
```

---

### Task 3: Fix setState in useEffect — use-local-db.ts

**Files:**
- Modify: `src/hooks/use-local-db.ts`
- Test: `src/hooks/use-local-db.test.ts` (create)

**Step 1: Write Failing Test**
```typescript
// Test that dummy data doesn't cause cascading renders
import { renderHook, act } from '@testing-library/react';
import { useBudgets } from './use-local-db';

it('initializes budgets without synchronous setState in effect', () => {
  const { result } = renderHook(() => useBudgets());
  // Should not trigger React warning about setState in effect
  expect(result.current.loading).toBe(false); // or true depending on mock
});
```

**Step 2: Implement Fix**
```tsx
// src/hooks/use-local-db.ts - useBudgets, useBills, useSavingsGoals, useNetWorth, etc.
// Replace pattern:
useEffect(() => {
  let mounted = true;
  const dummyData = [...];
  if (mounted) { setData(dummyData); setLoading(false); }
  return () => { mounted = false; };
}, []);

// With lazy initialization + async effect:
const [budgets, setBudgets] = useState<BudgetCategory[]>(() => [
  { category: 'food', monthlyLimit: 10000 },
  { category: 'transport', monthlyLimit: 5000 },
  { category: 'entertainment', monthlyLimit: 3000 },
]);
const [loading, setLoading] = useState(false); // Start false since data is sync

useEffect(() => {
  // If async loading needed later:
  getAllBudgets().then(data => {
    setBudgets(data);
  });
}, []);
```

**Step 3-5:** Same TDD cycle as Task 2.

---

### Task 4: Replace `any` Types with Proper Types

**Files:**
- Modify: `src/hooks/use-local-db.ts`, `src/components/dashboard/panels/budget-visual.tsx`, `src/components/dashboard/panels/bills.tsx`, `src/components/dashboard/critical-expenses-modal.tsx`, `src/components/dashboard/panels/savings-goals.tsx`, `src/components/dashboard/panels/net-worth.tsx`, `src/components/dashboard/panels/emergency-fund.tsx`, `src/components/dashboard/panels/debt-payoff.tsx`, `src/components/dashboard/panels/cash-flow-forecast.tsx`, `src/components/dashboard/panels/subscriptions.tsx`

**Step 1: Write Failing Test (TypeScript Compilation)**
```bash
# Test: tsc --noEmit should pass with strict mode
npx tsc --noEmit
# Expected: Currently fails with "Unexpected any" errors
```

**Step 2: Implement Fix**
```tsx
// budget-visual.tsx - Replace:
const expenses = rawExpenses as any[];
const budgets = rawBudgets as any[];
// With:
const expenses = rawExpenses as ExpenseEntry[];
const budgets = rawBudgets as BudgetCategory[];

// Update filter/map callbacks:
.filter((e: ExpenseEntry) => ...)
.reduce((acc: Record<string, number>, e: ExpenseEntry) => ...)
.find((b: BudgetCategory) => ...)

// critical-expenses-modal.tsx - Add proper types:
const expenseList = Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, typeof CRITICAL_EXPENSES[CriticalExpenseKey]][];

// bills.tsx - Replace:
const handleEdit = (bill: any) => {
// With:
const handleEdit = (bill: Bill) => {
// And:
} as any
// With proper type assertions
```

**Step 3-5:** Same TDD cycle.

---

### Task 5: Add Memoization for Expensive Computations

**Files:**
- Modify: `src/components/dashboard/critical-expenses-modal.tsx`, `src/components/dashboard/panels/budget-visual.tsx`, `src/components/dashboard/panels/bills.tsx`

**Step 1: Write Failing Test**
```typescript
// Test that calculateCompoundProjection is memoized
import { renderHook } from '@testing-library/react';
import { useMemoizedCompoundProjection } from '@/hooks/use-compound-projection';

it('returns cached result for same input', () => {
  const { result, rerender } = renderHook(
    ({ amount }) => useMemoizedCompoundProjection(amount),
    { initialProps: { amount: 1000 } }
  );
  const first = result.current;
  rerender({ amount: 1000 });
  expect(result.current).toBe(first); // Same reference = memoized
});
```

**Step 2: Implement Fix**

**critical-expenses-modal.tsx:**
```tsx
// Move outside component:
const EXPENSE_LIST = Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, ...][];

// Inside component:
const expenseList = useMemo(() => EXPENSE_LIST, []);

const suggestedAmounts = useMemo(() => {
  if (!profile) return {} as Record<CriticalExpenseKey, number>;
  // ... compute
}, [profile]); // expenseList removed (stable reference)

const projections = useMemo(() => {
  const result: Record<CriticalExpenseKey, CompoundProjection> = {} as any;
  for (const [key] of expenseList) {
    result[key] = calculateCompoundProjection({ monthlySavings: suggestedAmounts[key] || 0 });
  }
  return result;
}, [suggestedAmounts, expenseList]);

// Use projections[key] instead of calling calculateCompoundProjection in render
```

**budget-visual.tsx:**
```tsx
const COLORS = useMemo(() => ['#f59e0b', '#10b981', ...], []);

const monthlyExpenses = useMemo(() => 
  expenses
    .filter((e: ExpenseEntry) => format(new Date(e.date), 'yyyy-MM') === currentMonth)
    .reduce((acc: Record<string, number>, e: ExpenseEntry) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {}),
  [expenses, currentMonth]
);

const budgetData = useMemo(() => 
  CATEGORIES.map(...).filter(...),
  [monthlyExpenses, budgets, locale]
);
```

**bills.tsx:**
```tsx
const categoryOptions = useMemo(() => 
  CATEGORIES.map(c => ({ value: c.value, label: locale === 'th' ? c.label.th : c.label.en })),
  [locale]
);

const getDaysUntilDue = useCallback((dueDay: number) => {
  // ... implementation
}, []);

const sortedBills = useMemo(() => 
  [...bills].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay)),
  [bills, getDaysUntilDue]
);
```

**Step 3-5:** Same TDD cycle.

---

### Task 6: Dynamic Import for Recharts

**Files:**
- Modify: `src/components/dashboard/panels/budget-visual.tsx`
- Create: `src/components/dashboard/panels/BudgetVisualChart.tsx` (lazy component)
- Modify: `src/components/dashboard/dashboard-shell.tsx` (import lazy)

**Step 1-2: Implement**
```tsx
// BudgetVisualChart.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// ... chart component

// budget-visual.tsx
import dynamic from 'next/dynamic';
const BudgetVisualChart = dynamic(() => import('./BudgetVisualChart'), {
  loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-xl" />,
  ssr: false
});

// In render:
{showChart && <BudgetVisualChart data={budgetData} locale={locale} />}
```

**Step 3-5:** Verify bundle size reduction.

---

### Task 7: Extract Large Inline Objects

**Files:**
- Modify: `src/app/settings/page.tsx` (labels object → constants file)
- Modify: `src/components/dashboard/dashboard-shell.tsx` (PANEL_CONFIG → constants)

**Step 1-2: Implement**
```tsx
// src/lib/constants/settings-labels.ts
export const SETTINGS_LABELS = {
  th: { ... },
  en: { ... },
} as const;

// src/lib/constants/dashboard-panels.ts
export const PANEL_CONFIG = { ... } as const;
export const PANEL_ORDER = [...] as const;
```

---

### Task 8: Fix useMemo Dependencies

**Files:**
- Modify: `src/components/dashboard/critical-expenses-modal.tsx` (line 29-36)

**Step 1-2: Implement**
```tsx
const expenseList = useMemo(() => 
  Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, typeof CRITICAL_EXPENSES[CriticalExpenseKey]][],
  [] // Empty deps - stable reference
);

const suggestedAmounts = useMemo(() => {
  // ...
}, [profile, expenseList]); // Add expenseList
```

---

### Task 9: Optimize date-fns Imports

**Files:** 8 components using `date-fns`

**Step 1-2: Implement**
```tsx
// Replace:
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

// With individual imports:
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
// Or use date-fns/fp for functional style
```

---

### Task 10: Optimize lucide-react Imports

**Files:** 20+ components

**Step 1-2: Implement**
```tsx
// Replace:
import { Plus, Trash2, Edit, Calendar } from 'lucide-react';

// With (already correct - named imports):
// But ensure no default imports anywhere
// Check: grep -r "from 'lucide-react'" src/ | grep -v "{ "
```

---

## Phase 4: Verification Commands

```bash
# After each task:
npm test                    # All 26 tests pass
npm run lint               # ESLint: 0 errors, reduced warnings
npm run build              # Must fix Node 24 issue first

# Bundle analysis (after all tasks):
npm run build && npx @next/bundle-analyzer
# Or: ANALYZE=true npm run build

# Type checking:
npx tsc --noEmit           # 0 errors
```

---

## Phase 5: Node 24 + Next.js 16 Build Issue

**Problem:** `Bus error (core dumped)` on `next build`

**Likely Causes:**
1. Next.js 16 (canary) incompatible with Node 24
2. SWC/Webpack native module issue

**Recommended Fix:**
```bash
# Option 1: Use Node 22 (LTS)
# Option 2: Downgrade Next.js to 15.x (stable)
# Option 3: Set NODE_OPTIONS=--no-warnings --max-old-space-size=4096
```

**For optimization work:** Can proceed without build by:
- Running tests (`npm test`) - passes
- Running linter (`npm run lint`) - passes with fixes
- Type checking (`npx tsc --noEmit`) - will pass after Task 4

---

## Summary Metrics (Projected After All Tasks)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| ESLint Errors | 56 | 0 | -100% |
| ESLint Warnings | 124 | ~30 | -75% |
| Bundle Size (est.) | ~120KB | ~70KB | -42% |
| TypeScript `any` | ~50 | 0 | -100% |
| Unused Dependencies | 4 | 0 | -100% |
| React Anti-patterns | 5 | 0 | -100% |
| Missing Memoizations | 8 | 0 | -100% |

---

## Handoff to documentation-maintenance

Upon completion, the following documentation updates will be needed:
1. `README.md` - Update build/test commands, Node version requirement
2. `docs/ARCHITECTURE.md` - Document optimized patterns (memoization, lazy init, dynamic imports)
3. `CHANGELOG.md` - Add "Performance" section with improvements
4. `package.json` - Document why certain deps removed

---

*This audit follows the code-optimization skill pipeline: Analyze → Profile → Plan → Refactor (TDD) → Verify → Handoff*