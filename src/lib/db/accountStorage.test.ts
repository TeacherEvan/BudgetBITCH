// lib/db/accountStorage.test.ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllData,
  saveWizardProfile,
  addExpense,
  getExpenses,
  serializeBoard,
} from './local-db';
import {
  switchAccount,
  getCurrentAccountId,
  getLocalAccounts,
  saveLocalAccount,
  getStashedAccount,
  adoptRemoteAccount,
  ensurePersonalAccount,
  hasStashedAccount,
} from './accountStorage';
import { PERSONAL_ACCOUNT_ID } from '@/lib/types/accounts';
import type { WizardProfile, ExpenseEntry } from '@/lib/types/budget';
import type { LocalAccountMeta as LocalAccountMetaT } from '@/lib/types/accounts';

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

const FAMILY_META: LocalAccountMetaT = {
  accountId: 'acc-family',
  umbrella: 'family',
  name: 'Family Pot',
  boardId: 'board-family',
  inviteCode: 'ABCDEF12',
  role: 'owner',
};

describe('account storage — swap model', () => {
  beforeEach(async () => {
    await clearAllData();
    await ensurePersonalAccount();
  });

  it('defaults the active board to personal', async () => {
    expect(await getCurrentAccountId()).toBe(PERSONAL_ACCOUNT_ID);
    const accounts = await getLocalAccounts();
    expect(accounts.find((a) => a.accountId === PERSONAL_ACCOUNT_ID)).toBeTruthy();
  });

  it('switchAccount stashes personal data, then restores it on return', async () => {
    // Personal board has live data.
    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense('e1', 100));

    // Move to the family account (no stash yet → blank slate).
    await switchAccount('acc-family');
    expect(await getCurrentAccountId()).toBe('acc-family');
    // Personal data was stashed.
    expect(await hasStashedAccount(PERSONAL_ACCOUNT_ID)).toBe(true);
    // Active board is now blank (family never opened locally).
    expect((await getExpenses()).length).toBe(0);

    // Return to personal → original data restored.
    await switchAccount(PERSONAL_ACCOUNT_ID);
    expect(await getCurrentAccountId()).toBe(PERSONAL_ACCOUNT_ID);
    expect((await getExpenses()).length).toBe(1);
    expect((await getExpenses())[0].id).toBe('e1');
  });

  it('switching between two accounts keeps each isolated', async () => {
    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense('personal-e', 50));

    // Seed account A with its own data via adoptRemoteAccount.
    const aMeta: LocalAccountMetaT = { ...FAMILY_META, accountId: 'A', name: 'A' };
    await adoptRemoteAccount(aMeta, {
      wizardProfile: null,
      expenses: [makeExpense('a-e', 999)],
      budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
      debts: [], criticalExpenseCommitments: [],
    });
    expect((await getExpenses()).map((e) => e.id)).toEqual(['a-e']);

    // Seed account B.
    const bMeta: LocalAccountMetaT = { ...FAMILY_META, accountId: 'B', name: 'B' };
    await adoptRemoteAccount(bMeta, {
      wizardProfile: null,
      expenses: [makeExpense('b-e', 123)],
      budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
      debts: [], criticalExpenseCommitments: [],
    });
    expect((await getExpenses()).map((e) => e.id)).toEqual(['b-e']);

    // Switch A → B → A, data stays isolated.
    await switchAccount('A');
    expect((await getExpenses()).map((e) => e.id)).toEqual(['a-e']);
    await switchAccount('B');
    expect((await getExpenses()).map((e) => e.id)).toEqual(['b-e']);
    await switchAccount('A');
    expect((await getExpenses()).map((e) => e.id)).toEqual(['a-e']);

    // Personal still intact.
    await switchAccount(PERSONAL_ACCOUNT_ID);
    expect((await getExpenses()).map((e) => e.id)).toEqual(['personal-e']);
  });

  it('adoptRemoteAccount stores stash + meta and makes it active', async () => {
    await adoptRemoteAccount(FAMILY_META, {
      wizardProfile: makeProfile(),
      expenses: [makeExpense('fam-e', 42)],
      budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
      debts: [], criticalExpenseCommitments: [],
    });
    expect(await getCurrentAccountId()).toBe('acc-family');
    const stashed = await getStashedAccount('acc-family');
    expect(stashed?.snapshot.expenses[0].id).toBe('fam-e');
    const meta = await getLocalAccounts();
    expect(meta.find((m) => m.accountId === 'acc-family')?.inviteCode).toBe('ABCDEF12');
  });

  it('switchAccount is idempotent (no-op when target === current)', async () => {
    await switchAccount(PERSONAL_ACCOUNT_ID);
    expect(await getCurrentAccountId()).toBe(PERSONAL_ACCOUNT_ID);
  });
});
