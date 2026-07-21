// hooks/use-account-sync.test.tsx
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';
import {
  saveWizardProfile,
  getWizardProfile,
  clearAllData,
  addExpense,
  getExpenses,
  recordLocalWrite,
} from '@/lib/db/local-db';
import {
  setCurrentAccountId,
  saveLocalAccount,
} from '@/lib/db/accountStorage';
import type { WizardProfile, ExpenseEntry } from '@/lib/types/budget';

let queryResults: Record<string, unknown> = {};
const pushBoard = vi.fn(async () => ({ success: true, applied: true }));

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useConvex: () => ({
    query: async () => null,
  }),
  useMutation: () => pushBoard,
  useQuery: (_ref: unknown, args: unknown) => {
    if (args === 'skip') return undefined;
    return queryResults.getBoard ?? null;
  },
}));

import { useAccountSync } from './use-account-sync';

function HookProbe() {
  useAccountSync();
  return null;
}

function makeProfile(income = 50000): WizardProfile {
  return {
    completed: true,
    completedAt: new Date().toISOString(),
    version: 1,
    locale: 'en',
    answers: {
      income, rent: 8000, transport: 2000, phoneInternet: 1000,
      subscriptions: 500, entertainment: 1500, healthcare: 1000,
      savingsRatePct: 10, riskTolerance: 'medium', locationConsent: false,
      currency: 'THB',
    },
  };
}

function makeExpense(id: string, amount = 100): ExpenseEntry {
  return {
    id,
    date: '2026-07-21',
    category: 'food',
    merchant: 'Starbucks',
    amount,
    source: 'manual',
  };
}

type FixtureBoard = {
  boardId: string;
  updatedAt: number;
  data: Record<string, { value: unknown; updatedAt: number }> | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  cleanup();
  queryResults = { getBoard: null };
  pushBoard.mockClear();
  await clearAllData();
  localStorage.clear();
  // Seed the active account as a shared account with a boardId.
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
});

afterEach(() => {
  cleanup();
});

describe('useAccountSync', () => {
  it('pulls a newer remote account board into local storage', async () => {
    const localExp = makeExpense('exp-1', 100);
    await addExpense(localExp);
    const expenses = await getExpenses();
    expect(expenses.find(e => e.id === 'exp-1')?.amount).toBe(100);

    const result = render(<HookProbe />);

    await act(async () => {
      queryResults = {
        getBoard: {
          boardId: 'board_family',
          updatedAt: Date.now() + 5_000_000,
          data: {
            'expenses:exp-1': {
              value: { ...makeExpense('exp-1', 999) },
              updatedAt: Date.now() + 5_000_000,
            },
          },
        } as FixtureBoard,
      };
      result.rerender(<HookProbe />);
      await sleep(50);
    });

    await waitFor(async () => {
      const local = await getExpenses();
      expect(local.find(e => e.id === 'exp-1')?.amount).toBe(999);
    });
  });

  it('does not clobber a local edit when the remote board is older (lossless pull)', async () => {
    const localExp = makeExpense('exp-1', 100);
    await addExpense(localExp);
    await recordLocalWrite('expenses', 'exp-1');

    const result = render(<HookProbe />);

    // Remote board is OLDER than the local write (updatedAt well in the past).
    await act(async () => {
      queryResults = {
        getBoard: {
          boardId: 'board_family',
          updatedAt: 100, // older than the local write (Date.now())
          data: {
            'expenses:exp-1': {
              value: { ...makeExpense('exp-1', 999) },
              updatedAt: 100,
            },
          },
        } as FixtureBoard,
      };
      result.rerender(<HookProbe />);
      await sleep(50);
    });

    // Local edit must survive the stale pull.
    await waitFor(async () => {
      const local = await getExpenses();
      expect(local.find(e => e.id === 'exp-1')?.amount).toBe(100);
    });
  });

  it('debounces rapid local edits into a single push to the account board', async () => {
    render(<HookProbe />);
    // Let the active account's boardId resolve + push listener attach.
    await act(async () => {
      await sleep(250);
    });
    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });

    expect(pushBoard).toHaveBeenCalledTimes(1);
    const firstCall = (pushBoard.mock.calls[0] as unknown[])[0] as {
      boardId: string;
    };
    expect(firstCall.boardId).toBe('board_family');
  });

  it('does nothing when the active board is personal (no boardId)', async () => {
    await setCurrentAccountId('personal');
    render(<HookProbe />);
    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });
    expect(pushBoard).not.toHaveBeenCalled();
  });

  it('queues an offline edit to localStorage instead of pushing', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    render(<HookProbe />);

    // Let the active account's boardId resolve before editing.
    await act(async () => {
      await sleep(50);
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });

    expect(pushBoard).not.toHaveBeenCalled();
    const queue = JSON.parse(localStorage.getItem('budgetbitch:accountBoardQueue') || '[]');
    expect(queue).toHaveLength(1);
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
      await sleep(200);
    });
    expect(pushBoard).toHaveBeenCalledTimes(1);
  });

  it('replays queued pushes on custom budgetbitch:flushQueues event', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    render(<HookProbe />);

    // Let the active account's boardId resolve before editing.
    await act(async () => {
      await sleep(50);
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });

    expect(pushBoard).not.toHaveBeenCalled();
    const queue = JSON.parse(localStorage.getItem('budgetbitch:accountBoardQueue') || '[]');
    expect(queue).toHaveLength(1);
    
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('budgetbitch:flushQueues'));
      await sleep(200);
    });
    expect(pushBoard).toHaveBeenCalledTimes(1);
  });

  it('re-resolves boardId and triggers push/pull on active account switch event', async () => {
    render(<HookProbe />);
    // Let initial load resolve (family board)
    await act(async () => {
      await sleep(50);
    });

    // Switch account to one with board_another
    await act(async () => {
      await saveLocalAccount({
        accountId: 'another_account',
        umbrella: 'family',
        name: 'Another Family',
        boardId: 'board_another',
        inviteCode: null,
        role: 'owner',
        hasLocalData: true,
      });
      await setCurrentAccountId('another_account');
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT, { detail: { source: 'switch' } }));
      await sleep(50);
    });

    // Verify it schedules a push under the new boardId on subsequent board edits
    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });

    expect(pushBoard).toHaveBeenCalledTimes(1);
    const lastCall = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(lastCall.boardId).toBe('board_another');
  });
});
