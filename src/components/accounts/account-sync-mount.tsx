// components/accounts/account-sync-mount.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import { useAccountSync } from '@/hooks/use-account-sync';
import { restoreFromCloudSnapshot, syncDailySnapshot } from '@/lib/convex/sync-snapshots';
import { getExpenses } from '@/lib/db/local-db';
import { BOARD_CHANGED_EVENT, notifyBoardChanged } from '@/lib/types/budget';

const LAST_RESTORED_KEY = 'bb:lastCloudSnapshotAt';
const SNAPSHOT_DEBOUNCE_MS = 10000; // 10 seconds background debounce

/**
 * Side-effect-only component that drives Accounts-feature board sync
 * and automatic cloud snapshot restoration for authenticated users.
 * Ensures desktop and mobile data stay identical without manual action.
 */
export function AccountSyncMount() {
  useAccountSync();

  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const latestSnapshot = useQuery(
    api.snapshots.getLatestSnapshot,
    isAuthenticated ? {} : 'skip'
  );

  const restoredRef = useRef(false);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !latestSnapshot || restoredRef.current) return;
    if (!latestSnapshot.fullBackupData) return;

    (async () => {
      try {
        const localExpenses = await getExpenses();
        const storedLastRestored = Number(localStorage.getItem(LAST_RESTORED_KEY) || '0');
        const snapshotTime = latestSnapshot.createdAt || 0;

        // Auto-restore if local expenses are empty OR the cloud snapshot is newer than what we previously restored
        if (localExpenses.length === 0 || snapshotTime > storedLastRestored) {
          console.log('[AccountSyncMount] Auto-restoring cloud snapshot for desktop/mobile sync:', snapshotTime);
          const success = await restoreFromCloudSnapshot(latestSnapshot);
          if (success) {
            restoredRef.current = true;
            localStorage.setItem(LAST_RESTORED_KEY, String(snapshotTime));
            notifyBoardChanged('remote');
          }
        }
      } catch (err) {
        console.error('[AccountSyncMount] Failed to auto-restore cloud snapshot:', err);
      }
    })();
  }, [isAuthenticated, latestSnapshot]);

  // Debounced auto-backup of daily snapshot when local data changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const onDataChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === 'remote' || customEvent.detail?.source === 'switch') {
        return;
      }
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = setTimeout(() => {
        void syncDailySnapshot();
      }, SNAPSHOT_DEBOUNCE_MS);
    };

    window.addEventListener(BOARD_CHANGED_EVENT, onDataChanged);
    return () => {
      window.removeEventListener(BOARD_CHANGED_EVENT, onDataChanged);
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    };
  }, [isAuthenticated]);

  return null;
}
