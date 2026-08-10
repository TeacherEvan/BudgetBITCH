// hooks/use-purchase-notes.ts
// Client-side CRUD + read for shared purchase notes that live on an account
// board (stored in accountBoards.data under "__purchaseNotes__" by the
// convex/accounts/purchaseNotes.ts mutations/query). Any board member can
// read or write notes on any expense; the Convex layer enforces membership
// and merges concurrent edits via the existing LWW boardMerge.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getCurrentAccountId } from '@/lib/db/accountStorage';
import { getLocalAccounts } from '@/lib/db/accountStorage';
import type { LocalAccountMeta } from '@/lib/types/accounts';

export interface PurchaseNote {
  note: string;
  updatedBy: string; // userId
  updatedAt: number;
}

type NoteMap = Record<string, PurchaseNote>;

/**
 * Resolve the active shared board id (or null for the personal board, which is
 * not shared and therefore has no purchase notes).
 */
async function getActiveBoardId(): Promise<string | null> {
  const currentId = await getCurrentAccountId();
  if (currentId === 'personal') return null;
  const local = await getLocalAccounts();
  const meta = local.find((a: LocalAccountMeta) => a.accountId === currentId);
  return meta?.boardId ?? null;
}

export interface UsePurchaseNotes {
  boardId: string | null;
  notes: NoteMap;
  loading: boolean;
  setNote: (expenseId: string, note: string) => Promise<void>;
  deleteNote: (expenseId: string) => Promise<void>;
}

export function usePurchaseNotes(): UsePurchaseNotes {
  const convex = useConvex();
  const [boardId, setBoardId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const setMut = useMutation(api.accounts.purchaseNotes.setPurchaseNote);
  const delMut = useMutation(api.accounts.purchaseNotes.deletePurchaseNote);

  const notes = (useQuery(
    api.accounts.purchaseNotes.getPurchaseNotes,
    boardId ? { boardId } : 'skip',
  ) ?? null) as NoteMap | null;

  useEffect(() => {
    let cancelled = false;
    getActiveBoardId().then((id) => {
      if (!cancelled) {
        setBoardId(id);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [convex]);

  const setNote = useCallback(
    async (expenseId: string, note: string) => {
      if (!boardId) return;
      await setMut({ boardId, expenseId, note });
    },
    [boardId, setMut],
  );

  const deleteNote = useCallback(
    async (expenseId: string) => {
      if (!boardId) return;
      await delMut({ boardId, expenseId });
    },
    [boardId, delMut],
  );

  return {
    boardId,
    notes: notes ?? {},
    loading: !ready && boardId !== null,
    setNote,
    deleteNote,
  };
}
