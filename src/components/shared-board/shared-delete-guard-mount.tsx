'use client';

import { useEffect, useState } from 'react';
import { SharedDeleteGuardProvider } from './shared-delete-guard-provider';
import { useSharedBoard } from '@/hooks/use-shared-board';
import { getCurrentAccountId, getLocalAccount } from '@/lib/db/accountStorage';
import { PERSONAL_ACCOUNT_ID } from '@/lib/types/accounts';

/**
 * Resolves the ACTIVE shared board (couple board OR the active shared account
 * board) and mounts the two-party delete-consent provider around the app.
 *
 * The couple board and the account board are mutually exclusive as the "active"
 * board: the local account system tracks which board is currently open, and the
 * couple board only counts when it is the active board (handled inside
 * useSharedBoard via isActive). We resolve the active boardId here and treat the
 * app as "shared" when that board is non-null.
 */
export function SharedDeleteGuardMount({ children }: { children: React.ReactNode }) {
  const shared = useSharedBoard();
  const [accountBoardId, setAccountBoardId] = useState<string | null>(null);
  const [accountIsShared, setAccountIsShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await getCurrentAccountId();
        if (id && id !== PERSONAL_ACCOUNT_ID) {
          const meta = await getLocalAccount(id);
          if (meta?.boardId) {
            if (!cancelled) {
              setAccountBoardId(meta.boardId);
              setAccountIsShared(true);
            }
            return;
          }
        }
        if (!cancelled) {
          setAccountBoardId(null);
          setAccountIsShared(false);
        }
      } catch {
        if (!cancelled) {
          setAccountBoardId(null);
          setAccountIsShared(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefer the couple board when it's active; otherwise the active account board.
  const boardId = shared.isLinked && shared.boardId ? shared.boardId : accountBoardId;
  const isShared = !!(shared.isLinked && shared.boardId) || accountIsShared;

  return (
    <SharedDeleteGuardProvider boardId={boardId} isShared={isShared}>
      {children}
    </SharedDeleteGuardProvider>
  );
}
