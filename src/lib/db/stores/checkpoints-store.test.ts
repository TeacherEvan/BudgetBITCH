// lib/db/stores/checkpoints-store.test.ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDB,
  clearAllData,
  addExpense,
  getExpenses,
  recordLocalWriteAt,
  getLocalWrite,
  createLocalCheckpoint,
  getLocalCheckpoints,
  restoreCheckpoint,
} from '@/lib/db/local-db';

const expense = (id: string, amount: number) => ({
  id,
  date: '2026-07-01',
  category: 'food' as const,
  merchant: 'Test',
  amount,
  source: 'manual' as const,
});

describe('checkpoint restore LWW stamps (N6)', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('restores each record with the updatedAt captured at checkpoint creation, not "now"', async () => {
    await addExpense(expense('exp-1', 100));
    const capturedTs = Date.now() - 60_000;
    await recordLocalWriteAt('expenses', 'exp-1', capturedTs);

    await createLocalCheckpoint('before');
    const [cp] = await getLocalCheckpoints();
    expect(cp).toBeDefined();

    // Simulate a newer local edit after the checkpoint was taken.
    await addExpense({ ...expense('exp-1', 999), id: 'exp-1' });
    await recordLocalWriteAt('expenses', 'exp-1', Date.now());

    expect(await restoreCheckpoint(cp.timestamp)).toBe(true);

    expect((await getExpenses())[0].amount).toBe(100);
    // The rollback must NOT look like a fresh edit to every record.
    expect(await getLocalWrite('expenses', 'exp-1')).toBe(capturedTs);
  });

  it('clears stale localWrites stamps for restored stores (no phantom tombstones)', async () => {
    const db = await getDB();
    await db.put('localWrites', Date.now(), 'expenses:deleted-before-checkpoint');
    expect(await getLocalWrite('expenses', 'deleted-before-checkpoint')).toBeGreaterThan(0);

    await createLocalCheckpoint('empty');
    const [cp] = await getLocalCheckpoints();

    expect(await restoreCheckpoint(cp.timestamp)).toBe(true);
    expect(await getLocalWrite('expenses', 'deleted-before-checkpoint')).toBe(0);
  });

  it('falls back to the checkpoint timestamp for legacy checkpoints with no captured stamps', async () => {
    const db = await getDB();
    await db.put('bbMeta', JSON.stringify([{
      label: 'legacy',
      timestamp: 1,
      backup: { expenses: [expense('legacy-1', 42)] },
    }]), 'checkpoints');

    expect(await restoreCheckpoint(1)).toBe(true);
    expect(await getLocalWrite('expenses', 'legacy-1')).toBe(1);
  });
});
