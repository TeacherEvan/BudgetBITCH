// lib/db/stores/repair-store.ts
import { getDB } from '../local-db';

// Helper sanitizers for database health auditing
function sanitizeNonNegative(val: unknown, fallback = 0): { value: number; patched: boolean } {
  const isInvalid = typeof val !== 'number' || isNaN(val) || val < 0;
  const num = isInvalid ? Math.max(0, Number(val) || fallback) : (val as number);
  return { value: num, patched: isInvalid };
}

function sanitizePositive(val: unknown, fallback: number): { value: number; patched: boolean } {
  const isInvalid = typeof val !== 'number' || isNaN(val) || val <= 0;
  const num = isInvalid ? Math.max(fallback, Number(val) || fallback) : (val as number);
  return { value: num, patched: isInvalid };
}

function sanitizeBoundedDay(val: unknown): { value: number; patched: boolean } {
  const isInvalid = typeof val !== 'number' || isNaN(val) || val < 1 || val > 31;
  const num = isInvalid ? Math.min(31, Math.max(1, Number(val) || 1)) : (val as number);
  return { value: num, patched: isInvalid };
}

/**
 * Database Health Audit & Repair
 * Scans all financial stores for invalid data (NaN, negative, missing required fields)
 * and repairs them in-place.
 */
export async function auditAndRepairDatabase(): Promise<{ status: 'healthy' | 'repaired' | 'failed'; logs: string[] }> {
  const logs: string[] = [];
  try {
    const db = await getDB();
    logs.push('Starting comprehensive database health audit...');

    const budgets = await db.getAll('budgets');
    logs.push(`Found ${budgets.length} budgets.`);

    const expenses = await db.getAll('expenses');
    logs.push(`Found ${expenses.length} expenses.`);

    const incomes = await db.getAll('incomes');
    logs.push(`Found ${incomes.length} income entries.`);

    const bills = await db.getAll('bills');
    logs.push(`Found ${bills.length} bills.`);

    const savingsGoals = await db.getAll('savingsGoals');
    logs.push(`Found ${savingsGoals.length} savings goals.`);

    const debts = await db.getAll('debts');
    logs.push(`Found ${debts.length} debts.`);

    let repairedCount = 0;

    // 1. Audit Expenses
    for (const exp of expenses) {
      const amountRes = sanitizeNonNegative(exp.amount);
      let patched = amountRes.patched;
      if (patched) exp.amount = amountRes.value;

      if (!exp.category) {
        exp.category = 'other';
        patched = true;
      }
      if (patched) {
        await db.put('expenses', exp);
        repairedCount++;
      }
    }

    // 2. Audit Incomes
    for (const inc of incomes) {
      const amountRes = sanitizeNonNegative(inc.amount);
      let patched = amountRes.patched;
      if (patched) inc.amount = amountRes.value;

      if (!inc.frequency) {
        inc.frequency = 'monthly';
        patched = true;
      }
      if (patched) {
        await db.put('incomes', inc);
        repairedCount++;
      }
    }

    // 3. Audit Bills
    for (const bill of bills) {
      const amountRes = sanitizeNonNegative(bill.amount);
      const dueDayRes = sanitizeBoundedDay(bill.dueDay);
      const patched = amountRes.patched || dueDayRes.patched;
      if (patched) {
        bill.amount = amountRes.value;
        bill.dueDay = dueDayRes.value;
        await db.put('bills', bill);
        repairedCount++;
      }
    }

    // 4. Audit Savings Goals
    for (const goal of savingsGoals) {
      const targetRes = sanitizePositive(goal.targetAmount, 1000);
      const currentRes = sanitizeNonNegative(goal.currentAmount);
      const patched = targetRes.patched || currentRes.patched;
      if (patched) {
        goal.targetAmount = targetRes.value;
        goal.currentAmount = currentRes.value;
        await db.put('savingsGoals', goal);
        repairedCount++;
      }
    }

    // 5. Audit Debts
    for (const debt of debts) {
      const balanceRes = sanitizeNonNegative(debt.balance);
      const minPaymentRes = sanitizeNonNegative(debt.minimumPayment);
      const patched = balanceRes.patched || minPaymentRes.patched;
      if (patched) {
        debt.balance = balanceRes.value;
        debt.minimumPayment = minPaymentRes.value;
        await db.put('debts', debt);
        repairedCount++;
      }
    }

    if (repairedCount > 0) {
      logs.push(`Repaired ${repairedCount} corrupted or invalid records across financial stores.`);
      return { status: 'repaired', logs };
    }

    logs.push('All database stores are healthy.');
    return { status: 'healthy', logs };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logs.push(`Audit failed: ${errMessage}`);
    return { status: 'failed', logs };
  }
}