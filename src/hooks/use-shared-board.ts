// hooks/use-shared-board.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  serializeBoardForSync,
  applyRemoteBoard,
} from '@/lib/db/local-db';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';
import {
  getCurrentAccountId,
  getLocalAccount,
  getLocalAccounts,
} from '@/lib/db/accountStorage';

const PUSH_DEBOUNCE_MS = 800;
const BOARD_QUEUE_KEY = 'budgetbitch:boardQueue';

type QueuedPush = { data: Record<string, { value: unknown; updatedAt: number }>; updatedAt: number };

function readQueue(): QueuedPush[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(BOARD_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedPush[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOARD_QUEUE_KEY, JSON.stringify(items));
}

export interface UseSharedBoard {
  myProfile: { shareCode: string | null; displayName: string | null; linkedBoardId: string | null } | null;
  partnerName: string | null;
  isLinked: boolean;
  boardId: string | null;
  lastSyncedAt: number | null;
  pendingCount: number;
  linkByCode: (code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  unlink: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolving: boolean;
}

/**
 * Drives 2-way couple sync:
 * - PULL: subscribes to the shared board; when remote updatedAt is newer, replaces local data.
 * - PUSH: listens for local board edits (debounced) and pushes via LWW; queues offline.
 * Mount app-wide so sync runs on every page while linked.
 */
export function useSharedBoard(): UseSharedBoard {
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const lastAppliedAt = useRef<number>(0);
  const applyingRemote = useRef<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myProfile = useQuery(
    api.sharedBoards.getMyProfile,
    isAuthenticated ? {} : 'skip',
  );

  const boardId = myProfile?.linkedBoardId ?? null;
  const board = useQuery(
    api.sharedBoards.getBoard,
    boardId ? { boardId } : 'skip',
  );
  const partner = useQuery(
    api.sharedBoards.getPartner,
    isAuthenticated ? {} : 'skip',
  );

  const ensureProfile = useMutation(api.sharedBoards.ensureProfile);
  const pushBoard = useMutation(api.sharedBoards.pushBoard);
  const linkByCodeMut = useMutation(api.sharedBoards.linkByCode);
  const unlinkMut = useMutation(api.sharedBoards.unlink);
  const convex = useConvex();

  // Resolve whether the couple board is the currently active board.
  const checkActiveStatus = useCallback(async () => {
    const activeId = await getCurrentAccountId();
    const activeMeta = await getLocalAccount(activeId);
    const local = await getLocalAccounts();
    if (local.length === 0) {
      setIsActive(true);
      return;
    }
    setIsActive(activeMeta?.boardId === boardId && boardId !== null);
  }, [boardId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkActiveStatus();
  }, [checkActiveStatus]);

  // Listen for account changes/switches to update active status.
  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === "switch") {
        void checkActiveStatus();
      }
    };
    window.addEventListener(BOARD_CHANGED_EVENT, handleSwitch);
    return () => window.removeEventListener(BOARD_CHANGED_EVENT, handleSwitch);
  }, [checkActiveStatus]);

  // Reset lastAppliedAt when boardId changes to avoid using stale pull guards from other boards.
  useEffect(() => {
    lastAppliedAt.current = 0;
  }, [boardId]);

  // Ensure a profile (shareCode) exists once authenticated.
  useEffect(() => {
    if (isAuthenticated && myProfile !== undefined && (myProfile === null || !myProfile.shareCode)) {
      ensureProfile().catch((err) => {
        console.warn('Profile initialization skipped:', err instanceof Error ? err.message : String(err));
      });
    }
  }, [isAuthenticated, myProfile, ensureProfile]);

  // PULL: apply remote board when newer than what we last applied.
  useEffect(() => {
    if (!isActive || !board) return;
    if (board.updatedAt <= lastAppliedAt.current) return;
    if (applyingRemote.current) return;

    const apply = async () => {
      applyingRemote.current = true;
      try {
        if (board.data) {
          await applyRemoteBoard(board.data as Record<string, { value: unknown; updatedAt: number }>);
        }
        lastAppliedAt.current = board.updatedAt;
        setLastSyncedAt(board.updatedAt);
      } finally {
        applyingRemote.current = false;
      }
    };
    void apply();
  }, [isActive, board]);

  const flushQueue = useCallback(async () => {
    const queue = readQueue();
    if (queue.length === 0) return;
    const remaining: QueuedPush[] = [];
    for (const item of queue) {
      try {
        if (!boardId) break;
        const res = await pushBoard({
          boardId,
          data: item.data,
          updatedAt: item.updatedAt,
        });
        if (res.applied) {
          setLastSyncedAt(item.updatedAt);
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
  }, [boardId, pushBoard]);

  // PUSH: debounce local edits, then push (or queue if offline).
  useEffect(() => {
    if (!isActive || !boardId) return;
    if (typeof window === 'undefined') return;

    const doPush = async () => {
      const updatedAt = Date.now();
      const data = await serializeBoardForSync();
      if (navigator.onLine) {
        try {
          const res = await pushBoard({ boardId, data, updatedAt });
          if (res.applied) setLastSyncedAt(updatedAt);
        } catch {
          const queue = readQueue();
          queue.push({ data, updatedAt });
          writeQueue(queue);
        }
      } else {
        const queue = readQueue();
        queue.push({ data, updatedAt });
        writeQueue(queue);
      }
    };

    const onChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (
        customEvent.detail?.source === "remote" ||
        customEvent.detail?.source === "switch"
      ) {
        return;
      }
      if (applyingRemote.current) return; // don't echo a remote pull back
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(doPush, PUSH_DEBOUNCE_MS);
    };

    window.addEventListener(BOARD_CHANGED_EVENT, onChanged);
    window.addEventListener('online', flushQueue);
    window.addEventListener('budgetbitch:flushQueues', flushQueue);
    return () => {
      window.removeEventListener(BOARD_CHANGED_EVENT, onChanged);
      window.removeEventListener('online', flushQueue);
      window.removeEventListener('budgetbitch:flushQueues', flushQueue);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isActive, boardId, pushBoard, flushQueue]);

  const linkByCode = useCallback(
    async (code: string) => {
      setResolving(true);
      try {
        const trimmed = code.trim().toUpperCase();
        // Validate the partner code first for a friendly error.
        const resolved = await convex.query(api.sharedBoards.resolveShareCode, {
          code: trimmed,
        });
        if (!resolved.exists) {
          return { ok: false as const, error: 'Share code not found' };
        }
        await linkByCodeMut({ code: trimmed });
        return { ok: true as const };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to link';
        return { ok: false as const, error: message };
      } finally {
        setResolving(false);
      }
    },
    [convex, linkByCodeMut],
  );

  const unlink = useCallback(async () => {
    await unlinkMut({});
  }, [unlinkMut]);

  // Force an immediate push + drain the offline queue.
  const syncNow = useCallback(async () => {
    if (!boardId) return;
    const updatedAt = Date.now();
    const data = await serializeBoardForSync();
    try {
      const res = await pushBoard({ boardId, data, updatedAt });
      if (res.applied) setLastSyncedAt(updatedAt);
    } catch {
      const queue = readQueue();
      queue.push({ data, updatedAt });
      writeQueue(queue);
    }
    await flushQueue();
  }, [boardId, pushBoard, flushQueue]);

  const pendingCount = readQueue().length;

  return {
    myProfile: myProfile
      ? {
          shareCode: myProfile.shareCode,
          displayName: myProfile.displayName,
          linkedBoardId: myProfile.linkedBoardId,
        }
      : null,
    partnerName: partner?.displayName ?? partner?.shareCode ?? null,
    isLinked: !!boardId,
    boardId,
    lastSyncedAt,
    pendingCount,
    linkByCode,
    unlink,
    syncNow,
    resolving,
  };
}
