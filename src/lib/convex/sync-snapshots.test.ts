// lib/convex/sync-snapshots.test.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    // P0-C2: the flush deletes winner + superseded ids in one readwrite tx.
    transaction: vi.fn().mockImplementation(() => ({
      store: {
        delete: vi.fn().mockImplementation(async (id: number) => {
          syncQueueStore = syncQueueStore.filter((i) => i.id !== id);
        }),
      },
      done: Promise.resolve(),
    })),
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

import { gatherSnapshotData, syncDailySnapshot, flushOfflineQueue, capBackup } from './sync-snapshots';

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
    // Distinct calendar days so the new same-day compaction (SYNC-5) keeps both
    // entries; the test asserts per-item failure isolation, not day-dedup.
    syncQueueStore = [
      { id: 1, data: { totals: { income: 1 } }, timestamp: new Date('2026-08-18T09:00:00Z').getTime() },
      { id: 2, data: { totals: { income: 2 } }, timestamp: new Date('2026-08-19T09:00:00Z').getTime() },
    ];

    let call = 0;
    mockConvex.mutation.mockImplementation(async () => {
      call += 1;
      if (call === 1) throw new Error('Network blip');
      return { ok: true };
    });

    await flushOfflineQueue();

    expect(syncQueueStore).toHaveLength(1);
    expect(syncQueueStore[0].timestamp).toBe(new Date('2026-08-18T09:00:00Z').getTime());
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
    // Distinct calendar days so same-day compaction (SYNC-5) preserves all three
    // before the auth-break aborts the flush.
    syncQueueStore = [
      { id: 1, data: { totals: { income: 1 } }, timestamp: new Date('2026-08-18T09:00:00Z').getTime() },
      { id: 2, data: { totals: { income: 2 } }, timestamp: new Date('2026-08-19T09:00:00Z').getTime() },
      { id: 3, data: { totals: { income: 3 } }, timestamp: new Date('2026-08-20T09:00:00Z').getTime() },
    ];

    mockConvex.mutation.mockRejectedValueOnce(new Error('Unauthenticated'));

    await flushOfflineQueue();

    expect(syncQueueStore).toHaveLength(3);
  });

  // P0-C2 regression: deleting only the compacted winner left same-day rows in
  // the queue; the next `online` event replayed them and overwrote the cloud
  // backup with an OLDER snapshot.
  it('deletes superseded same-day rows with the winner so a second flush uploads nothing', async () => {
    const day = new Date('2026-08-18T09:00:00Z').getTime();
    syncQueueStore = [
      { id: 1, data: { totals: { income: 1 } }, timestamp: day - 2000 },
      { id: 2, data: { totals: { income: 2 } }, timestamp: day - 1000 },
      { id: 3, data: { totals: { income: 3 } }, timestamp: day },
    ];
    mockConvex.mutation.mockImplementation(async () => ({ ok: true }));

    await flushOfflineQueue();

    // Only the NEWEST payload was ever pushed, and the whole day was drained.
    expect(mockConvex.mutation).toHaveBeenCalledTimes(1);
    expect(mockConvex.mutation.mock.calls[0][1]).toEqual({ totals: { income: 3 } });
    expect(syncQueueStore).toHaveLength(0);

    mockConvex.mutation.mockClear();
    await flushOfflineQueue();
    expect(mockConvex.mutation).not.toHaveBeenCalled();
  });
});

// The service worker lives in public/ (outside vitest's include glob), so pin
// its two lifecycle guarantees with a source-level guard here rather than
// leaving them untested.
describe('service worker lifecycle hygiene (N5b + C1b)', () => {
  const swSource = () => readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

  it('activate prunes ONLY Budget Boss caches, never unrelated origin caches', () => {
    const sw = swSource();
    expect(sw).toMatch(/cacheKeys[\s\S]*?\.filter\(/);
    expect(sw).toMatch(/cacheKey\.startsWith\(["']bb-["']\)\s*&&\s*cacheKey\s*!==\s*APP_SHELL_CACHE\s*&&\s*cacheKey\s*!==\s*STATIC_ASSET_CACHE/);
  });

  it('navigation timeout aborts the fetch and clears its timer in finally', () => {
    const sw = swSource();
    expect(sw).toMatch(/new AbortController\(\)/);
    expect(sw).toMatch(/signal:\s*controller\.signal/);
    expect(sw).toMatch(/controller\.abort\(\)/);
    expect(sw).toMatch(/clearTimeout\(/);
    expect(sw.indexOf('clearTimeout(')).toBeGreaterThan(sw.indexOf('} catch {'));
  });
});

describe('capBackup (chronological retention)', () => {
  it('retains chronologically newest records instead of UUID-sorted tail when trimming', () => {
    // Simulate IndexedDB primary-key (UUID) ordering where recent dates have smaller UUID prefixes ('000...')
    // and old dates have larger UUID prefixes ('fff...').
    const expenses = [
      { id: '0001-recent', date: '2026-08-20', amount: 150, merchant: 'Recent A' },
      { id: '0002-recent', date: '2026-08-21', amount: 250, merchant: 'Recent B' },
      { id: 'fffe-old', date: '2025-01-01', amount: 50, merchant: 'Old A' },
      { id: 'ffff-old', date: '2025-01-02', amount: 75, merchant: 'Old B' },
    ];
    const fullBackup = { expenses };
    // Force a single halving pass by setting maxBytes slightly below full payload size
    const fullSize = new TextEncoder().encode(JSON.stringify(fullBackup)).length;
    const capped = capBackup(fullBackup, fullSize - 10);

    expect(capped.expenses).toHaveLength(2);
    expect(capped.expenses).toEqual([
      { id: '0001-recent', date: '2026-08-20', amount: 150, merchant: 'Recent A' },
      { id: '0002-recent', date: '2026-08-21', amount: 250, merchant: 'Recent B' },
    ]);
  });
});
