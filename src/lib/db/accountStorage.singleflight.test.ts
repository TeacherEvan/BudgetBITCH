// lib/db/accountStorage.singleflight.test.ts
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  clearAllData,
  addExpense,
  getExpenses,
} from './local-db';
import {
  switchAccount,
  adoptRemoteAccount,
  getCurrentAccountId,
} from './accountStorage';
import type { LocalAccountMeta } from '@/lib/types/accounts';
import type { ExpenseEntry } from '@/lib/types/budget';

const gate = vi.hoisted(() => ({
  delayBPointerPut: false,
  releaseB: null as (() => void) | null,
  pointerPuts: 0,
}));

// Counting/instrumented IDB wrapper: intercept the active-pointer write to
// force a deterministic mid-swap interleave and count how many pointer flips a
// pair of concurrent swaps performs. Only the exported getDB() used by
// accountStorage is wrapped; local-db's internal helpers keep the real handle.
vi.mock('./local-db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./local-db')>();
  return {
    ...actual,
    getDB: async () => {
      const real = await actual.getDB();
      return new Proxy(real, {
        get(target, prop) {
          const value = Reflect.get(target, prop, target);
          if (typeof value === 'function' && prop !== 'put') return value.bind(target);
          if (prop !== 'put' || typeof value !== 'function') return value;
          return (...args: unknown[]) => {
            const apply = () => Reflect.apply(value as (...a: unknown[]) => unknown, target, args);
            if (args[0] === 'bbMeta') {
              gate.pointerPuts += 1;
              if (gate.delayBPointerPut && args[1] === 'B') {
                gate.delayBPointerPut = false;
                return new Promise((resolve) => {
                  gate.releaseB = () => resolve(apply());
                });
              }
            }
            return apply();
          };
        },
      });
    },
  };
});

function makeExpense(id: string, amount: number): ExpenseEntry {
  return {
    id, amount, category: 'food', date: '2026-11-23', merchant: 'Test',
    note: '', isRecurring: false, source: 'manual', createdAt: Date.now(),
  } as ExpenseEntry;
}

function meta(id: string): LocalAccountMeta {
  return {
    accountId: id,
    umbrella: 'family',
    name: id,
    boardId: `board-${id}`,
    inviteCode: null,
    role: 'owner',
  };
}

async function seed(id: string, expenseId: string): Promise<void> {
  await adoptRemoteAccount(meta(id), {
    wizardProfile: null,
    expenses: [makeExpense(expenseId, 100)],
    budgets: [], bills: [], savingsGoals: [], netWorthSnapshots: [],
    debts: [], criticalExpenseCommitments: [],
  });
}

describe('accountStorage — serialized board swaps', () => {
  beforeEach(async () => {
    await clearAllData();
    gate.delayBPointerPut = false;
    gate.releaseB = null;
    gate.pointerPuts = 0;
    // Put data on personal first so its stash is seeded with it, then seed two
    // accounts with distinct data and return to personal.
    await addExpense(makeExpense('p-e', 50));
    await seed('B', 'b-e');
    await seed('C', 'c-e');
    await switchAccount('personal');
    gate.pointerPuts = 0;
  });

  it('guards regression: concurrent switchAccount calls never blend records or leave a stale pointer', async () => {
    gate.delayBPointerPut = true;
    const swaps = Promise.all([switchAccount('B'), switchAccount('C')]);

    // B is now blocked at its pointer flip. Without a single-flight chain, C
    // runs to completion in the meantime and flips the pointer to C.
    await waitFor(() => expect(gate.releaseB).not.toBeNull());
    gate.releaseB?.();
    await swaps;

    // With serialized swaps C starts only after B has fully finished, so the
    // final pointer and the active board agree on C's data.
    expect(await getCurrentAccountId()).toBe('C');
    expect((await getExpenses()).map((e) => e.id)).toEqual(['c-e']);
    expect(gate.pointerPuts).toBe(2);
  });
});
