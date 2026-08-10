// lib/convex/sync-snapshots.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as localDb from '@/lib/db/local-db';

interface SyncQueueItem {
  id?: number;
  data: unknown;
  timestamp: number;
  failCount?: number;
}

let syncQueueStore: SyncQueueItem[] = [];
let autoIncId = 1;

vi.mock('@/lib/db/local-db', () => ({
  getWizardProfile: vi.fn(),
  getExpenses: vi.fn(),
  getAllBudgets: vi.fn(),
  getLatestNetWorthSnapshot: vi.fn(),
  getCriticalExpenseCommitment: vi.fn(),
  getCurrentAccountId: vi.fn().mockResolvedValue('personal'),
  getDB: vi.fn().mockImplementation(async () => ({
    getAll: vi.fn().mockImplementation(async (store: string) => {
      if (store === 'syncQueue') return syncQueueStore;
      return [];
    }),
    add: vi.fn().mockImplementation(async (store: string, val: SyncQueueItem) => {
      if (store === 'syncQueue') {
        const item = { ...val, id: autoIncId++ };
        syncQueueStore.push(item);
        return item.id;
      }
    }),
    put: vi.fn().mockImplementation(async (store: string, val: SyncQueueItem) => {
      if (store === 'syncQueue') {
        syncQueueStore = syncQueueStore.map((i) => (i.id === val.id ? { ...i, ...val } : i));
      }
    }),
    delete: vi.fn().mockImplementation(async (store: string, id: number) => {
      if (store === 'syncQueue') {
        syncQueueStore = syncQueueStore.filter((i) => i.id !== id);
      }
    }),
  })),
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
    'syncQueue',
  ],
}));

vi.mock('@/lib/db/accountStorage', () => ({
  getCurrentAccountId: vi.fn().mockResolvedValue('personal'),
}));

import { gatherSnapshotData, syncDailySnapshot, flushOfflineQueue } from './sync-snapshots';

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
    syncQueueStore = [];
    autoIncId = 1;
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
        date: new Date().toISOString().slice(0, 7) + '-05',
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
    syncQueueStore = [];
    autoIncId = 1;
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
  });

  it('gathers data exactly once even when offline (catch path)', async () => {
    seedLocalDb();
    const result = await syncDailySnapshot();

    expect(result.success).toBe(false);
    expect(mocked.getWizardProfile).toHaveBeenCalledTimes(1);
    expect(syncQueueStore).toHaveLength(1);
  });
});

vi.mock('@/components/providers/convex-client-provider', () => ({
  convex: {
    mutation: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockConvex = (await import('@/components/providers/convex-client-provider')).convex as any;

describe('flushOfflineQueue (no item-skip on partial failure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syncQueueStore = [];
    autoIncId = 1;
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://test.convex.cloud');
    localStorage.setItem('__convexAuthJWT_test', 'valid-token');
  });

  it('retains only the items that actually failed; never skips the next item', async () => {
    syncQueueStore = [
      { id: 1, data: { totals: { income: 1 } }, timestamp: 1 },
      { id: 2, data: { totals: { income: 2 } }, timestamp: 2 },
    ];

    let call = 0;
    mockConvex.mutation.mockImplementation(async () => {
      call += 1;
      if (call === 1) throw new Error('Network blip');
      return { ok: true };
    });

    await flushOfflineQueue();

    expect(syncQueueStore).toHaveLength(1);
    expect(syncQueueStore[0].timestamp).toBe(1);
    // The failed item keeps its failCount so it can be dropped after 3 tries
    // instead of re-flushing forever.
    expect(syncQueueStore[0].failCount).toBe(1);
    expect(mockConvex.mutation).toHaveBeenCalledTimes(2);
  });

  it('drops an item after 3 consecutive non-auth failures', async () => {
    syncQueueStore = [
      { id: 1, data: { totals: { income: 1 } }, timestamp: 1, failCount: 2 },
    ];

    mockConvex.mutation.mockRejectedValue(new Error('Document too large'));

    await flushOfflineQueue();

    expect(syncQueueStore).toHaveLength(0);
  });

  it('keeps the whole tail when auth drops mid-flush', async () => {
    syncQueueStore = [
      { id: 1, data: { totals: { income: 1 } }, timestamp: 1 },
      { id: 2, data: { totals: { income: 2 } }, timestamp: 2 },
      { id: 3, data: { totals: { income: 3 } }, timestamp: 3 },
    ];

    mockConvex.mutation.mockRejectedValueOnce(new Error('Unauthenticated'));

    await flushOfflineQueue();

    expect(syncQueueStore).toHaveLength(3);
  });
});
