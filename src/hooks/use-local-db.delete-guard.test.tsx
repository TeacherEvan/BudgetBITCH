// hooks/use-local-db.delete-guard.test.tsx
//
// Guards regression: the Delete button on expenses/incomes/bills was a silent
// no-op. Two defects combined:
//
//   1. SharedDeleteGuardMount marked ANY account board with a boardId as
//      "shared", including a solo board with no second member. useExpenses().
//      remove() then routed the delete into two-party consent and returned
//      early — nobody existed to approve, so the row never disappeared and no
//      error was shown.
//   2. Even on a genuinely shared board, a throwing requestDelete() was
//      unhandled, so a failed consent request also silently swallowed the
//      delete.
//
// Fix (this commit): the guard now requires a real second member, and remove()
// falls back to a local delete when the consent request fails.

import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { clearAllData, addExpense, getExpenses } from '@/lib/db/local-db';
import type { ExpenseEntry } from '@/lib/types/budget';

const guardState: {
  isShared: boolean;
  requestDelete: ReturnType<typeof vi.fn>;
} = {
  isShared: false,
  requestDelete: vi.fn(),
};

vi.mock('@/components/shared-board/shared-delete-guard-provider', () => ({
  getActiveSharedDeleteGuard: () => guardState,
  SharedDeleteGuardProvider: ({ children }: { children: unknown }) => children,
  useSharedDeleteGuardContext: () => null,
}));

import { useExpenses } from './use-local-db';

function makeExpense(id: string): ExpenseEntry {
  return {
    id,
    amount: 100,
    category: 'food',
    merchant: 'Test Merchant',
    date: '2026-08-01',
    source: 'manual',
  };
}

describe('useExpenses().remove — delete guard regression', () => {
  beforeEach(async () => {
    await clearAllData();
    guardState.isShared = false;
    guardState.requestDelete = vi.fn().mockResolvedValue({ pendingId: 'p1' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deletes locally and from IndexedDB for a solo (non-shared) user', async () => {
    await addExpense(makeExpense('e1'));
    expect(await getExpenses()).toHaveLength(1);

    const { result } = renderHook(() => useExpenses());
    await waitFor(() => expect(result.current.expenses).toHaveLength(1));

    await act(async () => {
      await result.current.remove('e1');
    });

    expect(guardState.requestDelete).not.toHaveBeenCalled();
    expect(result.current.expenses).toHaveLength(0);
    expect(await getExpenses()).toHaveLength(0);
  });

  it('routes to two-party consent (and keeps the row) on a genuinely shared board', async () => {
    guardState.isShared = true;
    await addExpense(makeExpense('e2'));

    const { result } = renderHook(() => useExpenses());
    await waitFor(() => expect(result.current.expenses).toHaveLength(1));

    await act(async () => {
      await result.current.remove('e2');
    });

    expect(guardState.requestDelete).toHaveBeenCalledWith('expenses', 'e2');
    // Item survives pending partner approval — that is the intended behaviour.
    expect(await getExpenses()).toHaveLength(1);
  });

  it('falls back to a local delete when the consent request throws', async () => {
    guardState.isShared = true;
    guardState.requestDelete = vi.fn().mockRejectedValue(new Error('Board not found'));
    await addExpense(makeExpense('e3'));

    const { result } = renderHook(() => useExpenses());
    await waitFor(() => expect(result.current.expenses).toHaveLength(1));

    await act(async () => {
      await result.current.remove('e3');
    });

    expect(guardState.requestDelete).toHaveBeenCalled();
    // The critical assertion: a failed consent request must NOT swallow the
    // delete. Before the fix this left the row in place with zero feedback.
    expect(result.current.expenses).toHaveLength(0);
    expect(await getExpenses()).toHaveLength(0);
  });
});
