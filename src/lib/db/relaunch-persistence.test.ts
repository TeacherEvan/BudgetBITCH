// lib/db/relaunch-persistence.test.ts
//
// Verifies BudgetBITCH's local-first multi-account data SURVIVES AN APP RELAUNCH
// for ALL accounts — not just the active one.
//
// A real relaunch: the app process dies, IndexedDB persists on disk, and on
// reopen getDB() re-opens the same DB. The active board (8 flat stores) plus
// every other account's stash (accountsData) and the current-account pointer
// (bbMeta) must be intact.
//
// The existing accountStorage.test.ts switches between accounts within ONE live
// DB connection. This test additionally simulates the CLOSE+REOPEN by dropping
// the cached connection (__closeDbForTest) so getDB() re-opens the persisted DB,
// then re-derives each account's board from storage.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDB,
  saveWizardProfile,
  addExpense,
  getExpenses,
  clearAllData,
  __closeDbForTest,
} from './local-db';
import {
  switchAccount,
  getCurrentAccountId,
  getLocalAccounts,
  getStashedAccount,
  adoptRemoteAccount,
  ensurePersonalAccount,
  restoreAccountToActive,
  setCurrentAccountId,
} from './accountStorage';
import { PERSONAL_ACCOUNT_ID } from '@/lib/types/accounts';
import type { WizardProfile, ExpenseEntry } from '@/lib/types/budget';
import type { LocalAccountMeta } from '@/lib/types/accounts';
import type { CurrencyCode } from '@/lib/utils/currency';

function makeProfile(currency: CurrencyCode): WizardProfile {
  return {
    completed: true,
    completedAt: new Date().toISOString(),
    version: 1,
    locale: 'en',
    answers: {
      income: 50000, rent: 8000, transport: 2000, phoneInternet: 1000,
      subscriptions: 500, entertainment: 1500, healthcare: 1000,
      savingsRatePct: 10, riskTolerance: 'medium', locationConsent: false,
      currency,
    },
  };
}

function makeExpense(id: string, amount: number): ExpenseEntry {
  return {
    id, amount, category: 'food', date: '2026-07-20', merchant: 'Test',
    note: '', isRecurring: false, source: 'manual', createdAt: Date.now(),
  } as ExpenseEntry;
}

const ACC_A: LocalAccountMeta = {
  accountId: 'acc-A', umbrella: 'family', name: 'Family', boardId: 'b-A',
  inviteCode: 'AAAA1111', role: 'owner',
};
const ACC_B: LocalAccountMeta = {
  accountId: 'acc-B', umbrella: 'couple', name: 'Couple', boardId: 'b-B',
  inviteCode: 'BBBB2222', role: 'owner',
};

describe('multi-account data survives app relaunch', () => {
  beforeEach(async () => {
    await clearAllData();
    __closeDbForTest();
    await ensurePersonalAccount();
  });

  it('all 3 accounts (personal, A, B) retain their data after close+reopen', async () => {
    // 1) Seed personal with its own data.
    await saveWizardProfile(makeProfile('THB'));
    await addExpense(makeExpense('personal-e', 100));
    await switchAccount(PERSONAL_ACCOUNT_ID); // ensure current pointer set

    // 2) Seed account A with distinct data and activate it.
    await adoptRemoteAccount(ACC_A, {
      wizardProfile: makeProfile('USD'),
      expenses: [makeExpense('a-e', 999)],
      budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
      debts: [], criticalExpenseCommitments: [],
    });

    // 3) Seed account B with distinct data and activate it.
    await adoptRemoteAccount(ACC_B, {
      wizardProfile: makeProfile('EUR'),
      expenses: [makeExpense('b-e', 123)],
      budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
      debts: [], criticalExpenseCommitments: [],
    });

    // Active account is now B.
    expect(await getCurrentAccountId()).toBe('acc-B');

    // 4) SIMULATE RELAUNCH: close the cached DB connection. The persisted
    //    IndexedDB (fake-indexeddb global) still holds all data.
    __closeDbForTest();

    // 5) Re-open — this is exactly what getDB() does on app start.
    const reopened = await getDB();
    expect(reopened).toBeTruthy();

    // The current-account pointer must persist.
    const reopenedCurrent = await getCurrentAccountId();
    expect(reopenedCurrent).toBe('acc-B');

    // 6) Every account's stash must be intact and isolated in storage.
    const personalStash = await getStashedAccount(PERSONAL_ACCOUNT_ID);
    const aStash = await getStashedAccount('acc-A');
    const bStash = await getStashedAccount('acc-B');

    expect(personalStash, 'personal stash missing after relaunch').toBeTruthy();
    expect(aStash, 'account A stash missing after relaunch').toBeTruthy();
    expect(bStash, 'account B stash missing after relaunch').toBeTruthy();

    // Each stash holds its OWN data, not leaked from another account.
    expect(personalStash!.snapshot.expenses.map((e: ExpenseEntry) => e.id))
      .toEqual(['personal-e']);
    expect(aStash!.snapshot.expenses.map((e: ExpenseEntry) => e.id))
      .toEqual(['a-e']);
    expect(bStash!.snapshot.expenses.map((e: ExpenseEntry) => e.id))
      .toEqual(['b-e']);

    // 7) Re-deriving the ACTIVE board (what the app shows on load) for B.
    await restoreAccountToActive(bStash!.snapshot);
    expect((await getExpenses()).map((e) => e.id)).toEqual(['b-e']);

    // 8) Switching back to A or personal via the stash restores correctly
    //    (the app does this when the user picks another account post-relaunch).
    await switchAccount('acc-A');
    expect((await getExpenses()).map((e) => e.id)).toEqual(['a-e']);

    await switchAccount(PERSONAL_ACCOUNT_ID);
    expect((await getExpenses()).map((e) => e.id)).toEqual(['personal-e']);
  });

  it('the active board is exactly what was last shown before relaunch', async () => {
    // Personal has data; switch to A (personal stashed); relaunch while on A.
    await saveWizardProfile(makeProfile('THB'));
    await addExpense(makeExpense('personal-only', 55));
    await adoptRemoteAccount(ACC_A, {
      wizardProfile: makeProfile('USD'),
      expenses: [makeExpense('a-only', 777)],
      budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
      debts: [], criticalExpenseCommitments: [],
    });
    expect(await getCurrentAccountId()).toBe('acc-A');

    // Relaunch.
    __closeDbForTest();
    await getDB();

    // On reopen the active 8 stores already hold A's data (last active board),
    // and the app does NOT need to re-stash personal — it is already in accountsData.
    expect((await getExpenses()).map((e) => e.id)).toEqual(['a-only']);
    const personalStash = await getStashedAccount(PERSONAL_ACCOUNT_ID);
    expect(personalStash!.snapshot.expenses.map((e: ExpenseEntry) => e.id))
      .toEqual(['personal-only']);
  });

  it('all 5 account slots survive relaunch when fully populated', async () => {
    await setCurrentAccountId(PERSONAL_ACCOUNT_ID); // isolate from leaked pointer
    await saveWizardProfile(makeProfile('THB'));
    await addExpense(makeExpense('p', 1));

    const seeds = ['acc-1', 'acc-2', 'acc-3', 'acc-4', 'acc-5'];
    for (const id of seeds) {
      await adoptRemoteAccount(
        { accountId: id, umbrella: 'friends', name: id, boardId: `b-${id}`, inviteCode: null, role: 'owner' },
        {
          wizardProfile: null,
          expenses: [makeExpense(`${id}-e`, seeds.indexOf(id) + 10)],
          budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
          debts: [], criticalExpenseCommitments: [],
        },
      );
    }

    // Relaunch (currently on acc-5).
    __closeDbForTest();
    await getDB();

    const accounts = await getLocalAccounts();
    // All expected accounts must be present post-relaunch (personal + 5 seeds).
    const ids = accounts.map((a) => a.accountId).sort();
    for (const id of [...seeds, PERSONAL_ACCOUNT_ID]) {
      expect(ids, `account ${id} missing from listing after relaunch`).toContain(id);
    }

    for (const id of seeds) {
      const stash = await getStashedAccount(id);
      expect(stash, `${id} stash missing after relaunch`).toBeTruthy();
      expect(stash!.snapshot.expenses[0].id).toBe(`${id}-e`);
    }
    const personalStash = await getStashedAccount(PERSONAL_ACCOUNT_ID);
    expect(personalStash!.snapshot.expenses[0].id).toBe('p');
  });
});
