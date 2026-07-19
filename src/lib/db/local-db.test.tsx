// lib/db/local-db.test.ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  serializeBoard,
  replaceBoardData,
  saveWizardProfile,
  addExpense,
  getWizardProfile,
  getExpenses,
  clearAllData,
  clearAllUserData,
  USER_DATA_STORES,
  saveSettings,
  addNewsItem,
  saveLocationCache,
  getNewsByLocale,
  getLocationCache,
} from './local-db';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';
import type { WizardProfile, ExpenseEntry, NewsItem } from '@/lib/types/budget';

function makeProfile(): WizardProfile {
  return {
    completed: true,
    completedAt: new Date().toISOString(),
    version: 1,
    locale: 'en',
    answers: {
      income: 50000,
      rent: 8000,
      transport: 2000,
      phoneInternet: 1000,
      subscriptions: 500,
      entertainment: 1500,
      healthcare: 1000,
      savingsRatePct: 10,
      riskTolerance: 'medium',
      locationConsent: false,
      currency: 'THB',
    },
  };
}

function makeExpense(): ExpenseEntry {
  return {
    id: 'exp-1',
    date: '2026-07-19',
    category: 'food',
    merchant: 'Test',
    amount: 100,
    source: 'manual',
  };
}

describe('shared board serialize/replace', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('serializeBoard returns empty stores when db is empty', async () => {
    const board = await serializeBoard();
    expect(board.wizardProfile).toBeNull();
    expect(board.expenses).toEqual([]);
    expect(board.budgets).toEqual([]);
    expect(board.bills).toEqual([]);
    expect(board.savingsGoals).toEqual([]);
    expect(board.netWorthSnapshots).toEqual([]);
    expect(board.debts).toEqual([]);
    expect(board.criticalExpenseCommitments).toEqual([]);
  });

  it('round-trips profile + expense through serialize -> replace', async () => {
    const profile = makeProfile();
    const expense = makeExpense();
    await saveWizardProfile(profile);
    await addExpense(expense);

    const board = await serializeBoard();
    expect(board.wizardProfile?.answers.income).toBe(50000);
    expect(board.expenses).toHaveLength(1);

    // Wipe and restore from snapshot
    await clearAllData();
    expect(await getWizardProfile()).toBeUndefined();

    await replaceBoardData(board);

    const restored = await getWizardProfile();
    expect(restored?.answers.income).toBe(50000);
    expect(await getExpenses()).toHaveLength(1);
  });

  it('replaceBoardData MERGES (preserves local records absent from the snapshot)', async () => {
    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense());
    await addExpense({ ...makeExpense(), id: 'exp-2' });
    expect((await getExpenses())).toHaveLength(2);

    // Remote snapshot only knows about one of the two local expenses.
    const partial = await serializeBoard();
    partial.expenses = partial.expenses.filter(e => e.id === 'exp-1');

    await replaceBoardData(partial);

    // The local-only expense (exp-2) must survive the merge.
    const remaining = await getExpenses();
    expect(remaining).toHaveLength(2);
    expect(remaining.map(e => e.id).sort()).toEqual(['exp-1', 'exp-2']);
  });

  it('regression: a locally-added expense survives a shared-board pull (merge, not clear)', async () => {
    // Simulates the sync race: user adds exp-3 locally, a pull brings a snapshot
    // that predates it (no exp-3). The pull must NOT delete exp-3.
    await addExpense({ ...makeExpense(), id: 'exp-old' });

    const remoteSnapshot = await serializeBoard(); // board as partner sees it (no exp-3 yet)
    remoteSnapshot.expenses = remoteSnapshot.expenses.filter(e => e.id === 'exp-old');

    // Local user adds a new expense after the snapshot was taken.
    await addExpense({ ...makeExpense(), id: 'exp-3' });
    expect((await getExpenses()).map(e => e.id)).toContain('exp-3');

    // Partner's board arrives (pull) — only knows exp-old.
    await replaceBoardData(remoteSnapshot);

    const after = await getExpenses();
    expect(after.map(e => e.id).sort()).toEqual(['exp-3', 'exp-old']);
  });

  it('replaceBoardData does NOT emit a board-changed event', async () => {
    const handler = vi.fn();
    window.addEventListener(BOARD_CHANGED_EVENT, handler);

    const board = await serializeBoard();
    await replaceBoardData(board);

    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener(BOARD_CHANGED_EVENT, handler);
  });

  it('mutating functions emit a board-changed event', async () => {
    const handler = vi.fn();
    window.addEventListener(BOARD_CHANGED_EVENT, handler);

    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense());

    expect(handler).toHaveBeenCalledTimes(2);
    window.removeEventListener(BOARD_CHANGED_EVENT, handler);
  });
});

describe('clearAllUserData (focused reset)', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('USER_DATA_STORES lists exactly the 8 user-data stores', () => {
    expect([...USER_DATA_STORES].sort()).toEqual([
      'bills',
      'budgets',
      'criticalExpenseCommitments',
      'debts',
      'expenses',
      'netWorthSnapshots',
      'savingsGoals',
      'wizardProfile',
    ]);
  });

  it('clears user data but preserves settings, newsCache, and locationCache', async () => {
    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense());
    await saveSettings({
      preferredLocale: 'en',
      voiceSettings: { enabled: false, rate: 1, pitch: 1 },
      privacyDisclaimerAccepted: true,
    });
    const news: NewsItem = {
      link: 'https://example.com/n',
      title: 'Hobby',
      source: 'test',
      locale: 'en',
      category: 'hobby',
      pubDate: new Date().toISOString(),
      description: 'd',
    };
    await addNewsItem(news);
    await saveLocationCache({ lat: 13.7, lng: 100.5, updatedAt: Date.now() });

    await clearAllUserData();

    expect(await getWizardProfile()).toBeUndefined();
    expect(await getExpenses()).toHaveLength(0);
    // preserved
    expect(await getNewsByLocale('en')).toHaveLength(1);
    expect(await getLocationCache()).toBeDefined();
  });
});
