// lib/convex/sync-snapshots.ts
'use client';

import { ConvexReactClient } from 'convex/react';
import {
  getWizardProfile,
  getExpenses,
  getAllBudgets,
  getLatestNetWorthSnapshot,
  getCriticalExpenseCommitment,
  getDB,
  USER_DATA_STORES,
  RESET_TOMBSTONE_KEY,
} from '@/lib/db/local-db';
import { calculateNetWorthBaseline } from '@/lib/utils/budget-calculator';
import type { WizardProfile } from '@/lib/types/budget';
import { api } from '../../../convex/_generated/api';
import { getCurrentAccountId } from '@/lib/db/accountStorage';
import { compactQueueByDate, backoffWithJitter } from './sync-queue-compaction';

import { convex as sharedConvexClient } from '@/components/providers/convex-client-provider';

function getConvexClient(): ConvexReactClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || (!url.startsWith('http:') && !url.startsWith('https:'))) {
    return null;
  }
  return sharedConvexClient;
}

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes('convexAuthJWT')) {
      const val = localStorage.getItem(k);
      if (val && val !== 'null' && val !== 'undefined' && val.trim().length > 10) {
        return true;
      }
    }
  }
  return false;
}

interface SyncSnapshotTotals {
  income: number;
  expenses: number;
  savings: number;
  netWorth?: number;
}

interface SyncSnapshotArgs {
  wizardProfile: WizardProfile | null;
  totals: SyncSnapshotTotals;
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
  fullBackupData?: Record<string, unknown[]>;
  storeCounts?: Record<string, number>;
}

export interface GatherResult {
  accountId: string;
  wizardProfile: WizardProfile | null;
  totals: SyncSnapshotTotals;
  criticalExpenseCommitment?: SyncSnapshotArgs['criticalExpenseCommitment'];
  fullBackupData?: Record<string, unknown[]>;
  storeCounts?: Record<string, number>;
}

/** Shape accepted by restoreFromCloudSnapshot; only the backup payload is needed. */
export interface CloudSnapshot {
  accountId?: string;
  fullBackupData?: Record<string, unknown[]>;
}

// Single source of truth for the daily snapshot payload. Previously duplicated
// in both the try and catch branches of syncDailySnapshot (C3).
export async function gatherSnapshotData(): Promise<GatherResult> {
  const profile = await getWizardProfile();
  const budgets = await getAllBudgets();
  const expensesList = await getExpenses();
  const latestNetWorth = await getLatestNetWorthSnapshot();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // 'YYYY-MM'
  const criticalExpense = await getCriticalExpenseCommitment(currentMonth);

  // Calculate income: wizard profile income, or fallback to budget limit for savings, or default 50000
  const income = profile?.answers?.income || budgets.find((b) => b.category === 'savings')?.monthlyLimit || 50000;

  // Calculate expenses: sum of all expenses logged this month
  const currentMonthExpenses = expensesList.filter((e) => e.date && e.date.startsWith(currentMonth));
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

  const totals: SyncSnapshotTotals = { income, expenses, savings, netWorth };

  const criticalExpenseCommitment = criticalExpense
    ? {
        expenseKey: criticalExpense.expenseKey,
        estimatedMonthlyCost: criticalExpense.estimatedMonthlyCost,
        status: criticalExpense.status,
        compoundProjection: {
          oneYear: criticalExpense.compoundProjection.oneYear,
          fiveYears: criticalExpense.compoundProjection.fiveYears,
          tenYears: criticalExpense.compoundProjection.tenYears,
        },
      }
    : undefined;

  // Gather full backup data from all local IndexedDB stores
  const fullBackupData: Record<string, unknown[]> = {};
  const storeCounts: Record<string, number> = {};
  
  try {
    const db = await getDB();
    for (const storeName of USER_DATA_STORES) {
      if (!db.objectStoreNames || db.objectStoreNames.contains(storeName)) {
        const list = await db.getAll(storeName);
        fullBackupData[storeName] = list;
        storeCounts[storeName] = list.length;
      }
    }
    if (!db.objectStoreNames || db.objectStoreNames.contains('settings')) {
      const settingsList = await db.getAll('settings');
      fullBackupData['settings'] = settingsList;
      storeCounts['settings'] = settingsList.length;
    }
  } catch (err) {
    console.error('Failed to gather full stores for backup snapshot:', err);
  }

  // Keep the backup under Convex's 1MB document limit (see capBackup).
  const cappedBackup = capBackup(fullBackupData);
  const recomputedCounts: Record<string, number> = {};
  for (const [k, v] of Object.entries(cappedBackup)) {
    if (Array.isArray(v)) recomputedCounts[k] = v.length;
  }

  return {
    accountId: await getCurrentAccountId(),
    wizardProfile: profile || null,
    totals,
    criticalExpenseCommitment,
    fullBackupData: cappedBackup,
    storeCounts: recomputedCounts,
  };
}

function sanitizeForConvex<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// Convex caps each document at ~1MB. fullBackupData is the entire serialized
// IndexedDB, which for heavy users blows past that limit — the insert then
// throws "document too large" as a bare Server Error, and because the offline
// queue only deletes items on success, the same oversized payload re-flushes
// forever. Cap the backup to a safe budget; if it exceeds, drop the oldest
// records (per store) until it fits. storeCounts is recomputed from the
// surviving records so the cloud metadata stays honest.
const MAX_BACKUP_BYTES = 900 * 1024;

function byteLength(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}

function capBackup(fullBackupData: Record<string, unknown[]>): Record<string, unknown[]> {
  const size = byteLength(fullBackupData);
  if (size <= MAX_BACKUP_BYTES) return fullBackupData;

  console.warn(
    `[Sync] Full backup is ${(size / 1024).toFixed(0)}KB (cap ${MAX_BACKUP_BYTES / 1024}KB); trimming oldest records per store.`
  );
  const capped: Record<string, unknown[]> = { ...fullBackupData };
  let current = size;
  // Progressively keep only the most recent half of the largest store.
  while (current > MAX_BACKUP_BYTES) {
    const stores = Object.keys(capped).filter((k) => Array.isArray(capped[k]) && capped[k].length > 1);
    if (stores.length === 0) break;
    const largest = stores.reduce((a, b) => (capped[a].length >= capped[b].length ? a : b));
    const arr = capped[largest];
    capped[largest] = arr.slice(Math.ceil(arr.length / 2));
    current = byteLength(capped);
  }
  return capped;
}

export async function syncDailySnapshot(): Promise<{ success: boolean; date: string }> {
  const today = new Date().toISOString().split('T')[0];
  // Single-flight guard: the debounced auto-backup (account-sync-mount) can fire
  // at the same time as a manual "Sync Now" press or wizard completion; drop the
  // second concurrent entry so we don't gather + push the snapshot twice.
  if (isSyncingDaily) return { success: false, date: today };
  isSyncingDaily = true;

  try {
    const syncArgs = sanitizeForConvex(await gatherSnapshotData());

    const convex = getConvexClient();
    if (!convex) {
      console.debug('Convex is not configured. Queueing snapshot offline.');
      await queueOfflineSnapshot(syncArgs);
      return { success: false, date: today };
    }

    if (!hasAuthToken()) {
      console.debug('User is not authenticated yet. Queueing snapshot offline.');
      await queueOfflineSnapshot(syncArgs);
      return { success: false, date: today };
    }

    await convex.mutation(api.snapshots.upsertDailySnapshot, syncArgs);
    return { success: true, date: today };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Authentication required") || errorMessage.includes("Authentication") || errorMessage.includes("Unauthenticated")) {
      console.debug('User is not authenticated yet. Queueing snapshot offline.');
    } else {
      console.error('Sync failed:', error);
    }
    // Queue the snapshot offline so it can retry once connectivity returns.
    try {
      await queueOfflineSnapshot(await gatherSnapshotData());
    } catch (queueErr) {
      console.error('Failed to queue offline snapshot:', queueErr);
    }

    return { success: false, date: today };
  } finally {
    isSyncingDaily = false;
  }
}

// Service Worker registration
export function registerSyncWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    // In-app webviews (LINE, WhatsApp, etc.) often break the SW + cookie auth;
    // skip registration there to avoid hijacked fetches and stale shells.
    !/Line\/|WhatsApp|FBAN|FBAV|Instagram|LinkedInApp|Telegram/i.test(
      navigator.userAgent,
    )
  ) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.debug('SW registered:', registration.scope);
      
      // Request periodic sync if supported
      if ('periodicSync' in registration) {
        interface PeriodicSyncManager {
          register(tag: string, options?: { minInterval?: number }): Promise<void>;
        }
        const periodicSync = (registration as ServiceWorkerRegistration & {
          periodicSync: PeriodicSyncManager;
        }).periodicSync;
        periodicSync.register('daily-snapshot', {
          minInterval: 24 * 60 * 60 * 1000,
        }).catch((err: unknown) => {
          console.debug('Periodic sync not available:', err);
        });
      }
    }).catch((err) => {
      console.error('SW registration failed:', err);
    });
  }
}

// Offline queue for when user is offline (using IndexedDB to avoid localStorage quota limits)
export async function getOfflineQueueCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const db = await getDB();
    return await db.count('syncQueue');
  } catch {
    return 0;
  }
}

export async function queueOfflineSnapshot(data: SyncSnapshotArgs) {
  if (typeof window === 'undefined') return;
  
  const cleanData = sanitizeForConvex(data);
  try {
    const db = await getDB();
    await db.add('syncQueue', {
      data: cleanData,
      timestamp: Date.now(),
      failCount: 0,
    });
  } catch (err) {
    console.error('Failed to queue offline snapshot in IndexedDB:', err);
  }
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    await flushOfflineQueue();
  }
}

let isFlushingQueue = false;
// Single-flight guards for sibling sync paths (RELIABILITY_HARDENING_PLAN step 3):
// a debounced auto-backup + manual "Sync Now"/wizard-complete can race, and the
// latestSnapshot query can re-fire before the host effect's restoredSnapshotIdRef
// is set, so two near-simultaneous runs could both clear + overwrite local stores.
let isSyncingDaily = false;
let isRestoringSnapshot = false;

export async function flushOfflineQueue() {
  if (typeof window === "undefined" || isFlushingQueue) return;

  const convex = getConvexClient();
  if (!convex) {
    console.debug('Convex is not configured. Cannot flush offline queue.');
    return;
  }

  if (!hasAuthToken()) {
    console.debug('User is not authenticated yet. Postponing offline queue flush.');
    return;
  }

  isFlushingQueue = true;
  try {
    const db = await getDB();
    const items = compactQueueByDate(await db.getAll('syncQueue'));
    if (items.length === 0) return;
    
    for (const item of items) {
      try {
        const cleanData = sanitizeForConvex(item.data);
        await convex.mutation(api.snapshots.upsertDailySnapshot, cleanData as never);
        if (item.id !== undefined) {
          await db.delete('syncQueue', item.id);
        }
        console.debug('Flushed offline snapshot:', item.timestamp);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Authentication required") || errorMessage.includes("Authentication") || errorMessage.includes("Unauthenticated")) {
          console.log('User is not authenticated yet. Postponing offline queue flush.');
          break;
        } else {
          console.error('Failed to flush offline snapshot:', error);
          // Permanently-failing items (e.g. a payload that exceeds Convex's
          // 1MB doc limit even after capping) would otherwise re-flush on every
          // online event forever. Track failures and drop after a few tries so
          // the queue can't wedge the app in an infinite error loop.
          const fails = ((item as { failCount?: number }).failCount ?? 0) + 1;
          if (item.id !== undefined && fails >= 3) {
            await db.delete('syncQueue', item.id);
            console.warn(`Dropped permanently-failing offline snapshot after ${fails} attempts.`);
          } else if (item.id !== undefined) {
            await db.put('syncQueue', { ...item, failCount: fails });
            // Back off before the next online-event retry so we don't hammer
            // the server at a fixed cadence; full jitter spreads concurrent flushes.
            await new Promise((r) => setTimeout(r, backoffWithJitter(fails - 1)));
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to read syncQueue from IndexedDB:', err);
  } finally {
    isFlushingQueue = false;
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOfflineQueue);
}

/**
 * Restores local IndexedDB stores from a Convex cloud snapshot payload.
 */
export async function restoreFromCloudSnapshot(
  snapshot: CloudSnapshot,
  opts: { force?: boolean } = {}
): Promise<boolean> {
  if (!snapshot || !snapshot.fullBackupData) {
    console.warn('[Sync] Cannot restore: Snapshot contains no backup data');
    return false;
  }

  // Honor the "Reset all data" tombstone. A reset wipes local stores but the
  // cloud snapshot can still carry the deleted data; without this guard the
  // auto-restore (AccountSyncMount) would silently re-inject the very entries
  // the user just wiped. Centralize the check HERE so the auto path is always
  // protected. The manual "Restore from cloud" button passes force:true — it is
  // an explicit user choice to recover data, so it may override the tombstone.
  const resetAt = Number(
    typeof window !== 'undefined'
      ? localStorage.getItem(RESET_TOMBSTONE_KEY) || '0'
      : '0'
  );
  const snapshotTime = (snapshot as { createdAt?: number }).createdAt ?? 0;
  if (!opts.force && resetAt > 0 && snapshotTime > 0 && snapshotTime <= resetAt) {
    console.log('[Sync] Skipping cloud restore: snapshot predates last reset.');
    return false;
  }
  // Single-flight guard: the latestSnapshot query can re-fire (the host effect's
  // restoredSnapshotIdRef is set only AFTER this resolves), so two near-simultaneous
  // runs could both clear + overwrite the local stores. Drop the second concurrent
  // entry; the in-flight restore already covers it.
  if (isRestoringSnapshot) return false;
  isRestoringSnapshot = true;
  try {
    const db = await getDB();
    const backup = snapshot.fullBackupData;

    // Account-aware restore: under the multi-board swap model the 8 flat
    // stores ALWAYS hold the ACTIVE account. If we just overwrite them, the
    // switch model would later stash this (possibly foreign) data over the
    // real active account's stash and push it to other members.
    // So: stash the currently-active board first, then point the active
    // account at the snapshot's accountId (fall back to whatever is current).
    if (snapshot.accountId) {
      try {
        const { getCurrentAccountId, stashCurrentAccount, setCurrentAccountId } =
          await import('@/lib/db/accountStorage');
        const activeId = await getCurrentAccountId();
        if (activeId !== snapshot.accountId) {
          await stashCurrentAccount(activeId);
        }
        await setCurrentAccountId(snapshot.accountId);
      } catch (e) {
        console.warn('[Sync] Account-aware restore bookkeeping failed; restoring into active stores only:', e);
      }
    }

    // Clear and restore each store
    const allStores = [...USER_DATA_STORES, 'settings'] as const;
    const activeStores = db.objectStoreNames
      ? allStores.filter((store) => db.objectStoreNames.contains(store))
      : [...allStores];
    if (activeStores.length > 0) {
      const tx = db.transaction([...activeStores], 'readwrite');
      for (const store of activeStores) {
        await tx.objectStore(store).clear();
      }
      await tx.done;
    }

    for (const store of allStores) {
      const items = backup[store];
      if (Array.isArray(items)) {
        for (const item of items) {
          // wizardProfile & settings have no keyPath; restore under their
          // fixed 'current' key so the app (which only reads 'current') sees them.
          if (
            (store === 'wizardProfile' || store === 'settings') &&
            item && typeof item === 'object' &&
            !('id' in (item as Record<string, unknown>))
          ) {
            await db.put(store, item as never, 'current' as never);
          } else {
            await db.put(store, item as never);
          }
        }
      }
    }
    console.log('[Sync] Database restored successfully from cloud snapshot');
    return true;
  } catch (err) {
    console.error('Failed to restore from cloud snapshot:', err);
    return false;
  } finally {
    isRestoringSnapshot = false;
  }
}