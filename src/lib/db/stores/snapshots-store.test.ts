// lib/db/stores/snapshots-store.test.ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as localDbModule from '@/lib/db/local-db';
import {
  getDB,
  clearAllData,
  recordLocalWrite,
  saveWizardProfile,
  addExpense,
  getExpenses,
  getWizardProfile,
  saveSettings,
  getSettings,
  restoreCheckpoint,
  getLocalWrite,
  recordLocalWriteAt,
} from '@/lib/db/local-db';
import {
  serializeBoardForSync,
  applyRemoteBoard,
  serializeSnapshotForSync,
} from '@/lib/db/stores/snapshots-store';

beforeEach(async () => {
  await clearAllData();
  localStorage.clear();
});

describe('serializeBoardForSync (Fix A)', () => {
  it('stamps each record with its stored local-write time, not a global "now"', async () => {
    const old = Date.now() - 10_000;
    const recent = Date.now() - 1_000;

    // expense A was touched long ago; expense B touched recently.
    const expA = { id: 'a', date: '2026-07-01', category: 'food', merchant: 'x', amount: 10, source: 'manual' };
    const expB = { id: 'b', date: '2026-07-01', category: 'food', merchant: 'y', amount: 20, source: 'manual' };
    await addExpense(expA as never);
    await addExpense(expB as never);
    // recordLocalWrite mirrors what afterBoardMutation does on every save.
    await recordLocalWrite('expenses', 'a');
    await recordLocalWrite('expenses', 'b');

    // Backdate A's write clock far behind B's.
    const db = await getDB();
    await db.put('localWrites', old, 'expenses:a');
    await db.put('localWrites', recent, 'expenses:b');

    const out = await serializeBoardForSync();

    expect(out['expenses:a'].updatedAt).toBe(old);
    expect(out['expenses:b'].updatedAt).toBe(recent);
  });

  it('includes incomes (previously dropped from the sync payload)', async () => {
    const db = await getDB();
    await db.put('incomes', { id: 'inc-1', date: '2026-07-01', amount: 1000, category: 'salary', frequency: 'monthly' } as never);
    const out = await serializeBoardForSync();
    expect(out['incomes:inc-1']).toBeDefined();
  });
});

describe('applyRemoteBoard (Fix A)', () => {
  it('records local-write time for applied records so a later push respects remote truth', async () => {
    await addExpense({ id: 'a', date: '2026-07-01', category: 'food', merchant: 'x', amount: 10, source: 'manual' } as never);

    const remoteTs = Date.now() + 5_000; // NEWER than local
    await applyRemoteBoard({
      'expenses:a': { value: { id: 'a', amount: 999 }, updatedAt: remoteTs },
    });

    const applied = await getExpenses();
    expect(applied[0].amount).toBe(999);

    // Local write clock must reflect the remote timestamp, not "now".
    const db = await getDB();
    const localTs = (await db.get('localWrites', 'expenses:a')) as number;
    expect(localTs).toBe(remoteTs);
  });

  it('does not clobber a newer local edit with an older remote record', async () => {
    const localTs = Date.now();
    await addExpense({ id: 'a', date: '2026-07-01', category: 'food', merchant: 'x', amount: 10, source: 'manual' } as never);
    await recordLocalWrite('expenses', 'a'); // now
    const db = await getDB();
    await db.put('localWrites', localTs, 'expenses:a');

    // Stale remote (older than local) must be ignored.
    await applyRemoteBoard({
      'expenses:a': { value: { id: 'a', amount: 1 }, updatedAt: localTs - 60_000 },
    });

    expect((await getExpenses())[0].amount).toBe(10);
  });
});

// N5: the LWW clock read and the applied stamps must share the data tx.
describe('applyRemoteBoard (N5 atomic LWW clock)', () => {
  const exp = (amount: number) => ({
    id: 'a', date: '2026-07-01', category: 'food' as const, merchant: 'x', amount, source: 'manual' as const,
  });

  it('applies the record and its stamp inside ONE readwrite transaction', async () => {
    await addExpense(exp(10) as never);
    const db = await getDB();
    const orig = (db as unknown as { transaction: (...a: unknown[]) => unknown }).transaction.bind(db);
    let txCount = 0;
    (db as unknown as { transaction: (...a: unknown[]) => unknown }).transaction = (...a: unknown[]) => {
      txCount += 1;
      return orig(...a);
    };
    try {
      const remoteTs = Date.now() + 5_000;
      await applyRemoteBoard({ 'expenses:a': { value: exp(999), updatedAt: remoteTs } });
      expect(txCount).toBe(1);
      expect(await getLocalWrite('expenses', 'a')).toBe(remoteTs);
      expect((await getExpenses())[0].amount).toBe(999);
    } finally {
      (db as unknown as { transaction: unknown }).transaction = orig;
    }
  });

  it('preserves a local edit when a separate clock read would return a stale map', async () => {
    await addExpense(exp(10) as never);
    const localTs = Date.now() + 10_000;
    await recordLocalWriteAt('expenses', 'a', localTs);

    // Old code read the clock through getAllLocalWrites() BEFORE opening the
    // data tx. Force that read to observe an empty (stale) map: the remote
    // record must still lose to the real, newer stamp stored in IndexedDB.
    const staleClock = vi.spyOn(localDbModule, 'getAllLocalWrites')
      .mockResolvedValue(new Map());
    try {
      await applyRemoteBoard({
        'expenses:a': { value: exp(1), updatedAt: localTs - 1 },
      });
      expect((await getExpenses())[0].amount).toBe(10);
      expect(await getLocalWrite('expenses', 'a')).toBe(localTs);
    } finally {
      staleClock.mockRestore();
    }
  });
});

describe('restoreCheckpoint (Fix B)', () => {
  it('restores wizardProfile under the fixed "current" key', async () => {
    // Simulate a corrupted/missing active wizard profile.
    await saveWizardProfile({ completed: true, locale: 'en' } as never);
    await getDB().then((d) => d.delete('wizardProfile', 'current'));

    // Build a checkpoint backup via the real store shape.
    const db = await getDB();
    const wiz = { completed: true, locale: 'th', answers: { income: 1 } } as never;
    await db.put('bbMeta', JSON.stringify([{ label: 'cp', timestamp: 1, backup: { wizardProfile: [wiz], expenses: [] } }]), 'checkpoints');

    const ok = await restoreCheckpoint(1);
    expect(ok).toBe(true);

    const restored = await getWizardProfile();
    expect(restored).toBeTruthy();
    expect((restored as { locale: string }).locale).toBe('th');
  });

  it('restores settings under the fixed "current" key (regression: not dropped from backup)', async () => {
    // Settings must survive a checkpoint round-trip.
    await saveSettings({ preferredLocale: 'en', voiceSettings: { enabled: false, rate: 1, pitch: 1 }, privacyDisclaimerAccepted: false } as never);
    await getDB().then((d) => d.delete('settings', 'current'));

    const db = await getDB();
    const settingsItem = { preferredLocale: 'th', voiceSettings: { enabled: false, rate: 1, pitch: 1 }, privacyDisclaimerAccepted: false } as never;
    await db.put('bbMeta', JSON.stringify([{ label: 'cp', timestamp: 2, backup: { wizardProfile: [], settings: [settingsItem] } }]), 'checkpoints');

    const ok = await restoreCheckpoint(2);
    expect(ok).toBe(true);

    const restored = await getSettings();
    expect(restored).toBeTruthy();
    expect((restored as { preferredLocale: string }).preferredLocale).toBe('th');
  });
});

describe('serializeSnapshotForSync', () => {
  it('stamps records with 0 (used for pre-existing stashes, not live pushes)', () => {
    const out = serializeSnapshotForSync({
      wizardProfile: null,
      incomes: [],
      expenses: [{ id: 'a' } as never],
      budgets: [],
      bills: [],
      savingsGoals: [],
      netWorthSnapshots: [],
      debts: [],
      criticalExpenseCommitments: [],
    });
    expect(out['expenses:a'].updatedAt).toBe(0);
  });
});
