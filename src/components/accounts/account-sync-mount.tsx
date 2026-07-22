// components/accounts/account-sync-mount.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import { useAccountSync } from '@/hooks/use-account-sync';
import { restoreFromCloudSnapshot } from '@/lib/convex/sync-snapshots';
import { getExpenses } from '@/lib/db/local-db';
import { notifyBoardChanged } from '@/lib/types/budget';

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

  useEffect(() => {
    if (!isAuthenticated || !latestSnapshot || restoredRef.current) return;
    if (!latestSnapshot.fullBackupData) return;

    (async () => {
      try {
        const localExpenses = await getExpenses();
        // If local expenses are empty, automatically restore cloud backup so mobile matches desktop
        if (localExpenses.length === 0) {
          console.log('[AccountSyncMount] Auto-restoring latest cloud snapshot for desktop/mobile sync');
          const success = await restoreFromCloudSnapshot(latestSnapshot);
          if (success) {
            restoredRef.current = true;
            notifyBoardChanged('remote');
          }
        }
      } catch (err) {
        console.error('[AccountSyncMount] Failed to auto-restore cloud snapshot:', err);
      }
    })();
  }, [isAuthenticated, latestSnapshot]);

  return null;
}
