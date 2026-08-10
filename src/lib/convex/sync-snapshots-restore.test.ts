// lib/convex/sync-snapshots-restore.test.ts
// Exercises the cloud-restore path against a REAL IndexedDB (fake-indexeddb)
// so we verify Fix B (wizardProfile 'current' key) and Fix C
// (account-aware restore under the multi-board swap model).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAllData,
  getWizardProfile,
  getDB,
} from '@/lib/db/local-db';
import {
  setCurrentAccountId,
  saveLocalAccount,
  getStashedAccount,
  getCurrentAccountId,
} from '@/lib/db/accountStorage';
import { restoreFromCloudSnapshot } from './sync-snapshots';

beforeEach(async () => {
  await clearAllData();
  localStorage.clear();
});

describe('restoreFromCloudSnapshot (Fix B + C)', () => {
  it('restores wizardProfile under the fixed "current" key (not a random key)', async () => {
    const snapshot = {
      fullBackupData: {
        wizardProfile: [{ completed: true, locale: 'th', answers: { income: 5 } }],
        expenses: [],
        incomes: [],
        budgets: [],
        bills: [],
        savingsGoals: [],
        netWorthSnapshots: [],
        debts: [],
        criticalExpenseCommitments: [],
      },
    };

    const ok = await restoreFromCloudSnapshot(snapshot);
    expect(ok).toBe(true);

    const wiz = await getWizardProfile();
    expect(wiz).toBeTruthy();
    expect((wiz as { locale: string }).locale).toBe('th');
  });

  it('is account-aware: stashes the active board and repoints the active account (Fix C)', async () => {
    // User is currently on a SHARED account with live data.
    await setCurrentAccountId('acc-family');
    await saveLocalAccount({
      accountId: 'acc-family',
      umbrella: 'family',
      name: 'Family',
      boardId: 'board_family',
      inviteCode: 'ABCDEF12',
      role: 'owner',
      hasLocalData: true,
    });
    const db = await getDB();
    await db.put('expenses', { id: 'live-1', date: '2026-07-01', category: 'food', amount: 50, source: 'manual' } as never);

    const snapshot = {
      accountId: 'acc-business',
      fullBackupData: {
        wizardProfile: [],
        expenses: [{ id: 'biz-1', date: '2026-07-01', category: 'food', amount: 999, source: 'manual' }],
        incomes: [],
        budgets: [],
        bills: [],
        savingsGoals: [],
        netWorthSnapshots: [],
        debts: [],
        criticalExpenseCommitments: [],
      },
    };

    await restoreFromCloudSnapshot(snapshot);

    // Active account is now the snapshot's account.
    expect(await getCurrentAccountId()).toBe('acc-business');
    // The previously-active family board was stashed (not lost / not pushed-as-business).
    const stashed = await getStashedAccount('acc-family');
    expect(stashed).toBeTruthy();
    const stashedExpenses = (stashed!.snapshot as { expenses: { id: string }[] }).expenses;
    expect(stashedExpenses.some((e) => e.id === 'live-1')).toBe(true);
  });

  it('falls back gracefully when accountId is absent (personal restore)', async () => {
    await setCurrentAccountId('personal');
    const snapshot = {
      fullBackupData: {
        wizardProfile: [{ completed: true, locale: 'en' }],
        expenses: [],
        incomes: [],
        budgets: [],
        bills: [],
        savingsGoals: [],
        netWorthSnapshots: [],
        debts: [],
        criticalExpenseCommitments: [],
      },
    };
    const ok = await restoreFromCloudSnapshot(snapshot);
    expect(ok).toBe(true);
    expect(await getCurrentAccountId()).toBe('personal');
  });

  it('honors the "Reset all data" tombstone — refuses to re-inject deleted data (regression)', async () => {
    // User wiped everything; the reset tombstone is stamped with "now".
    const resetAt = Date.now();
    localStorage.setItem('bb:lastResetAt', String(resetAt));

    // A stale cloud snapshot from BEFORE the reset, carrying the deleted entries.
    const oldSnapshotTime = resetAt - 60_000;
    const snapshot = {
      createdAt: oldSnapshotTime,
      accountId: 'personal',
      fullBackupData: {
        wizardProfile: [{ completed: true, locale: 'en' }],
        expenses: [{ id: 'should-not-return', date: '2026-07-01', category: 'food', amount: 999, source: 'manual' }],
        incomes: [],
        budgets: [],
        bills: [],
        savingsGoals: [],
        netWorthSnapshots: [],
        debts: [],
        criticalExpenseCommitments: [],
      },
    };

    const ok = await restoreFromCloudSnapshot(snapshot);

    // Restore is refused and the deleted expense is NOT written back.
    expect(ok).toBe(false);
    const db = await getDB();
    expect(await db.count('expenses')).toBe(0);
  });

  it('manual restore with force:true overrides the tombstone (explicit user choice)', async () => {
    const resetAt = Date.now();
    localStorage.setItem('bb:lastResetAt', String(resetAt));

    const oldSnapshotTime = resetAt - 60_000;
    const snapshot = {
      createdAt: oldSnapshotTime,
      fullBackupData: {
        wizardProfile: [{ completed: true, locale: 'en' }],
        expenses: [{ id: 'recovered-1', date: '2026-07-01', category: 'food', amount: 42, source: 'manual' }],
        incomes: [],
        budgets: [],
        bills: [],
        savingsGoals: [],
        netWorthSnapshots: [],
        debts: [],
        criticalExpenseCommitments: [],
      },
    };

    const ok = await restoreFromCloudSnapshot(snapshot, { force: true });
    expect(ok).toBe(true);
    const db = await getDB();
    expect(await db.count('expenses')).toBe(1);
  });
});
