// lib/db/local-db-integrity.test.ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDB, clearAllData, auditAndRepairDatabase } from './local-db';
import type { IncomeEntry, Bill, SavingsGoal, Debt, ExpenseEntry } from '@/lib/types/budget';

describe('auditAndRepairDatabase', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  describe('Healthy database state', () => {
    it('returns status healthy and valid logs when no repairs are needed', async () => {
      const db = await getDB();
      const validIncome: IncomeEntry = {
        id: 'inc-valid',
        date: '2026-07-23',
        source: 'Employer',
        amount: 50000,
        category: 'salary',
        frequency: 'monthly',
        createdAt: '2026-07-23T00:00:00.000Z',
      };
      await db.put('incomes', validIncome);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('healthy');
      expect(result.logs).toContain('Starting comprehensive database health audit...');
      expect(result.logs).toContain('Found 0 budgets.');
      expect(result.logs).toContain('Found 0 expenses.');
      expect(result.logs).toContain('Found 1 income entries.');
      expect(result.logs).toContain('Found 0 bills.');
      expect(result.logs).toContain('Found 0 savings goals.');
      expect(result.logs).toContain('Found 0 debts.');
      expect(result.logs).toContain('All database stores are healthy.');
    });
  });

  describe('Income entry repair', () => {
    it('repairs income with NaN or negative amount to 0', async () => {
      const db = await getDB();
      const nanIncome = {
        id: 'inc-nan',
        date: '2026-07-23',
        source: 'Side Gig',
        amount: NaN,
        category: 'freelance',
        frequency: 'monthly',
        createdAt: '2026-07-23T00:00:00.000Z',
      } as unknown as IncomeEntry;

      const negativeIncome = {
        id: 'inc-neg',
        date: '2026-07-23',
        source: 'Side Gig',
        amount: -1500,
        category: 'freelance',
        frequency: 'monthly',
        createdAt: '2026-07-23T00:00:00.000Z',
      } as IncomeEntry;

      await db.put('incomes', nanIncome);
      await db.put('incomes', negativeIncome);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');
      expect(result.logs).toContain('Repaired 2 corrupted or invalid records across financial stores.');

      const repairedNan = await db.get('incomes', 'inc-nan');
      const repairedNeg = await db.get('incomes', 'inc-neg');

      expect(repairedNan?.amount).toBe(0);
      expect(repairedNeg?.amount).toBe(0);
    });

    it('repairs income with missing frequency to monthly', async () => {
      const db = await getDB();
      const missingFreqIncome = {
        id: 'inc-no-freq',
        date: '2026-07-23',
        source: 'Consulting',
        amount: 20000,
        category: 'freelance',
        createdAt: '2026-07-23T00:00:00.000Z',
      } as unknown as IncomeEntry;

      await db.put('incomes', missingFreqIncome);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repaired = await db.get('incomes', 'inc-no-freq');
      expect(repaired?.frequency).toBe('monthly');
    });
  });

  describe('Bill entry repair', () => {
    it('repairs bill with NaN or negative amount to 0', async () => {
      const db = await getDB();
      const nanBill = {
        id: 'bill-nan',
        name: 'Electric',
        amount: NaN,
        dueDay: 15,
        category: 'utilities',
        isActive: true,
        reminderDaysBefore: 3,
      } as unknown as Bill;

      const negBill = {
        id: 'bill-neg',
        name: 'Water',
        amount: -500,
        dueDay: 10,
        category: 'utilities',
        isActive: true,
        reminderDaysBefore: 3,
      } as Bill;

      await db.put('bills', nanBill);
      await db.put('bills', negBill);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repairedNan = await db.get('bills', 'bill-nan');
      const repairedNeg = await db.get('bills', 'bill-neg');

      expect(repairedNan?.amount).toBe(0);
      expect(repairedNeg?.amount).toBe(0);
    });

    it('constrains invalid dueDay (< 1 or > 31 or NaN) to between 1 and 31', async () => {
      const db = await getDB();
      const billZeroDue = {
        id: 'bill-due-0',
        name: 'Internet',
        amount: 1000,
        dueDay: 0,
        category: 'phone_internet',
        isActive: true,
        reminderDaysBefore: 3,
      } as Bill;

      const billHighDue = {
        id: 'bill-due-45',
        name: 'Insurance',
        amount: 2000,
        dueDay: 45,
        category: 'insurance',
        isActive: true,
        reminderDaysBefore: 3,
      } as Bill;

      const billNanDue = {
        id: 'bill-due-nan',
        name: 'Gym',
        amount: 1500,
        dueDay: NaN,
        category: 'subscriptions',
        isActive: true,
        reminderDaysBefore: 3,
      } as unknown as Bill;

      await db.put('bills', billZeroDue);
      await db.put('bills', billHighDue);
      await db.put('bills', billNanDue);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repairedZero = await db.get('bills', 'bill-due-0');
      const repairedHigh = await db.get('bills', 'bill-due-45');
      const repairedNan = await db.get('bills', 'bill-due-nan');

      expect(repairedZero?.dueDay).toBe(1);
      expect(repairedHigh?.dueDay).toBe(31);
      expect(repairedNan?.dueDay).toBe(1);
    });
  });

  describe('Savings goals repair', () => {
    it('repairs targetAmount <= 0 or NaN to 1000', async () => {
      const db = await getDB();
      const zeroTargetGoal = {
        id: 'goal-zero',
        name: 'Emergency Fund',
        targetAmount: 0,
        currentAmount: 100,
        category: 'emergency',
      } as SavingsGoal;

      const negTargetGoal = {
        id: 'goal-neg',
        name: 'Vacation',
        targetAmount: -500,
        currentAmount: 100,
        category: 'vacation',
      } as SavingsGoal;

      const nanTargetGoal = {
        id: 'goal-nan',
        name: 'New Car',
        targetAmount: NaN,
        currentAmount: 0,
        category: 'purchase',
      } as unknown as SavingsGoal;

      await db.put('savingsGoals', zeroTargetGoal);
      await db.put('savingsGoals', negTargetGoal);
      await db.put('savingsGoals', nanTargetGoal);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repairedZero = await db.get('savingsGoals', 'goal-zero');
      const repairedNeg = await db.get('savingsGoals', 'goal-neg');
      const repairedNan = await db.get('savingsGoals', 'goal-nan');

      expect(repairedZero?.targetAmount).toBe(1000);
      expect(repairedNeg?.targetAmount).toBe(1000);
      expect(repairedNan?.targetAmount).toBe(1000);
    });

    it('repairs negative or NaN currentAmount to 0', async () => {
      const db = await getDB();
      const negCurrentGoal = {
        id: 'goal-neg-curr',
        name: 'Tech Upgrade',
        targetAmount: 50000,
        currentAmount: -1000,
        category: 'purchase',
      } as SavingsGoal;

      const nanCurrentGoal = {
        id: 'goal-nan-curr',
        name: 'Investment',
        targetAmount: 100000,
        currentAmount: NaN,
        category: 'investment',
      } as unknown as SavingsGoal;

      await db.put('savingsGoals', negCurrentGoal);
      await db.put('savingsGoals', nanCurrentGoal);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repairedNeg = await db.get('savingsGoals', 'goal-neg-curr');
      const repairedNan = await db.get('savingsGoals', 'goal-nan-curr');

      expect(repairedNeg?.currentAmount).toBe(0);
      expect(repairedNan?.currentAmount).toBe(0);
    });
  });

  describe('Debts repair', () => {
    it('repairs NaN or negative balance to 0', async () => {
      const db = await getDB();
      const nanBalanceDebt = {
        id: 'debt-nan-bal',
        name: 'Credit Card',
        balance: NaN,
        apr: 18,
        minimumPayment: 1000,
        type: 'credit_card',
      } as unknown as Debt;

      const negBalanceDebt = {
        id: 'debt-neg-bal',
        name: 'Personal Loan',
        balance: -5000,
        apr: 12,
        minimumPayment: 500,
        type: 'personal_loan',
      } as Debt;

      await db.put('debts', nanBalanceDebt);
      await db.put('debts', negBalanceDebt);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repairedNan = await db.get('debts', 'debt-nan-bal');
      const repairedNeg = await db.get('debts', 'debt-neg-bal');

      expect(repairedNan?.balance).toBe(0);
      expect(repairedNeg?.balance).toBe(0);
    });

    it('repairs NaN or negative minimumPayment to 0', async () => {
      const db = await getDB();
      const negMinPayDebt = {
        id: 'debt-neg-min',
        name: 'Car Loan',
        balance: 200000,
        apr: 4.5,
        minimumPayment: -100,
        type: 'car_loan',
      } as Debt;

      const nanMinPayDebt = {
        id: 'debt-nan-min',
        name: 'Student Loan',
        balance: 100000,
        apr: 3.0,
        minimumPayment: NaN,
        type: 'personal_loan',
      } as unknown as Debt;

      await db.put('debts', negMinPayDebt);
      await db.put('debts', nanMinPayDebt);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repairedNeg = await db.get('debts', 'debt-neg-min');
      const repairedNan = await db.get('debts', 'debt-nan-min');

      expect(repairedNeg?.minimumPayment).toBe(0);
      expect(repairedNan?.minimumPayment).toBe(0);
    });
  });

  describe('Expenses repair', () => {
    it('repairs expense with NaN/negative amount to 0 and missing category to other', async () => {
      const db = await getDB();
      const corruptExpense = {
        id: 'exp-corrupt',
        date: '2026-07-23',
        merchant: 'Unclear Store',
        amount: -250,
        source: 'manual',
      } as unknown as ExpenseEntry;

      await db.put('expenses', corruptExpense);

      const result = await auditAndRepairDatabase();

      expect(result.status).toBe('repaired');

      const repaired = await db.get('expenses', 'exp-corrupt');
      expect(repaired?.amount).toBe(0);
      expect(repaired?.category).toBe('other');
    });
  });
});
