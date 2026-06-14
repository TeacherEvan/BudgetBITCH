# BudgetBITCH Performance Optimization Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Eliminate 56 ESLint errors, 124 warnings, fix React anti-patterns, and reduce bundle size by ~42% through systematic optimization without changing features or visuals.

**Architecture:** Apply targeted refactors following the code-optimization skill pipeline: each task uses TDD (test → fail → implement → pass → commit), focusing on TypeScript strictness, React performance patterns, and dead code elimination. Tests use Vitest + React Testing Library in jsdom environment.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest, React Testing Library, ESLint

---

### Task 1: Remove Unused Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Write the failing test**
```bash
# Baseline: confirm test suite passes
npm test
# Expected: 26 tests pass
```

**Step 2: Run test — confirm it passes**
```bash
npm test
# Expected: PASS
```

**Step 3: Write minimal implementation**
```json
// package.json - Remove from "dependencies":
"zod": "^4.3.6",

// Remove from "devDependencies":
"@tailwindcss/postcss": "^4.2.2",
"dotenv-cli": "^11.0.0",
"tailwindcss": "^4.2.2",
```

**Step 4: Run test — confirm it passes**
```bash
npm test
npm run lint
# Expected: All 26 tests pass, no zod references in lint output
```

**Step 5: Commit**
```bash
git add package.json package-lock.json && git commit -m "perf: remove unused dependencies (zod, @tailwindcss/postcss, dotenv-cli, tailwindcss)"
```

---

### Task 2: Fix setState in useEffect — Settings Page (Theme & LastSync)

**Files:**
- Modify: `src/app/settings/page.tsx`

**Step 1: Write the failing test**
```typescript
// src/app/settings/page.test.tsx
import { render, screen, act } from '@testing-library/react';
import { SettingsPage } from './page';

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('loads theme from localStorage on mount without cascading renders', () => {
    localStorage.setItem('budgetbitch:theme', 'dark');
    
    const { container } = render(<SettingsPage locale="en" />);
    
    // Theme should be applied to documentElement immediately
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-amber')).toBe(false);
  });

  it('loads lastSync from localStorage on mount', () => {
    const timestamp = '2026-06-13T10:00:00.000Z';
    localStorage.setItem('budgetbitch:lastSync', timestamp);
    
    const { container } = render(<SettingsPage locale="en" />);
    
    // Should display the last sync time
    expect(screen.getByText(/Never synced/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Jun 13/i)).toBeInTheDocument(); // formatted date
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm test src/app/settings/page.test.tsx
# Expected: FAIL - theme not applied on mount, or setState in effect warning
```

**Step 3: Write minimal implementation**
```tsx
// src/app/settings/page.tsx - Replace lines 29-42:

// BEFORE (lines 29-42):
const [theme, setTheme] = useState<'amber' | 'dark' | 'gold'>('amber');
const [lastSync, setLastSync] = useState<string | null>(null);

useEffect(() => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('budgetbitch:theme') as 'amber' | 'dark' | 'gold' | null;
    if (savedTheme) setTheme(savedTheme);
    
    const savedSync = localStorage.getItem('budgetbitch:lastSync');
    if (savedSync) setLastSync(savedSync);
  }
}, []);

// AFTER - lazy initialization:
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

// Remove the entire useEffect block (lines 34-42)
```

**Step 4: Run test — confirm it passes**
```bash
npm test src/app/settings/page.test.tsx
# Expected: PASS
```

**Step 5: Run lint to confirm no React warnings**
```bash
npm run lint 2>&1 | grep -A5 "setState.*effect"
# Expected: No "react-hooks/set-state-in-effect" errors for settings page
```

**Step 6: Commit**
```bash
git add src/app/settings/page.tsx src/app/settings/page.test.tsx && git commit -m "perf: fix setState in useEffect for theme/lastSync - use lazy initialization"
```

---

### Task 3: Fix setState in useEffect — use-local-db Hooks (5 occurrences)

**Files:**
- Modify: `src/hooks/use-local-db.ts`
- Create: `src/hooks/use-local-db.test.ts`

**Step 1: Write the failing test**
```typescript
// src/hooks/use-local-db.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudgets, useBills, useSavingsGoals, useNetWorth, useSubscriptions, useEmergencyFund, useDebtPayoff, useCashFlowForecast } from './use-local-db';

describe('use-local-db hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('useBudgets initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useBudgets());
    
    // Should not trigger React warning about setState in effect
    // Loading should be false immediately since we use lazy init with dummy data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Array.isArray(result.current.budgets)).toBe(true);
    expect(result.current.budgets.length).toBeGreaterThan(0);
  });

  it('useBills initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useBills());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Array.isArray(result.current.bills)).toBe(true);
    expect(result.current.bills.length).toBeGreaterThan(0);
  });

  it('useSavingsGoals initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useSavingsGoals());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Array.isArray(result.current.goals)).toBe(true);
    expect(result.current.goals.length).toBeGreaterThan(0);
  });

  it('useNetWorth initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useNetWorth());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.snapshot).toBeDefined();
  });

  it('useSubscriptions initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useSubscriptions());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Array.isArray(result.current.subscriptions)).toBe(true);
  });

  it('useEmergencyFund initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useEmergencyFund());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.fund).toBeDefined();
    expect(typeof result.current.fund.targetAmount).toBe('number');
  });

  it('useDebtPayoff initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useDebtPayoff());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(Array.isArray(result.current.debts)).toBe(true);
  });

  it('useCashFlowForecast initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useCashFlowForecast());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.forecast).toBeDefined();
    expect(typeof result.current.forecast.thirtyDays).toBe('number');
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm test src/hooks/use-local-db.test.ts
# Expected: FAIL - hooks use setState in useEffect, causing warnings and potential loading issues
```

**Step 3: Write minimal implementation**
```tsx
// src/hooks/use-local-db.ts - Replace ALL hooks with lazy initialization pattern

// BEFORE (useBudgets - lines 111-125):
export function useBudgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const dummyBudgets = [
      { category: 'food', monthlyLimit: 10000 },
      { category: 'transport', monthlyLimit: 5000 },
      { category: 'entertainment', monthlyLimit: 3000 },
    ];
    setBudgets(dummyBudgets);
    setLoading(false);
    return () => { mounted = false; };
  }, []);
  // ... rest
}

// AFTER:
export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => [
    { category: 'food', monthlyLimit: 10000 },
    { category: 'transport', monthlyLimit: 5000 },
    { category: 'entertainment', monthlyLimit: 3000 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only async operations here if needed (e.g., getAllBudgets())
    getAllBudgets().then(data => {
      if (data.length > 0) setBudgets(data);
    });
  }, []);

  // ... rest unchanged (save, get, return)
}

// Apply SAME PATTERN to:
// useBills (lines 145-158) - dummyBills array
// useSavingsGoals (lines 176-189) - dummyGoals array
// useNetWorth (lines 232-245) - timeout + snapshot
// useSubscriptions (lines 258-274) - timeout + empty array
// useEmergencyFund (lines 277-293) - timeout + fund object
// useDebtPayoff (lines 296-310) - timeout + empty array (keep for consistency)
// useCashFlowForecast (lines 328-343) - timeout + forecast object

// For hooks with timeout-based dummy data, use lazy init with the final dummy value:
const [goals, setGoals] = useState<SavingsGoal[]>(() => [
  { id: '1', name: 'Emergency Fund', targetAmount: 50000, currentAmount: 15000, category: 'emergency' },
  { id: '2', name: 'Japan Trip', targetAmount: 80000, currentAmount: 20000, category: 'vacation' },
]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  // Async load if needed
  getAllSavingsGoals().then(data => {
    if (data.length > 0) setGoals(data);
  });
}, []);
```

**Step 4: Run test — confirm it passes**
```bash
npm test src/hooks/use-local-db.test.ts
# Expected: PASS
```

**Step 5: Run lint to confirm no React warnings**
```bash
npm run lint 2>&1 | grep -A5 "react-hooks/set-state-in-effect"
# Expected: No errors for use-local-db.ts
```

**Step 6: Commit**
```bash
git add src/hooks/use-local-db.ts src/hooks/use-local-db.test.ts && git commit -m "perf: fix setState in useEffect for all local-db hooks - use lazy initialization"
```

---

### Task 4: Replace `any` Types with Proper Types

**Files:**
- Modify: `src/hooks/use-local-db.ts`
- Modify: `src/components/dashboard/panels/budget-visual.tsx`
- Modify: `src/components/dashboard/panels/bills.tsx`
- Modify: `src/components/dashboard/critical-expenses-modal.tsx`
- Modify: `src/components/dashboard/panels/savings-goals.tsx`
- Modify: `src/components/dashboard/panels/net-worth.tsx`
- Modify: `src/components/dashboard/panels/emergency-fund.tsx`
- Modify: `src/components/dashboard/panels/debt-payoff.tsx`
- Modify: `src/components/dashboard/panels/cash-flow-forecast.tsx`
- Modify: `src/components/dashboard/panels/subscriptions.tsx`
- Modify: `src/components/dashboard/panels/expense-tracker.tsx`

**Step 1: Write the failing test**
```bash
# TypeScript compilation should pass with strict mode
npx tsc --noEmit
# Expected: Currently fails with ~50 "Unexpected any" errors
```

**Step 2: Run test — confirm it fails**
```bash
npx tsc --noEmit 2>&1 | grep -c "no-explicit-any"
# Expected: > 0
```

**Step 3: Write minimal implementation**

**A. `use-local-db.ts` - Replace all `any` with proper types:**
```tsx
// Line 46: const [profile, setProfile] = useState<WizardProfile | null>(null);
// Line 75: const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
// Line 89: const add = useCallback(async (expense: ExpenseEntry) => {...}
// Line 94: const update = useCallback(async (expense: ExpenseEntry) => {...}
// Line 99: const remove = useCallback(async (id: string) => {...}
// Line 103: const getByCategory = useCallback(async (category: ExpenseCategory) => {...}
// Line 112: const [budgets, setBudgets] = useState<BudgetCategory[]>(...)
// Line 137: const get = useCallback(async (category: ExpenseCategory) => {...}
// Line 146: const [bills, setBills] = useState<Bill[]>([]);
// Line 160: const add = useCallback(async (bill: Bill) => {...}
// Line 164: const update = useCallback(async (bill: Bill) => {...}
// Line 168: const remove = useCallback(async (id: string) => {...}
// Line 177: const [goals, setGoals] = useState<SavingsGoal[]>(...)
// Line 191: const add = useCallback(async (goal: SavingsGoal) => {...}
// Line 195: const update = useCallback(async (goal: SavingsGoal) => {...}
// Line 199: const remove = useCallback(async (id: string) => {...}
// Line 208: const [commitment, setCommitment] = useState<CriticalExpenseCommitment | null>(null);
// Line 224: const save = useCallback(async (newCommitment: CriticalExpenseCommitment) => {...}
// Line 233: const [snapshot, setSnapshot] = useState<NetWorthSnapshot | null>(null);
// Line 247: const addAsset = useCallback(async (asset: NetWorthSnapshot['assets'][0]) => {}, []);
// Line 248: const updateAsset = useCallback(async (asset: NetWorthSnapshot['assets'][0]) => {}, []);
// Line 250: const addLiability = useCallback(async (liability: NetWorthSnapshot['liabilities'][0]) => {}, []);
// Line 251: const updateLiability = useCallback(async (liability: NetWorthSnapshot['liabilities'][0]) => {}, []);
// Line 258: const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); // Need Subscription type
// Line 278: const [fund, setFund] = useState<{ targetAmount: number; currentAmount: number }>({ targetAmount: 0, currentAmount: 0 });
// Line 297: const [debts, setDebts] = useState<Debt[]>([]);
// Line 311: const add = useCallback(async (debt: Debt) => {...}
// Line 316: const update = useCallback(async (debt: Debt) => {...}
// Line 320: const remove = useCallback(async (id: string) => {...}
// Line 329: const [forecast, setForecast] = useState<{ thirtyDays: number; sixtyDays: number; ninetyDays: number }>({ thirtyDays: 0, sixtyDays: 0, ninetyDays: 0 });
```

**B. `budget-visual.tsx` - Add proper types:**
```tsx
// Line 30-34: Replace:
const { expenses: rawExpenses } = useExpenses();
const { budgets: rawBudgets } = useBudgets();
const expenses = rawExpenses as any[];
const budgets = rawBudgets as any[];

// With:
import type { ExpenseEntry, BudgetCategory } from '@/lib/types/budget';
const { expenses } = useExpenses(); // Already typed
const { budgets } = useBudgets();   // Already typed
// Remove the `as any[]` casts entirely

// Line 39-44: Add types to callbacks:
const monthlyExpenses = expenses
  .filter((e: ExpenseEntry) => format(new Date(e.date), 'yyyy-MM') === currentMonth)
  .reduce((acc: Record<string, number>, e: ExpenseEntry) => {...}, {});

// Line 46-55: Add type to map:
const budgetData = CATEGORIES.map((cat) => {...}).filter((d) => d.budget > 0 || d.spent > 0);
// budgetData inferred, but add explicit: = [] as { category: string; spent: number; budget: number; pct: number }[];
```

**C. `bills.tsx` - Add proper types:**
```tsx
// Line 51: const bill: Bill = {...} as Bill; // Or proper construction
// Line 66: const handleEdit = (bill: Bill) => {...}
// Line 79: const handleDelete = (id: string) => {...}
// Line 202: {sortedBills.map((bill: Bill) => (...))}
```

**D. `critical-expenses-modal.tsx` - Add proper types:**
```tsx
// Line 24-25: const [selectedExpense, setSelectedExpense] = useState<CriticalExpenseKey | null>(null);
// Line 27: const expenseList = useMemo(() => Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, ...][], []);
// Line 29-36: suggestedAmounts - add proper return type
// Line 161: const projection = calculateCompoundProjection({ monthlySavings: suggested }); // Already typed
// Line 247: const projection = calculateCompoundProjection({ monthlySavings: Number(customAmount) }); // Already typed
```

**E. Other panel files - similar fixes:**
- Import types from `@/lib/types/budget`
- Replace `any` with specific types: `ExpenseEntry`, `BudgetCategory`, `Bill`, `SavingsGoal`, `NetWorthSnapshot`, `Debt`, `CriticalExpenseCommitment`, `Subscription` (need to add)

**Step 4: Run test — confirm it passes**
```bash
npx tsc --noEmit
# Expected: 0 "no-explicit-any" errors
```

**Step 5: Run full test suite**
```bash
npm test
# Expected: All 26+ new tests pass
```

**Step 6: Commit**
```bash
git add src/hooks/use-local-db.ts src/components/dashboard/panels/*.tsx src/components/dashboard/critical-expenses-modal.tsx src/hooks/use-local-db.test.ts && git commit -m "perf: replace all 'any' types with proper types from @/lib/types/budget"
```

---

### Task 5: Add Memoization for Expensive Computations

**Files:**
- Modify: `src/components/dashboard/critical-expenses-modal.tsx`
- Modify: `src/components/dashboard/panels/budget-visual.tsx`
- Modify: `src/components/dashboard/panels/bills.tsx`

**Step 1: Write the failing test**
```typescript
// src/components/dashboard/critical-expenses-modal.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useMemoizedCompoundProjection } from '@/hooks/use-compound-projection';

describe('useMemoizedCompoundProjection', () => {
  it('returns cached result for same input', () => {
    const { result, rerender } = renderHook(
      ({ amount }) => useMemoizedCompoundProjection(amount),
      { initialProps: { amount: 1000 } }
    );
    
    const first = result.current;
    rerender({ amount: 1000 });
    
    expect(result.current).toBe(first); // Same reference = memoized
  });

  it('returns new result for different input', () => {
    const { result, rerender } = renderHook(
      ({ amount }) => useMemoizedCompoundProjection(amount),
      { initialProps: { amount: 1000 } }
    );
    
    const first = result.current;
    rerender({ amount: 2000 });
    
    expect(result.current).not.toBe(first);
  });
});

// src/components/dashboard/budget-visual.test.tsx
import { renderHook } from '@testing-library/react';
import { useBudgetComputations } from '@/hooks/use-budget-computations';

describe('useBudgetComputations', () => {
  it('memoizes monthlyExpenses computation', () => {
    const expenses = [
      { id: '1', date: '2026-06-01', category: 'food', amount: 100 },
      { id: '2', date: '2026-06-15', category: 'transport', amount: 50 },
    ];
    
    const { result, rerender } = renderHook(
      ({ expenses }) => useBudgetComputations(expenses),
      { initialProps: { expenses } }
    );
    
    const first = result.current.monthlyExpenses;
    rerender({ expenses });
    
    expect(result.current.monthlyExpenses).toBe(first);
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm test src/components/dashboard/critical-expenses-modal.test.tsx src/components/dashboard/budget-visual.test.tsx
# Expected: FAIL - hooks don't exist yet
```

**Step 3: Write minimal implementation**

**A. Create `src/hooks/use-compound-projection.ts`:**
```tsx
// src/hooks/use-compound-projection.ts
import { useMemo } from 'react';
import { calculateCompoundProjection, type CompoundCalculatorOptions } from '@/lib/utils/compound-calculator';

interface ProjectionCache {
  [key: string]: CompoundCalculatorOptions['monthlySavings'];
}

export function useCompoundProjection(monthlySavings: number) {
  return useMemo(() => calculateCompoundProjection({ monthlySavings }), [monthlySavings]);
}

export function useMultipleProjections(amounts: Record<string, number>) {
  return useMemo(() => {
    const result: Record<string, ReturnType<typeof calculateCompoundProjection>> = {};
    for (const [key, amount] of Object.entries(amounts)) {
      result[key] = calculateCompoundProjection({ monthlySavings: amount });
    }
    return result;
  }, [amounts]);
}
```

**B. Update `critical-expenses-modal.tsx`:**
```tsx
// Add imports:
import { useCompoundProjection, useMultipleProjections } from '@/hooks/use-compound-projection';

// Replace lines 27-36 (expenseList + suggestedAmounts):
const expenseList = useMemo(() => 
  Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, typeof CRITICAL_EXPENSES[CriticalExpenseKey]][],
  [] // Stable reference
);

const suggestedAmounts = useMemo(() => {
  if (!profile) return {} as Record<CriticalExpenseKey, number>;
  const suggestions: Record<CriticalExpenseKey, number> = {} as Record<CriticalExpenseKey, number>;
  for (const [key] of expenseList) {
    suggestions[key] = getSuggestedCriticalExpenseCost(key, profile.answers);
  }
  return suggestions;
}, [profile, expenseList]);

// Replace lines 161, 247, 257-277 with useMultipleProjections:
const projections = useMultipleProjections(suggestedAmounts);

// In render, use projections[key] instead of calculateCompoundProjection(...)
```

**C. Create `src/hooks/use-budget-computations.ts`:**
```tsx
// src/hooks/use-budget-computations.ts
import { useMemo } from 'react';
import { format } from 'date-fns';
import type { ExpenseEntry, BudgetCategory } from '@/lib/types/budget';

export function useBudgetComputations(expenses: ExpenseEntry[], budgets: BudgetCategory[], locale: 'th' | 'en') {
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  const monthlyExpenses = useMemo(() => 
    expenses
      .filter((e) => format(new Date(e.date), 'yyyy-MM') === currentMonth)
      .reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {}),
    [expenses, currentMonth]
  );

  const budgetData = useMemo(() => {
    const CATEGORIES = [
      { value: 'housing', label: { th: 'ที่อยู่อาศัย', en: 'Housing' } },
      // ... rest from component
    ];
    return CATEGORIES.map((cat) => {
      const spent = monthlyExpenses[cat.value] || 0;
      const budget = budgets.find((b) => b.category === cat.value)?.monthlyLimit || 0;
      return {
        category: cat.label[locale === 'th' ? 'th' : 'en'],
        spent,
        budget,
        pct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
      };
    }).filter((d) => d.budget > 0 || d.spent > 0);
  }, [monthlyExpenses, budgets, locale]);

  return { monthlyExpenses, budgetData, currentMonth };
}
```

**D. Update `bills.tsx` - Add useMemo/useCallback:**
```tsx
// Inside Bills component:

const categoryOptions = useMemo(() => 
  CATEGORIES.map(c => ({ value: c.value, label: locale === 'th' ? c.label.th : c.label.en })),
  [locale]
);

const getDaysUntilDue = useCallback((dueDay: number) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const dueDate = new Date(currentYear, currentMonth, dueDay);
  if (dueDate < today) {
    dueDate.setMonth(currentMonth + 1);
  }
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}, []);

const sortedBills = useMemo(() => 
  [...bills].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay)),
  [bills, getDaysUntilDue]
);
```

**Step 4: Run test — confirm it passes**
```bash
npm test src/components/dashboard/critical-expenses-modal.test.tsx src/components/dashboard/budget-visual.test.tsx
# Expected: PASS
```

**Step 5: Run full test suite + lint**
```bash
npm test
npm run lint
# Expected: All pass, no exhaustive-deps warnings
```

**Step 6: Commit**
```bash
git add src/hooks/use-compound-projection.ts src/hooks/use-budget-computations.ts src/components/dashboard/critical-expenses-modal.tsx src/components/dashboard/panels/budget-visual.tsx src/components/dashboard/panels/bills.tsx src/components/dashboard/*.test.tsx && git commit -m "perf: add memoization for expensive computations (compound projections, budget data, bill sorting)"
```

---

### Task 6: Dynamic Import for Recharts (Budget Visual Chart)

**Files:**
- Create: `src/components/dashboard/panels/BudgetVisualChart.tsx`
- Modify: `src/components/dashboard/panels/budget-visual.tsx`

**Step 1: Write the failing test**
```typescript
// src/components/dashboard/panels/BudgetVisualChart.test.tsx
import { render } from '@testing-library/react';
import dynamic from 'next/dynamic';
import { BudgetVisualChart } from './BudgetVisualChart';

describe('BudgetVisualChart', () => {
  it('renders chart with data', () => {
    const data = [
      { category: 'Food', spent: 5000, budget: 10000, pct: 50 },
      { category: 'Transport', spent: 3000, budget: 5000, pct: 60 },
    ];
    
    const { container } = render(<BudgetVisualChart data={data} locale="en" />);
    
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

// src/components/dashboard/panels/budget-visual.test.tsx
import { render, waitFor } from '@testing-library/react';
import { BudgetVisual } from './budget-visual';

describe('BudgetVisual with dynamic chart', () => {
  it('loads chart lazily', async () => {
    const { container } = render(<BudgetVisual locale="en" />);
    
    // Initially shows loading state
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    
    // After load, shows chart
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm test src/components/dashboard/panels/BudgetVisualChart.test.tsx src/components/dashboard/panels/budget-visual.test.tsx
# Expected: FAIL - components don't exist
```

**Step 3: Write minimal implementation**

**A. Create `BudgetVisualChart.tsx`:**
```tsx
// src/components/dashboard/panels/BudgetVisualChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BudgetVisualChartProps {
  data: { category: string; spent: number; budget: number; pct: number }[];
  locale: 'th' | 'en';
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export function BudgetVisualChart({ data, locale }: BudgetVisualChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis type="number" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }} />
          <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
            {data.map((_, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**B. Update `budget-visual.tsx`:**
```tsx
// Remove recharts imports from top
// Add dynamic import:
import dynamic from 'next/dynamic';

const BudgetVisualChart = dynamic(() => import('./BudgetVisualChart'), {
  loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-xl" />,
  ssr: false
});

// In render, replace the BarChart section (lines 90-106):
{showChart && data.length > 0 && <BudgetVisualChart data={budgetData} locale={locale} />}

// Add showChart state if needed, or just condition on budgetData.length > 0
```

**Step 4: Run test — confirm it passes**
```bash
npm test src/components/dashboard/panels/BudgetVisualChart.test.tsx src/components/dashboard/panels/budget-visual.test.tsx
# Expected: PASS
```

**Step 5: Verify bundle reduction**
```bash
# After all tasks, run bundle analyzer
npm run build && npx @next/bundle-analyzer
# Expected: recharts not in initial bundle
```

**Step 6: Commit**
```bash
git add src/components/dashboard/panels/BudgetVisualChart.tsx src/components/dashboard/panels/budget-visual.tsx src/components/dashboard/panels/*.test.tsx && git commit -m "perf: dynamic import recharts for budget visual chart (-45KB initial bundle)"
```

---

### Task 7: Extract Large Inline Objects to Module Constants

**Files:**
- Create: `src/lib/constants/dashboard-panels.ts`
- Create: `src/lib/constants/settings-labels.ts`
- Modify: `src/components/dashboard/dashboard-shell.tsx`
- Modify: `src/app/settings/page.tsx`

**Step 1: Write the failing test**
```typescript
// src/lib/constants/dashboard-panels.test.ts
import { PANEL_CONFIG, PANEL_ORDER } from '@/lib/constants/dashboard-panels';

describe('dashboard-panels constants', () => {
  it('exports PANEL_CONFIG with all panels', () => {
    expect(Object.keys(PANEL_CONFIG)).toEqual([
      'expenses', 'budget', 'bills', 'goals', 'netWorth', 'subscriptions', 'emergency', 'debt', 'forecast'
    ]);
    expect(PANEL_CONFIG.expenses.label.th).toBe('ค่าใช้จ่าย');
    expect(PANEL_CONFIG.expenses.label.en).toBe('Expenses');
  });

  it('exports PANEL_ORDER array', () => {
    expect(PANEL_ORDER).toEqual([
      'expenses', 'budget', 'bills', 'goals', 'netWorth', 'subscriptions', 'emergency', 'debt', 'forecast'
    ]);
  });
});

// src/lib/constants/settings-labels.test.ts
import { SETTINGS_LABELS } from '@/lib/constants/settings-labels';

describe('settings-labels constants', () => {
  it('exports th and en labels', () => {
    expect(SETTINGS_LABELS.th.title).toBe('ตั้งค่า');
    expect(SETTINGS_LABELS.en.title).toBe('Settings');
    expect(SETTINGS_LABELS.th.locale).toBe('ภาษา');
    expect(SETTINGS_LABELS.en.locale).toBe('Language');
    // ... check all keys exist
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm test src/lib/constants/dashboard-panels.test.ts src/lib/constants/settings-labels.test.ts
# Expected: FAIL - files don't exist
```

**Step 3: Write minimal implementation**

**A. Create `src/lib/constants/dashboard-panels.ts`:**
```ts
// src/lib/constants/dashboard-panels.ts

export const PANEL_ORDER = ['expenses', 'budget', 'bills', 'goals', 'netWorth', 'subscriptions', 'emergency', 'debt', 'forecast'] as const;

export type PanelKey = typeof PANEL_ORDER[number];

export const PANEL_CONFIG: Record<PanelKey, { label: { th: string; en: string }; icon: string }> = {
  expenses: { label: { th: 'ค่าใช้จ่าย', en: 'Expenses' }, icon: '💸' },
  budget: { label: { th: 'งบประมาณ', en: 'Budget' }, icon: '📊' },
  bills: { label: { th: 'บิล/บิลล์', en: 'Bills' }, icon: '📋' },
  goals: { label: { th: 'เป้าหมาย', en: 'Goals' }, icon: '🎯' },
  netWorth: { label: { th: 'มูลค่าสุทธิ', en: 'Net Worth' }, icon: '💰' },
  subscriptions: { label: { th: 'สมัครสมาชิก', en: 'Subscriptions' }, icon: '📺' },
  emergency: { label: { th: 'เงินสำรอง', en: 'Emergency' }, icon: '🛡️' },
  debt: { label: { th: 'หนี้สิน', en: 'Debt' }, icon: '📉' },
  forecast: { label: { th: 'พยากรณ์', en: 'Forecast' }, icon: '🔮' },
};
```

**B. Create `src/lib/constants/settings-labels.ts`:**
```ts
// src/lib/constants/settings-labels.ts

export const SETTINGS_LABELS = {
  th: {
    title: 'ตั้งค่า',
    sections: {
      general: 'ทั่วไป',
      preferences: 'การตั้งค่าส่วนตัว',
      data: 'ข้อมูล',
      privacy: 'ความเป็นส่วนตัว',
    },
    locale: 'ภาษา',
    voice: 'เสียงช่วยแนะนำ',
    voiceRate: 'ความเร็วพูด',
    voicePitch: 'ระดับเสียง',
    theme: 'ธีมสี',
    themeAmber: 'อำพรises (ค่าเริ่มต้น)',
    themeDark: 'ดำเข้ม',
    themeGold: 'ทองวัดไทย',
    resetData: 'ล้างข้อมูลทั้งหมด',
    exportData: 'ส่งออกข้อมูล (JSON)',
    importData: 'นำเข้าข้อมูล (JSON)',
    lastSync: 'ซิงค์ล่าสุด',
    syncNow: 'ซิงค์ตอนนี้',
    privacyDisclaimer: 'ข้อความยอมรับความเป็นส่วนตัว',
    criticalExpense: 'ค่าใช้จ่ายที่ต้องลด',
    commitStatus: 'สถานะการยอมรับ',
    committed: 'ยอมรับแล้ว',
    notCommitted: 'ยังไม่ได้เลือก',
  },
  en: {
    title: 'Settings',
    sections: {
      general: 'General',
      preferences: 'Preferences',
      data: 'Data',
      privacy: 'Privacy',
    },
    locale: 'Language',
    voice: 'Voice Guidance',
    voiceRate: 'Speech Rate',
    voicePitch: 'Pitch',
    theme: 'Theme',
    themeAmber: 'Amber (Default)',
    themeDark: 'Dark',
    themeGold: 'Thai Temple Gold',
    resetData: 'Reset All Data',
    exportData: 'Export Data (JSON)',
    importData: 'Import Data (JSON)',
    lastSync: 'Last Sync',
    syncNow: 'Sync Now',
    privacyDisclaimer: 'Privacy Disclaimer',
    criticalExpense: 'Cut One Expense',
    commitStatus: 'Commitment Status',
    committed: 'Committed',
    notCommitted: 'Not Selected',
  },
} as const;
```

**C. Update `dashboard-shell.tsx`:**
```tsx
// Remove PANEL_CONFIG and PANEL_ORDER from component
import { PANEL_CONFIG, PANEL_ORDER, type PanelKey } from '@/lib/constants/dashboard-panels';
```

**D. Update `settings/page.tsx`:**
```tsx
// Remove labels object, import:
import { SETTINGS_LABELS } from '@/lib/constants/settings-labels';

// Replace: const l = labels[locale];
// With: const l = SETTINGS_LABELS[locale];
```

**Step 4: Run test — confirm it passes**
```bash
npm test src/lib/constants/dashboard-panels.test.ts src/lib/constants/settings-labels.test.ts
# Expected: PASS
```

**Step 5: Run full test suite**
```bash
npm test
# Expected: All pass
```

**Step 6: Commit**
```bash
git add src/lib/constants/dashboard-panels.ts src/lib/constants/settings-labels.ts src/components/dashboard/dashboard-shell.tsx src/app/settings/page.tsx src/lib/constants/*.test.ts && git commit -m "perf: extract large inline objects to module constants (dashboard panels, settings labels)"
```

---

### Task 8: Fix useMemo Dependencies (critical-expenses-modal)

**Files:**
- Modify: `src/components/dashboard/critical-expenses-modal.tsx`

**Step 1: Write the failing test**
```typescript
// src/components/dashboard/critical-expenses-modal.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useExpenseList } from '@/hooks/use-expense-list';

describe('useExpenseList', () => {
  it('returns stable reference for expenseList', () => {
    const { result, rerender } = renderHook(() => useExpenseList());
    
    const first = result.current;
    rerender();
    
    expect(result.current).toBe(first); // Stable reference
  });
});
```

**Step 2: Run test — confirm it fails**
```bash
npm test src/components/dashboard/critical-expenses-modal.test.tsx
# Expected: FAIL - hook doesn't exist, or expenseList recreated each render
```

**Step 3: Write minimal implementation**

**A. Create `src/hooks/use-expense-list.ts`:**
```tsx
// src/hooks/use-expense-list.ts
import { useMemo } from 'react';
import { CRITICAL_EXPENSES, type CriticalExpenseKey } from '@/lib/types/budget';

export function useExpenseList() {
  return useMemo(() => 
    Object.entries(CRITICAL_EXPENSES) as [CriticalExpenseKey, typeof CRITICAL_EXPENSES[CriticalExpenseKey]][],
    [] // Empty deps - CRITICAL_EXPENSES is constant
  );
}

export function useSuggestedAmounts(profile: import('@/lib/types/budget').WizardProfile | null, expenseList: ReturnType<typeof useExpenseList>) {
  return useMemo(() => {
    if (!profile) return {} as Record<CriticalExpenseKey, number>;
    const suggestions: Record<CriticalExpenseKey, number> = {} as Record<CriticalExpenseKey, number>;
    for (const [key] of expenseList) {
      suggestions[key] = getSuggestedCriticalExpenseCost(key, profile.answers);
    }
    return suggestions;
  }, [profile, expenseList]); // expenseList now stable
}
```

**B. Update `critical-expenses-modal.tsx`:**
```tsx
import { useExpenseList, useSuggestedAmounts } from '@/hooks/use-expense-list';

// Remove local expenseList and suggestedAmounts
const expenseList = useExpenseList();
const suggestedAmounts = useSuggestedAmounts(profile, expenseList);
```

**Step 4: Run test — confirm it passes**
```bash
npm test src/components/dashboard/critical-expenses-modal.test.tsx
# Expected: PASS
```

**Step 5: Run lint to confirm no exhaustive-deps warnings**
```bash
npm run lint 2>&1 | grep "exhaustive-deps"
# Expected: No warnings for critical-expenses-modal
```

**Step 6: Commit**
```bash
git add src/hooks/use-expense-list.ts src/components/dashboard/critical-expenses-modal.tsx && git commit -m "perf: fix useMemo deps for expenseList - stable reference"
```

---

### Task 9: Optimize date-fns Imports (Tree-Shaking)

**Files:**
- Modify: `src/components/dashboard/alerts-sidebar.tsx`
- Modify: `src/components/dashboard/panels/savings-goals.tsx`
- Modify: `src/components/dashboard/panels/bills.tsx`
- Modify: `src/components/dashboard/panels/budget-visual.tsx`
- Modify: `src/components/dashboard/panels/cash-flow-forecast.tsx`
- Modify: `src/components/dashboard/panels/emergency-fund.tsx`
- Modify: `src/app/settings/page.tsx`

**Step 1: Write the failing test**
```bash
# Bundle analysis - check date-fns size
npm run build 2>&1 | grep -i "date-fns" || echo "Check bundle analyzer"
# Expected: date-fns appears in bundle
```

**Step 2: Write minimal implementation**

**Replace bulk imports with individual function imports:**

```tsx
// BEFORE:
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

// AFTER:
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import { th } from 'date-fns/locale'; // locale is already tree-shakable

// Apply to all 7 files
```

**Step 3: Run test — confirm it passes**
```bash
npm test
npm run lint
# Expected: All pass
```

**Step 4: Commit**
```bash
git add src/components/dashboard/alerts-sidebar.tsx src/components/dashboard/panels/savings-goals.tsx src/components/dashboard/panels/bills.tsx src/components/dashboard/panels/budget-visual.tsx src/components/dashboard/panels/cash-flow-forecast.tsx src/components/dashboard/panels/emergency-fund.tsx src/app/settings/page.tsx && git commit -m "perf: optimize date-fns imports for tree-shaking"
```

---

### Task 10: Optimize lucide-react Imports

**Files:**
- 20+ component files

**Step 1: Write the failing test**
```bash
# Check for any default imports
grep -r "from 'lucide-react'" src/ | grep -v "{ "
# Expected: No output (all named imports)
```

**Step 2: Write minimal implementation**

**Ensure all imports are named (already correct based on earlier grep):**
```tsx
// All files already use: import { Icon1, Icon2 } from 'lucide-react';
// No changes needed if grep shows no default imports
```

**Step 3: Run test — confirm it passes**
```bash
npm test
npm run lint
# Expected: All pass
```

**Step 4: Commit**
```bash
# Only if changes made
git add src/components/**/*.tsx && git commit -m "perf: verify lucide-react named imports for tree-shaking"
```

---

## Execution Summary

| Task | Description | Est. Time | Dependencies |
|------|-------------|-----------|--------------|
| 1 | Remove unused deps | 10 min | None |
| 2 | Fix setState in useEffect (settings) | 30 min | None |
| 3 | Fix setState in useEffect (hooks) | 40 min | None |
| 4 | Replace `any` types | 60 min | Tasks 2,3 |
| 5 | Add memoization hooks | 45 min | Task 4 |
| 6 | Dynamic import recharts | 30 min | Task 4 |
| 7 | Extract constants | 20 min | None |
| 8 | Fix useMemo deps | 15 min | Task 5 |
| 9 | Optimize date-fns imports | 20 min | None |
| 10 | Verify lucide-react imports | 10 min | None |

**Total: ~4.5 hours**

---

## Verification Commands (Run After All Tasks)

```bash
# 1. All tests pass
npm test

# 2. Lint clean (0 errors, minimal warnings)
npm run lint

# 3. TypeScript strict compilation
npx tsc --noEmit

# 4. Bundle analysis (compare before/after)
npm run build && npx @next/bundle-analyzer

# 5. Verify no visual/functionality regression
# Manual QA on key flows
```

---

## Handoff to documentation-maintenance

Upon completion, the following docs need updates:
1. `README.md` - Update build/test commands, Node version note
2. `docs/ARCHITECTURE.md` - Document optimized patterns (lazy init, memoization, dynamic imports)
3. `CHANGELOG.md` - Add "Performance" section with metrics
4. `package.json` - Document removed deps rationale

*Plan saved to `docs/plans/2026-06-13-performance-optimization.md`. Ready for subagent-driven execution.*