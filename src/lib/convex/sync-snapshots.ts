// lib/convex/sync-snapshots.ts
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConvexReactClient } from 'convex/react';
import { 
  getWizardProfile, 
  getExpenses, 
  getAllBudgets, 
  getLatestNetWorthSnapshot, 
  getCriticalExpenseCommitment 
} from '@/lib/db/local-db';
import { calculateNetWorthBaseline } from '@/lib/utils/budget-calculator';
import { api } from '../../../convex/_generated/api';

let clientInstance: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient | null {
  if (clientInstance) return clientInstance;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || (!url.startsWith('http:') && !url.startsWith('https:'))) {
    return null;
  }
  try {
    clientInstance = new ConvexReactClient(url);
    return clientInstance;
  } catch (error) {
    console.error('Failed to initialize Convex client:', error);
    return null;
  }
}

interface SyncSnapshotArgs {
  wizardProfile: any;
  totals: {
    income: number;
    expenses: number;
    savings: number;
    netWorth?: number;
  };
  criticalExpenseCommitment?: {
    expenseKey: string;
    estimatedMonthlyCost: number;
    status: string;
    compoundProjection: {
      oneYear: number;
      fiveYears: number;
      tenYears: number;
    };
  };
}

export async function syncDailySnapshot(): Promise<{ success: boolean; date: string }> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const profile = await getWizardProfile();
    const budgets = await getAllBudgets();
    const expensesList = await getExpenses();
    const latestNetWorth = await getLatestNetWorthSnapshot();
    const currentMonth = today.slice(0, 7); // 'YYYY-MM'
    const criticalExpense = await getCriticalExpenseCommitment(currentMonth);
    
    // Calculate income: wizard profile income, or fallback to budget limit for savings, or default 50000
    const income = profile?.answers?.income || budgets.find(b => b.category === 'savings')?.monthlyLimit || 50000;
    
    // Calculate expenses: sum of all expenses logged this month
    const currentMonthExpenses = expensesList.filter(e => e.date && e.date.startsWith(currentMonth));
    const expenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate savings: income - expenses (must be >= 0)
    const savings = Math.max(0, income - expenses);
    
    // Net worth: latest snapshot net worth, or baseline derived from profile, or 0
    let netWorth = 0;
    if (latestNetWorth) {
      const assetsTotal = latestNetWorth.assets?.reduce((sum, a) => sum + a.value, 0) || 0;
      const liabilitiesTotal = latestNetWorth.liabilities?.reduce((sum, l) => sum + l.value, 0) || 0;
      netWorth = assetsTotal - liabilitiesTotal;
    } else if (profile) {
      const baseline = calculateNetWorthBaseline(profile);
      netWorth = baseline.assets - baseline.liabilities;
    }
    
    const totals = { income, expenses, savings, netWorth };
    
    const criticalExpenseCommitment = criticalExpense ? {
      expenseKey: criticalExpense.expenseKey,
      estimatedMonthlyCost: criticalExpense.estimatedMonthlyCost,
      status: criticalExpense.status,
      compoundProjection: {
        oneYear: criticalExpense.compoundProjection.oneYear,
        fiveYears: criticalExpense.compoundProjection.fiveYears,
        tenYears: criticalExpense.compoundProjection.tenYears,
      }
    } : undefined;
    
    const syncArgs: SyncSnapshotArgs = {
      wizardProfile: profile || null,
      totals,
      criticalExpenseCommitment,
    };
    
    // Call the Convex mutation
    const convex = getConvexClient();
    if (convex) {
      await convex.mutation(api.snapshots.upsertDailySnapshot, syncArgs);
      return { success: true, date: today };
    } else {
      console.warn('Convex is not configured. Queueing snapshot offline.');
      await queueOfflineSnapshot(syncArgs);
      return { success: false, date: today };
    }
  } catch (error) {
    console.error('Sync failed:', error);
    // Queue for offline sync if it's a network/mutation failure
    try {
      const profile = await getWizardProfile();
      const budgets = await getAllBudgets();
      const expensesList = await getExpenses();
      const latestNetWorth = await getLatestNetWorthSnapshot();
      const currentMonth = today.slice(0, 7);
      const criticalExpense = await getCriticalExpenseCommitment(currentMonth);
      
      const income = profile?.answers?.income || budgets.find(b => b.category === 'savings')?.monthlyLimit || 50000;
      const currentMonthExpenses = expensesList.filter(e => e.date && e.date.startsWith(currentMonth));
      const expenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const savings = Math.max(0, income - expenses);
      
      let netWorth = 0;
      if (latestNetWorth) {
        const assetsTotal = latestNetWorth.assets?.reduce((sum, a) => sum + a.value, 0) || 0;
        const liabilitiesTotal = latestNetWorth.liabilities?.reduce((sum, l) => sum + l.value, 0) || 0;
        netWorth = assetsTotal - liabilitiesTotal;
      } else if (profile) {
        const baseline = calculateNetWorthBaseline(profile);
        netWorth = baseline.assets - baseline.liabilities;
      }
      
      const totals = { income, expenses, savings, netWorth };
      const criticalExpenseCommitment = criticalExpense ? {
        expenseKey: criticalExpense.expenseKey,
        estimatedMonthlyCost: criticalExpense.estimatedMonthlyCost,
        status: criticalExpense.status,
        compoundProjection: {
          oneYear: criticalExpense.compoundProjection.oneYear,
          fiveYears: criticalExpense.compoundProjection.fiveYears,
          tenYears: criticalExpense.compoundProjection.tenYears,
        }
      } : undefined;
      
      await queueOfflineSnapshot({
        wizardProfile: profile || null,
        totals,
        criticalExpenseCommitment,
      });
    } catch (queueErr) {
      console.error('Failed to queue offline snapshot:', queueErr);
    }
    
    return { success: false, date: today };
  }
}

// Service Worker registration
export function registerSyncWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope);
      
      // Request periodic sync if supported
      if ('periodicSync' in registration) {
        (registration as any).periodicSync.register('daily-snapshot', {
          minInterval: 24 * 60 * 60 * 1000,
        }).catch((err: any) => {
          console.log('Periodic sync not available:', err);
        });
      }
    }).catch((err) => {
      console.error('SW registration failed:', err);
    });
  }
}

// Offline queue for when user is offline
export async function queueOfflineSnapshot(data: SyncSnapshotArgs) {
  if (typeof window === 'undefined') return;
  
  const queue = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
  queue.push({ data, timestamp: Date.now() });
  localStorage.setItem('budgetbitch:offlineQueue', JSON.stringify(queue));
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    await flushOfflineQueue();
  }
}

export async function flushOfflineQueue() {
  if (typeof window === 'undefined') return;
  
  const convex = getConvexClient();
  if (!convex) {
    console.log('Convex is not configured. Cannot flush offline queue.');
    return;
  }

  const queue = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
  if (queue.length === 0) return;
  
  const remaining = [...queue];
  for (const item of queue) {
    try {
      await convex.mutation(api.snapshots.upsertDailySnapshot, item.data);
      console.log('Flushed offline snapshot:', item.timestamp);
      remaining.shift(); // Remove successfully flushed item
    } catch (error) {
      console.error('Failed to flush offline snapshot:', error);
      break;
    }
  }
  
  localStorage.setItem('budgetbitch:offlineQueue', JSON.stringify(remaining));
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOfflineQueue);
}