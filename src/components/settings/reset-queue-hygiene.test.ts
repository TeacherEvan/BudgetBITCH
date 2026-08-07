// components/settings/reset-queue-hygiene.test.ts
//
// Post-reset queue hygiene (RELIABILITY_HARDENING_PLAN step 6).
//
// A snapshot queued into the IndexedDB 'syncQueue' store BEFORE a reset can
// still be flushed to Convex afterwards (flushOfflineQueue ->
// upsertDailySnapshot), which would push the data the user just deleted back
// to the cloud. The reset tombstone only blocks the RESTORE direction, so the
// outbound queues must be drained explicitly. These tests pin that behaviour
// for `clearSyncAndQueues`, which handleResetConfirm awaits before
// clearAllData().
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDB } from '@/lib/db/local-db';
import { clearSyncAndQueues } from './data-backup-card';

const OFFLINE_QUEUE_KEY = 'budgetbitch:offlineQueue';
const BOARD_QUEUE_KEY = 'budgetbitch:boardQueue';
const ACCOUNT_BOARD_QUEUE_KEY = 'budgetbitch:accountBoardQueue';

async function seedQueuedSnapshot() {
  const db = await getDB();
  await db.add('syncQueue', {
    data: { date: '2026-07-20', totalSpent: 4200, currency: 'THB' },
    timestamp: Date.now(),
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([{ id: 'stale-1' }]));
  localStorage.setItem(BOARD_QUEUE_KEY, JSON.stringify([{ id: 'stale-board-1' }]));
  localStorage.setItem(ACCOUNT_BOARD_QUEUE_KEY, JSON.stringify([{ id: 'stale-acct-1' }]));
}

describe('post-reset queue hygiene — clearSyncAndQueues', () => {
  beforeEach(async () => {
    const db = await getDB();
    await db.clear('syncQueue');
    localStorage.clear();
  });

  afterEach(() => {
    vi.doUnmock('@/lib/db/local-db');
    vi.resetModules();
  });

  it('drains a pre-reset queued snapshot out of the syncQueue store', async () => {
    await seedQueuedSnapshot();

    const db = await getDB();
    expect(await db.getAll('syncQueue')).toHaveLength(1);

    await clearSyncAndQueues();

    expect(await db.getAll('syncQueue')).toHaveLength(0);
  });

  it('removes every outbound localStorage push queue', async () => {
    await seedQueuedSnapshot();

    await clearSyncAndQueues();

    expect(localStorage.getItem(OFFLINE_QUEUE_KEY)).toBeNull();
    expect(localStorage.getItem(BOARD_QUEUE_KEY)).toBeNull();
    expect(localStorage.getItem(ACCOUNT_BOARD_QUEUE_KEY)).toBeNull();
  });

  it('preserves unrelated keys so theme/locale survive the reset path', async () => {
    await seedQueuedSnapshot();
    localStorage.setItem('budgetbitch:theme', 'dark');
    localStorage.setItem('bb-locale', 'en');

    await clearSyncAndQueues();

    expect(localStorage.getItem('budgetbitch:theme')).toBe('dark');
    expect(localStorage.getItem('bb-locale')).toBe('en');
  });

  it('is idempotent — a second call on empty queues does not throw', async () => {
    await seedQueuedSnapshot();

    await clearSyncAndQueues();
    await expect(clearSyncAndQueues()).resolves.toBeUndefined();

    const db = await getDB();
    expect(await db.getAll('syncQueue')).toHaveLength(0);
    expect(localStorage.getItem(OFFLINE_QUEUE_KEY)).toBeNull();
  });

  it('does not throw when the syncQueue store is absent', async () => {
    vi.resetModules();
    const clearSpy = vi.fn();
    vi.doMock('@/lib/db/local-db', () => ({
      getDB: async () => ({
        objectStoreNames: { contains: () => false },
        clear: clearSpy,
      }),
      clearAllData: vi.fn(),
      clearAllUserData: vi.fn(),
      markResetTombstone: vi.fn(),
      createLocalCheckpoint: vi.fn(),
      USER_DATA_STORES: [] as string[],
    }));

    const mod = await import('./data-backup-card');
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([{ id: 'stale-2' }]));

    await expect(mod.clearSyncAndQueues()).resolves.toBeUndefined();

    expect(clearSpy).not.toHaveBeenCalled();
    // The localStorage queues are still drained even without the IDB store.
    expect(localStorage.getItem(OFFLINE_QUEUE_KEY)).toBeNull();
  });
});
