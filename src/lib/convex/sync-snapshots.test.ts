// lib/convex/sync-snapshots.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as localDb from '@/lib/db/local-db';

vi.mock('@/lib/db/local-db', () => ({
  getWizardProfile: vi.fn(),
  getExpenses: vi.fn(),
  getAllBudgets: vi.fn(),
  getLatestNetWorthSnapshot: vi.fn(),
  getCriticalExpenseCommitment: vi.fn(),
  getCurrentAccountId: vi.fn().mockResolvedValue('personal'),
  getDB: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockResolvedValue([]),
  }),
  USER_DATA_STORES: [
    'wizardProfile',
    'expenses',
    'incomes',
    'budgets',
    'bills',
    'savingsGoals',
    'netWorthSnapshots',
    'debts',
    'criticalExpenseCommitments',
  ],
}));

vi.mock('@/lib/db/accountStorage', () => ({
  getCurrentAccountId: vi.fn().mockResolvedValue('personal'),
}));

// We cannot easily mock the private getConvexClient, so for the success-path
// assertion we just confirm gatherSnapshotData runs the data-gathering once.
import { gatherSnapshotData, syncDailySnapshot } from './sync-snapshots';

const mocked = vi.mocked(localDb);

function seedLocalDb() {
  mocked.getWizardProfile.mockResolvedValue({
    completed: true,
    completedAt: '2026-07-19T00:00:00.000Z',
    version: 1,
    locale: 'en',
    answers: {
      income: 50000,
      rent: 0,
      transport: 0,
      phoneInternet: 0,
      subscriptions: 0,
      entertainment: 0,
      healthcare: 0,
      savingsRatePct: 10,
      riskTolerance: 'low',
      locationConsent: false,
      currency: 'THB',
    },
  });
  mocked.getAllBudgets.mockResolvedValue([]);
  mocked.getExpenses.mockResolvedValue([]);
  mocked.getLatestNetWorthSnapshot.mockResolvedValue(undefined);
  mocked.getCriticalExpenseCommitment.mockResolvedValue(undefined);
}

describe('gatherSnapshotData (C3 dedup)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls each local-db reader exactly once', async () => {
    seedLocalDb();
    await gatherSnapshotData();

    expect(mocked.getWizardProfile).toHaveBeenCalledTimes(1);
    expect(mocked.getAllBudgets).toHaveBeenCalledTimes(1);
    expect(mocked.getExpenses).toHaveBeenCalledTimes(1);
    expect(mocked.getLatestNetWorthSnapshot).toHaveBeenCalledTimes(1);
    expect(mocked.getCriticalExpenseCommitment).toHaveBeenCalledTimes(1);
  });

  it('derives savings = income - expenses', async () => {
    seedLocalDb();
    mocked.getWizardProfile.mockResolvedValue({
      completed: true,
      completedAt: '2026-07-19T00:00:00.000Z',
      version: 1,
      locale: 'en',
      answers: {
        income: 50000,
        rent: 0,
        transport: 0,
        phoneInternet: 0,
        subscriptions: 0,
        entertainment: 0,
        healthcare: 0,
        savingsRatePct: 10,
        riskTolerance: 'low',
        locationConsent: false,
        currency: 'THB',
      },
    });
    mocked.getExpenses.mockResolvedValue([
      {
        id: '1',
        date: '2026-07-05',
        category: 'food',
        merchant: 'test',
        amount: 10000,
        source: 'manual',
      },
    ]);

    const result = await gatherSnapshotData();
    expect(result.totals.income).toBe(50000);
    expect(result.totals.expenses).toBe(10000);
    expect(result.totals.savings).toBe(40000);
  });
});

describe('syncDailySnapshot (C3 dedup)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure no Convex client is configured so the function queues offline.
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
    // localStorage queue is available in jsdom
    localStorage.removeItem('budgetbitch:offlineQueue');
  });

  it('gathers data exactly once even when offline (catch path)', async () => {
    seedLocalDb();
    const result = await syncDailySnapshot();

    // No Convex configured => success false, queued offline.
    expect(result.success).toBe(false);
    // The data-gathering must have run exactly once (not duplicated in catch).
    expect(mocked.getWizardProfile).toHaveBeenCalledTimes(1);

    const queued = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
    expect(queued).toHaveLength(1);
  });
});

vi.mock('@/components/providers/convex-client-provider', () => ({
  convex: {
    mutation: vi.fn(),
  },
}));

import { flushOfflineQueue } from './sync-snapshots';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockConvex = (await import('@/components/providers/convex-client-provider')).convex as any;

describe('flushOfflineQueue (no item-skip on partial failure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configure a Convex URL so getConvexClient returns the shared client.
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://test.convex.cloud');
    // Simulate an authenticated user so auth gate passes.
    localStorage.setItem('__convexAuthJWT_test', 'valid-token');
    localStorage.removeItem('budgetbitch:offlineQueue');
  });

  it('retains only the items that actually failed; never skips the next item', async () => {
    // Queue: item[0] fails with a non-auth error, item[1] succeeds.
    const queue = [
      { data: { totals: { income: 1 } }, timestamp: 1 },
      { data: { totals: { income: 2 } }, timestamp: 2 },
    ];
    localStorage.setItem('budgetbitch:offlineQueue', JSON.stringify(queue));

    let call = 0;
    mockConvex.mutation.mockImplementation(async () => {
      call += 1;
      if (call === 1) throw new Error('Network blip');
      return { ok: true };
    });

    await flushOfflineQueue();

    // Only the failed (first) item should remain; the second was flushed.
    const remaining = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].timestamp).toBe(1);
    expect(mockConvex.mutation).toHaveBeenCalledTimes(2);
  });

  it('keeps the whole tail when auth drops mid-flush', async () => {
    const queue = [
      { data: { totals: { income: 1 } }, timestamp: 1 },
      { data: { totals: { income: 2 } }, timestamp: 2 },
      { data: { totals: { income: 3 } }, timestamp: 3 },
    ];
    localStorage.setItem('budgetbitch:offlineQueue', JSON.stringify(queue));

    mockConvex.mutation.mockRejectedValueOnce(new Error('Unauthenticated'));

    await flushOfflineQueue();

    const remaining = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
    expect(remaining).toHaveLength(3);
  });
});
