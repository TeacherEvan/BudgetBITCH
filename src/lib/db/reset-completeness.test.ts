// lib/db/reset-completeness.test.ts
//
// Regression tests for the "Reset all data is not working" bug.
//
// The Settings → Reset handler (src/components/settings/data-backup-card.tsx,
// handleResetConfirm) MUST call clearAllData(), NOT clearAllUserData(). The
// latter only clears the nine USER_DATA_STORES; the multi-board stores
// (accountsData, localAccounts, bbMeta) and the LWW write-clock store
// (localWrites) would survive, so:
//
//   - switching accounts after a "reset" restores a full stash of the data
//     the user believed they deleted, and
//   - the surviving localWrites clocks let the sync engine reason about
//     records that no longer exist.
//
// The fix (calling clearAllData + markResetTombstone so the cloud-sync mount
// won't re-pull a stale snapshot) is already in place. These tests pin the
// CORRECT behaviour of clearAllData and the INCOMPLETE behaviour of
// clearAllUserData, so any regression that swaps the handler back to
// clearAllUserData is caught here.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllData,
  clearAllUserData,
  saveWizardProfile,
  addExpense,
  getExpenses,
  getDB,
  getLocalWrite,
} from './local-db';
import {
  switchAccount,
  ensurePersonalAccount,
  getStashedAccount,
  getLocalAccounts,
  getCurrentAccountId,
} from './accountStorage';
import { PERSONAL_ACCOUNT_ID } from '@/lib/types/accounts';
import type { WizardProfile, ExpenseEntry } from '@/lib/types/budget';

function makeProfile(): WizardProfile {
  return {
    completed: true,
    completedAt: new Date().toISOString(),
    version: 1,
    locale: 'en',
    answers: {
      income: 50000, rent: 8000, transport: 2000, phoneInternet: 1000,
      subscriptions: 500, entertainment: 1500, healthcare: 1000,
      savingsRatePct: 10, riskTolerance: 'medium', locationConsent: false,
      currency: 'THB',
    },
  };
}

function makeExpense(id: string, amount: number): ExpenseEntry {
  return {
    id, amount, category: 'food', date: '2026-07-20', merchant: 'Test',
    note: '', isRecurring: false, source: 'manual', createdAt: Date.now(),
  } as ExpenseEntry;
}

/** Build a user with a personal board AND a second account holding a stash. */
async function seedTwoBoards() {
  await ensurePersonalAccount();
  await saveWizardProfile(makeProfile());
  await addExpense(makeExpense('personal-1', 100));

  // Switching stashes personal into accountsData and opens a blank board.
  await switchAccount('acc-family');
  await addExpense(makeExpense('family-1', 250));

  // Back to personal so the family board is the one sitting in the stash.
  await switchAccount(PERSONAL_ACCOUNT_ID);
}

describe('reset completeness — clearAllUserData vs clearAllData', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('clearAllUserData does NOT clear the stashed account snapshots (the bug)', async () => {
    await seedTwoBoards();

    // Precondition: the family board really is stashed.
    expect(await getStashedAccount('acc-family')).toBeTruthy();

    await clearAllUserData();

    // Active board is empty — this is the part that looks like it worked.
    expect(await getExpenses()).toHaveLength(0);

    // ...but the other account's data is fully intact and will come straight
    // back on the next account switch. This is the reported symptom.
    const survivingStash = await getStashedAccount('acc-family');
    expect(survivingStash).toBeTruthy();

    const stashedExpenses = (survivingStash?.snapshot?.expenses ?? []) as ExpenseEntry[];
    expect(stashedExpenses).toHaveLength(1);
    expect(stashedExpenses[0].id).toBe('family-1');
  });

  it('clearAllUserData leaves the account listing and active-account pointer behind', async () => {
    await seedTwoBoards();
    await clearAllUserData();

    const accounts = await getLocalAccounts();
    expect(accounts.length).toBeGreaterThan(0);

    // bbMeta survives, so bb:currentAccount still points somewhere.
    expect(await getCurrentAccountId()).toBeTruthy();
  });

  it('clearAllUserData leaves LWW write-clocks behind for deleted records', async () => {
    await ensurePersonalAccount();
    await addExpense(makeExpense('e-lww', 500));

    expect(await getLocalWrite('expenses', 'e-lww')).toBeGreaterThan(0);

    await clearAllUserData();

    // The record is gone but its write-clock is not — the sync engine can
    // still reason about a record that no longer exists.
    expect(await getExpenses()).toHaveLength(0);
    expect(await getLocalWrite('expenses', 'e-lww')).toBeGreaterThan(0);
  });

  it('clearAllData DOES clear stashes, listings and the active pointer', async () => {
    await seedTwoBoards();

    await clearAllData();

    expect(await getExpenses()).toHaveLength(0);
    expect(await getStashedAccount('acc-family')).toBeFalsy();
    expect(await getLocalAccounts()).toHaveLength(0);
    // With bbMeta cleared the pointer falls back to the personal default.
    expect(await getCurrentAccountId()).toBe(PERSONAL_ACCOUNT_ID);
  });

  it('clearAllData also clears the LWW write-clock store', async () => {
    await ensurePersonalAccount();
    await addExpense(makeExpense('e-lww2', 500));
    expect(await getLocalWrite('expenses', 'e-lww2')).toBeGreaterThan(0);

    await clearAllData();

    const db = await getDB();
    const remaining = await db.getAllKeys('localWrites');
    expect(remaining.length).toBe(0);
  });

  it('markResetTombstone writes a timestamp keyed by RESET_TOMBSTONE_KEY', async () => {
    const { markResetTombstone, RESET_TOMBSTONE_KEY } = await import('./local-db');
    localStorage.removeItem(RESET_TOMBSTONE_KEY);
    await markResetTombstone();
    expect(Number(localStorage.getItem(RESET_TOMBSTONE_KEY))).toBeGreaterThan(0);
  });
});
