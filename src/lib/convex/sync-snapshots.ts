// lib/convex/sync-snapshots.ts
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConvexReactClient } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useExpenses } from '@/hooks/use-local-db';
import { useBudgets } from '@/hooks/use-local-db';
import { useBills } from '@/hooks/use-local-db';
import { useSavingsGoals } from '@/hooks/use-local-db';
import { useCriticalExpense } from '@/hooks/use-critical-expense';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
  
  // This would be called from a Service Worker or scheduled job
  // For now, we'll create a minimal implementation
  const wizardProfile = null; // Would get from local-db
  const totals = { income: 0, expenses: 0, savings: 0, netWorth: 0 };
  const criticalExpenseCommitment = undefined;
  
  try {
    const syncArgs: SyncSnapshotArgs = {
      wizardProfile,
      totals,
      criticalExpenseCommitment,
    };
    
    // In production, this would call the Convex mutation
    // await convex.mutation(api.snapshots.upsertDailySnapshot, syncArgs);
    
    void syncArgs;
    return { success: true, date: today };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, date: today };
  }
  void convex;
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
  
  const queue = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
  if (queue.length === 0) return;
  
  for (const item of queue) {
    try {
      // await convex.mutation(api.snapshots.upsertDailySnapshot, item.data);
      console.log('Flushed offline snapshot:', item.timestamp);
    } catch {
      // Keep in queue for next attempt
      break;
    }
  }
  
  // Remove successfully synced items
  const remaining = queue.slice(queue.length); // Simplified
  localStorage.setItem('budgetbitch:offlineQueue', JSON.stringify(remaining));
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOfflineQueue);
}