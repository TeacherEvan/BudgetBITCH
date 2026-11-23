// lib/db/stores/incomes-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IncomeEntry } from '@/lib/types/budget';

const mocks = vi.hoisted(() => ({
  putWithStamp: vi.fn(async () => undefined),
  afterBoardMutation: vi.fn(async () => undefined),
  getDB: vi.fn(async () => ({})),
  logUserAction: vi.fn(),
}));

vi.mock('@/lib/db/local-db', () => ({
  getDB: mocks.getDB,
  afterBoardMutation: mocks.afterBoardMutation,
  putWithStamp: mocks.putWithStamp,
}));
vi.mock('@/lib/utils/action-logger', () => ({ logUserAction: mocks.logUserAction }));
vi.mock('@/lib/db/current-member', () => ({ getCurrentMember: () => 'Tester' }));

import { addIncome, updateIncome, deleteIncome } from './incomes-store';

const income = {
  id: 'inc-1',
  date: '2026-07-01',
  source: 'Salary',
  amount: 1000,
  category: 'salary',
  frequency: 'monthly',
} as IncomeEntry;

// N6b: record and LWW stamp must be written in one atomic transaction.
describe('income writes are atomic (N6b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds an income via putWithStamp (no separate afterBoardMutation transaction)', async () => {
    await addIncome({ ...income });
    expect(mocks.putWithStamp).toHaveBeenCalledWith('incomes', expect.objectContaining({ id: 'inc-1' }));
    expect(mocks.afterBoardMutation).not.toHaveBeenCalled();
  });

  it('updates an income via putWithStamp', async () => {
    await updateIncome({ ...income, amount: 2000 });
    expect(mocks.putWithStamp).toHaveBeenCalledWith('incomes', expect.objectContaining({ amount: 2000 }));
    expect(mocks.afterBoardMutation).not.toHaveBeenCalled();
  });

  it('deletes an income via a putWithStamp tombstone (stamp survives the delete)', async () => {
    await deleteIncome('inc-1');
    expect(mocks.putWithStamp).toHaveBeenCalledWith('incomes', null, 'inc-1');
    expect(mocks.afterBoardMutation).not.toHaveBeenCalled();
  });
});
