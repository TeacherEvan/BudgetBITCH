'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export type PendingStore = 'expenses' | 'incomes' | 'bills';

export interface PendingDelete {
  pendingId: string;
  boardId: string;
  store: PendingStore;
  itemId: string;
  itemSnapshot?: Record<string, unknown> | null;
  requestedAt: number;
  /** True when the current viewer is the OTHER member and may approve/reject. */
  canAct: boolean;
  /** True when the current viewer raised this request. */
  isRequester: boolean;
}

interface PendingDeleteRow {
  pendingId: string;
  boardId: string;
  store: PendingStore;
  itemId: string;
  itemSnapshot?: Record<string, unknown> | null;
  requestedAt: number;
  canAct: boolean;
  isRequester: boolean;
}

export interface UseSharedDeleteGuard {
  isShared: boolean;
  /** True once the pending list has loaded (or resolved to empty). */
  loaded: boolean;
  /** Raise a delete request. Does NOT delete locally — waits for partner approval. */
  requestDelete: (store: PendingStore, itemId: string, snapshot?: Record<string, unknown>) => Promise<void>;
  /** Approve a partner's pending delete request (executes the delete). */
  approve: (pendingId: string) => Promise<void>;
  /** Reject/cancel a pending delete request. */
  reject: (pendingId: string) => Promise<void>;
  /** Pending requests the current user can act on (the partner's requests). */
  pendingForMe: PendingDelete[];
  /** Pending requests this user raised (awaiting partner approval). */
  pendingByMe: PendingDelete[];
}

/**
 * Two-party consent for deletes on a shared board. When `isShared` is true, a
 * local delete is intercepted: instead of removing the item immediately, we
 * raise a server-side pending request. The item only disappears once the OTHER
 * member approves it (enforced server-side in convex/pendingDeletes.ts).
 *
 * `boardId` should be the active shared board id (couple board or account board).
 */
export function useSharedDeleteGuard(boardId: string | null, isShared: boolean): UseSharedDeleteGuard {
  const requestMut = useMutation(api.pendingDeletes.requestItemDelete);
  const approveMut = useMutation(api.pendingDeletes.approveItemDelete);
  const rejectMut = useMutation(api.pendingDeletes.rejectItemDelete);

  const [pendingForMe, setPendingForMe] = useState<PendingDelete[]>([]);
  const [pendingByMe, setPendingByMe] = useState<PendingDelete[]>([]);
  const [loaded, setLoaded] = useState(false);

  const rows = useQuery(
    api.pendingDeletes.listPendingDeletes,
    isShared && boardId ? { boardId } : 'skip',
  ) as PendingDeleteRow[] | undefined | null;

  useEffect(() => {
    if (!isShared || !boardId) {
      setPendingForMe([]);
      setPendingByMe([]);
      setLoaded(true);
      return;
    }
    if (rows === undefined) return; // still loading
    const mine: PendingDelete[] = [];
    const theirs: PendingDelete[] = [];
    for (const r of rows ?? []) {
      const item: PendingDelete = {
        pendingId: r.pendingId,
        boardId: r.boardId,
        store: r.store,
        itemId: r.itemId,
        itemSnapshot: r.itemSnapshot,
        requestedAt: r.requestedAt,
        canAct: r.canAct,
        isRequester: r.isRequester,
      };
      if (r.canAct) theirs.push(item);
      else mine.push(item);
    }
    setPendingForMe(theirs);
    setPendingByMe(mine);
    setLoaded(true);
  }, [rows, isShared, boardId]);

  const requestDelete = useCallback(
    async (store: PendingStore, itemId: string, snapshot?: Record<string, unknown>) => {
      if (!isShared || !boardId) {
        throw new Error('Not a shared board; caller should delete locally instead');
      }
      await requestMut({ boardId, store, itemId, itemSnapshot: snapshot ?? null });
    },
    [isShared, boardId, requestMut],
  );

  const approve = useCallback(
    async (pendingId: string) => {
      await approveMut({ pendingId: pendingId as never });
    },
    [approveMut],
  );

  const reject = useCallback(
    async (pendingId: string) => {
      await rejectMut({ pendingId: pendingId as never });
    },
    [rejectMut],
  );

  return { isShared, loaded, requestDelete, approve, reject, pendingForMe, pendingByMe };
}
