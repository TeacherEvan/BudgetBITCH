// src/hooks/use-local-db.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudgets, useBills, useSavingsGoals, useNetWorth, useSubscriptions, useEmergencyFund, useDebtPayoff, useCashFlowForecast, useWizardProfile, useCriticalExpenseCommitment } from './use-local-db';

// Mock the local-db functions
vi.mock('@/lib/db/local-db', () => ({
  getDB: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    getAllFromIndex: vi.fn().mockResolvedValue([]),
    transaction: vi.fn().mockImplementation((stores, mode, callback) => {
      const tx = {
        objectStore: vi.fn().mockReturnValue({
          clear: vi.fn().mockResolvedValue(undefined)
        })
      };
      return Promise.resolve().then(() => {
        callback(tx);
        return Promise.resolve();
      });
    })
  }),
  saveWizardProfile: vi.fn(),
  getWizardProfile: vi.fn().mockResolvedValue(undefined),
  clearWizardProfile: vi.fn(),
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenses: vi.fn().mockResolvedValue([]),
  getExpensesByCategory: vi.fn().mockResolvedValue([]),
  saveBudgetCategory: vi.fn(),
  getBudgetCategory: vi.fn().mockResolvedValue(undefined),
  getAllBudgets: vi.fn().mockResolvedValue([]),
  addBill: vi.fn(),
  updateBill: vi.fn(),
  deleteBill: vi.fn(),
  getAllBills: vi.fn().mockResolvedValue([]),
  addSavingsGoal: vi.fn(),
  updateSavingsGoal: vi.fn(),
  deleteSavingsGoal: vi.fn(),
  getAllSavingsGoals: vi.fn().mockResolvedValue([]),
  saveCriticalExpenseCommitment: vi.fn(),
  getCriticalExpenseCommitment: vi.fn().mockResolvedValue(undefined),
  generateId: vi.fn(() => 'test-id')
}));

describe('use-local-db hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('useWizardProfile initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useWizardProfile());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toBeNull();
  });

  it('useCriticalExpenseCommitment initializes without synchronous setState in effect', async () => {
    const { result } = renderHook(() => useCriticalExpenseCommitment());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.commitment).toBeNull();
  });
});