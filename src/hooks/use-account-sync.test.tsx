// hooks/use-account-sync.test.tsx
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';
import {
  clearAllData,
  addExpense,
  getExpenses,
  recordLocalWrite,
} from '@/lib/db/local-db';
import {
  setCurrentAccountId,
  saveLocalAccount,
} from '@/lib/db/accountStorage';
import type { ExpenseEntry } from '@/lib/types/budget';

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

// Separate mock that returns a listMyAccounts result so we can test the
// "local cache empty but server has the boardId" fallback.
const myAccountsResult: unknown[] = [];
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useConvex: () => ({
    query: async () => null,
  }),
  useMutation: () => pushBoard,
  useQuery: (ref: { __name__?: string } | string, args: unknown) => {
    if (args === 'skip') return undefined;
    // listMyAccounts takes no args ({}); getAccountBoard takes { boardId }.
    if (args && typeof args === 'object' && Object.keys(args).length === 0) {
      return myAccountsResult;
    }
    return queryResults.getBoard ?? null;
  },
}));

import { useAccountSync } from './use-account-sync';

function HookProbe() {
  const { boardId, loading } = useAccountSync();
  // Expose resolution state so tests can waitFor boardId to settle BEFORE
  // dispatching an edit. Dispatching while boardId is still null schedules a
  // push that the boardId-change reset effect then cancels (real race that
  // made these tests flaky on CI).
  return (
    <div
      data-testid="probe"
      data-board-id={boardId ?? ''}
      data-loading={loading ? '1' : '0'}
    />
  );
}

function ProbeWithSyncNow() {
  const { syncNow, boardId, loading } = useAccountSync();
  return (
    <div
      data-testid="probe"
      data-board-id={boardId ?? ''}
      data-loading={loading ? '1' : '0'}
    >
      <button data-testid="sync" onClick={() => void syncNow()}>sync</button>
    </div>
  );
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

// Wait until HookProbe reports the active board has resolved to `expected`
// (loading complete). Dispatching an edit before boardId settles schedules a
// push that the boardId-change reset effect immediately cancels — the real
// race behind the CI flakes. Polling for the resolved value is deterministic
// regardless of runner speed.
async function waitForBoard(
  result: { getByTestId: (id: string) => HTMLElement },
  expected: string,
): Promise<void> {
  await waitFor(() => {
    const el = result.getByTestId('probe');
    expect(el.getAttribute('data-loading')).toBe('0');
    expect(el.getAttribute('data-board-id')).toBe(expected);
  });
}

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
    const result = render(<HookProbe />);
    // Wait for the active account's boardId to resolve + push listener attach.
    await waitForBoard(result, 'board_family');
    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
    });

    // Poll past the 800ms debounce instead of a fixed sleep (CI-flake fix).
    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    const firstCall = (pushBoard.mock.calls[0] as unknown[])[0] as {
      boardId: string;
    };
    expect(firstCall.boardId).toBe('board_family');
  });

  it('pushes to personal board when active account is personal', async () => {
    await setCurrentAccountId('personal');
    const result = render(<HookProbe />);
    await waitForBoard(result, 'personal');
    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
    });
    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    const firstCall = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(firstCall.boardId).toBe('personal');
  });

  it('queues an offline edit to localStorage instead of pushing', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const result = render(<HookProbe />);

    // Wait for the active account's boardId to resolve before editing.
    await waitForBoard(result, 'board_family');

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
    });

    // Offline: the edit must queue, never push. Poll the queue instead of a
    // fixed sleep so we assert on the settled state, not a timing guess.
    await waitFor(() => {
      const queue = JSON.parse(localStorage.getItem('budgetbitch:accountBoardQueue') || '[]');
      expect(queue).toHaveLength(1);
    }, { timeout: 3000 });
    expect(pushBoard).not.toHaveBeenCalled();

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
  });

  it('replays queued pushes on custom budgetbitch:flushQueues event', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const result = render(<HookProbe />);

    // Wait for the active account's boardId to resolve before editing.
    await waitForBoard(result, 'board_family');

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
    });

    await waitFor(() => {
      const queue = JSON.parse(localStorage.getItem('budgetbitch:accountBoardQueue') || '[]');
      expect(queue).toHaveLength(1);
    }, { timeout: 3000 });
    expect(pushBoard).not.toHaveBeenCalled();

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('budgetbitch:flushQueues'));
    });
    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
  });

  it('re-resolves boardId and triggers push/pull on active account switch event', async () => {
    const result = render(<HookProbe />);
    // Wait for initial load to resolve (family board).
    await waitForBoard(result, 'board_family');

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
    });

    // Wait for the switch to re-resolve boardId before editing.
    await waitForBoard(result, 'board_another');

    // Verify it schedules a push under the new boardId on subsequent board edits
    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
    });

    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    const lastCall = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(lastCall.boardId).toBe('board_another');
  });

  it('syncNow forces an immediate push of the active account board', async () => {
    const result = render(<ProbeWithSyncNow />);
    // Wait for the active account's boardId to resolve before clicking.
    await waitForBoard(result, 'board_family');
    pushBoard.mockClear();

    await act(async () => {
      result.getByTestId('sync').click();
    });

    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    const call = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(call.boardId).toBe('board_family');
  });

  it('syncNow pushes to the personal board (personal has no boardId but is pushable)', async () => {
    await setCurrentAccountId('personal');
    const result = render(<ProbeWithSyncNow />);
    await waitForBoard(result, 'personal');
    pushBoard.mockClear();

    await act(async () => {
      result.getByTestId('sync').click();
    });

    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    const call = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(call.boardId).toBe('personal');
  });

  it('auto-pushes a shared account even when localAccounts is empty (dashboard case)', async () => {
    // Active account is a shared account, but localAccounts has NO entry for it
    // — this is the exact dashboard scenario where the bug dropped every push.
    await setCurrentAccountId('acc-family');
    // Explicitly leave the local accounts cache empty.
    await clearAllData();
    await setCurrentAccountId('acc-family');
    myAccountsResult.length = 0;
    myAccountsResult.push({
      accountId: 'acc-family',
      boardId: 'board_family',
      umbrella: 'family',
      name: 'Family',
      role: 'owner',
    });

    render(<HookProbe />);
    // Allow resolveActiveBoard to hit the listMyAccounts fallback.
    await act(async () => {
      await sleep(250);
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
    });

    // The edit listener debounces the push by PUSH_DEBOUNCE_MS (800ms) before
    // the async doPush chain runs. A fixed sleep(1000) leaves only ~200ms of
    // margin over the debounce and races it under CI's parallel load (flaky:
    // green locally, 0-calls on CI). Poll until the push lands instead so the
    // assertion is deterministic regardless of runner speed.
    await waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    const call = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(call.boardId).toBe('board_family');
  });
});
