// hooks/use-shared-board.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  serializeBoard,
  replaceBoardData,
  type BoardSnapshot,
} from '@/lib/db/local-db';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';

const PUSH_DEBOUNCE_MS = 800;
const BOARD_QUEUE_KEY = 'budgetbitch:boardQueue';

type QueuedPush = { data: BoardSnapshot; updatedAt: number };

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
  isLinked: boolean;
  boardId: string | null;
  lastSyncedAt: number | null;
  linkByCode: (code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  unlink: () => Promise<void>;
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

  const ensureProfile = useMutation(api.sharedBoards.ensureProfile);
  const pushBoard = useMutation(api.sharedBoards.pushBoard);
  const linkByCodeMut = useMutation(api.sharedBoards.linkByCode);
  const unlinkMut = useMutation(api.sharedBoards.unlink);
  const convex = useConvex();

  // Ensure a profile (shareCode) exists once authenticated.
  useEffect(() => {
    if (isAuthenticated && myProfile === null) {
      ensureProfile().catch(() => {});
    }
  }, [isAuthenticated, myProfile, ensureProfile]);

  // PULL: apply remote board when newer than what we last applied.
  useEffect(() => {
    if (!board) return;
    if (board.updatedAt <= lastAppliedAt.current) return;
    if (applyingRemote.current) return;

    const apply = async () => {
      applyingRemote.current = true;
      try {
        if (board.data) {
          await replaceBoardData(board.data as BoardSnapshot);
        }
        lastAppliedAt.current = board.updatedAt;
        setLastSyncedAt(board.updatedAt);
      } finally {
        applyingRemote.current = false;
      }
    };
    void apply();
  }, [board]);

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
    if (!boardId) return;
    if (typeof window === 'undefined') return;

    const doPush = async () => {
      const updatedAt = Date.now();
      const data = await serializeBoard();
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

    const onChanged = () => {
      if (applyingRemote.current) return; // don't echo a remote pull back
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(doPush, PUSH_DEBOUNCE_MS);
    };

    window.addEventListener(BOARD_CHANGED_EVENT, onChanged);
    window.addEventListener('online', flushQueue);
    return () => {
      window.removeEventListener(BOARD_CHANGED_EVENT, onChanged);
      window.removeEventListener('online', flushQueue);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [boardId, pushBoard, flushQueue]);

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

  return {
    myProfile: myProfile
      ? {
          shareCode: myProfile.shareCode,
          displayName: myProfile.displayName,
          linkedBoardId: myProfile.linkedBoardId,
        }
      : null,
    isLinked: !!boardId,
    boardId,
    lastSyncedAt,
    linkByCode,
    unlink,
    resolving,
  };
}
