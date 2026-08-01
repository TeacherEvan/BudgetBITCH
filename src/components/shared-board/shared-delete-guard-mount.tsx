'use client';

import { useEffect, useState } from 'react';
import { SharedDeleteGuardProvider } from './shared-delete-guard-provider';
import { useSharedBoard } from '@/hooks/use-shared-board';
import { useAccounts } from '@/hooks/use-accounts';
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
  const { accounts } = useAccounts();
  const [accountBoardId, setAccountBoardId] = useState<string | null>(null);
  const [accountIsShared, setAccountIsShared] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await getCurrentAccountId();
        if (!cancelled) setActiveAccountId(id ?? null);
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

  // Does the active account board actually have a second member to approve?
  const accountHasPartner = !!accounts.find(
    (a) => a.accountId === activeAccountId && (a.memberCount ?? 1) > 1,
  );

  // Prefer the couple board when it's active; otherwise the active account board.
  const boardId = shared.isLinked && shared.boardId ? shared.boardId : accountBoardId;

  // CRITICAL: a board is only "shared" for delete-consent purposes when there is
  // actually ANOTHER member who can approve. A solo user on a personal account
  // board (or a couple board with no partner linked yet) has nobody to approve,
  // so routing their deletes through two-party consent makes every Delete button
  // a permanent silent no-op. Require a real second member.
  const coupleIsShared = !!(shared.isLinked && shared.boardId && shared.partnerName);
  const isShared = coupleIsShared || (accountIsShared && accountHasPartner);


  return (
    <SharedDeleteGuardProvider boardId={boardId} isShared={isShared}>
      {children}
    </SharedDeleteGuardProvider>
  );
}
