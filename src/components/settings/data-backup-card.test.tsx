// components/settings/data-backup-card.test.tsx
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAllData,
  getAllBudgets,
  getExpenses,
  getWizardProfile,
  getLatestNetWorthSnapshot,
  getCriticalExpenseCommitment,
  getLocalWrite,
} from '@/lib/db/local-db';
import { restoreFromCloudSnapshot } from '@/lib/convex/sync-snapshots';

describe('Data Backup & Cloud Snapshot Restore Integrity', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('restores all user data stores from snapshot and stamps localWrites keys accurately', async () => {
    const cloudBackup = {
      wizardProfile: [
        {
          completed: true,
          completedAt: '2026-07-20T00:00:00.000Z',
          version: 1,
          locale: 'en',
          answers: { income: 60000, rent: 10000, currency: 'USD' },
        },
      ],
      expenses: [
        {
          id: 'exp-restored-1',
          date: '2026-08-01',
          category: 'food',
          merchant: 'Supermarket',
          amount: 55.4,
          source: 'manual',
        },
      ],
      budgets: [
        {
          category: 'food' as const,
          monthlyLimit: 600,
          alertAtPct: 80,
        },
      ],
      netWorthSnapshots: [
        {
          date: '2026-08-01',
          assets: [{ id: 'a1', name: 'Cash', value: 5000, type: 'cash' as const }],
          liabilities: [],
          netWorth: 5000,
        },
      ],
      criticalExpenseCommitments: [
        {
          month: '2026-08',
          expenseKey: 'coffee' as const,
          estimatedMonthlyCost: 150,
          committedAt: '2026-08-01T00:00:00.000Z',
          status: 'active' as const,
          compoundProjection: { oneYear: 1800, fiveYears: 9000, tenYears: 18000 },
        },
      ],
    };

    // Restore
    const success = await restoreFromCloudSnapshot({
      fullBackupData: cloudBackup,
      timestamp: Date.now(),
      wizardProfile: cloudBackup.wizardProfile[0],
      totals: { income: 60000, expenses: 55.4, savings: 59944.6, netWorth: 5000 },
    } as never);
    expect(success).toBe(true);

    // Verify stores were populated
    const profile = await getWizardProfile();
    expect(profile?.answers.income).toBe(60000);

    const expenses = await getExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0].id).toBe('exp-restored-1');

    const budgets = await getAllBudgets();
    expect(budgets).toHaveLength(1);
    expect(budgets[0].category).toBe('food');

    const snap = await getLatestNetWorthSnapshot();
    expect(snap?.date).toBe('2026-08-01');

    const comm = await getCriticalExpenseCommitment('2026-08');
    expect(comm?.estimatedMonthlyCost).toBe(150);

    // Verify localWrites timestamps are recorded for EVERY key type (including category/date/month)
    expect(await getLocalWrite('wizardProfile', 'current')).toBeGreaterThan(0);
    expect(await getLocalWrite('expenses', 'exp-restored-1')).toBeGreaterThan(0);
    expect(await getLocalWrite('budgets', 'food')).toBeGreaterThan(0);
    expect(await getLocalWrite('netWorthSnapshots', '2026-08-01')).toBeGreaterThan(0);
    expect(await getLocalWrite('criticalExpenseCommitments', '2026-08')).toBeGreaterThan(0);
  });
});
