// hooks/use-account-sync.ts
//
// Syncs the ACTIVE account's shared board (the multi-member Accounts feature)
// with Convex using the same Last-Write-Wins engine as the legacy couple board.
//
// Differs from useSharedBoard only in WHICH board it targets:
//   - useSharedBoard targets the couple board (from userProfiles.linkedBoardId).
//   - useAccountSync targets the active account board, derived from local
//     storage (getCurrentAccountId → localAccounts meta → boardId).
//
// The 8 flat user-data stores already hold the active board's data (the swap
// model in accountStorage.ts), so the local serialize/apply helpers are shared.
//
// For the personal board (no boardId) this is a no-op.

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  serializeBoardForSync,
  applyRemoteBoard,
} from "@/lib/db/local-db";
import {
  getCurrentAccountId,
  getLocalAccount,
  getStashedAccount,
} from "@/lib/db/accountStorage";
import { BOARD_CHANGED_EVENT } from "@/lib/types/budget";

const BOARD_QUEUE_KEY = "budgetbitch:accountBoardQueue";
const PUSH_DEBOUNCE_MS = 800;

export interface QueuedPush {
  boardId: string;
  data: Record<string, { value: unknown; updatedAt: number }>;
  updatedAt: number;
}

export interface UseAccountSync {
  boardId: string | null;
  loading: boolean;
  syncing: boolean;
  pushPending: boolean;
  lastError: string | null;
}

function getQueue(): QueuedPush[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOARD_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(q: QueuedPush[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOARD_QUEUE_KEY, JSON.stringify(q));
}

function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return window.navigator.onLine;
}

export function useAccountSync(): UseAccountSync {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pushPending, setPushPending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const getBoard = useQuery(api.accounts.getAccountBoard, boardId ? { boardId } : "skip");
  const pushBoard = useMutation(api.accounts.pushAccountBoard);

  // Guard so a reactive re-fire of getAccountBoard (e.g. our own push echoed
  // back) doesn't re-apply an already-applied board and clobber local edits.
  const lastAppliedAt = useRef<number>(0);
  const applyingRemote = useRef<boolean>(false);
  // Latest boardId in a ref so the push path always reads the current value
  // (avoids stale closures when the edit listener fires before a re-render).
  const boardIdRef = useRef<string | null>(null);

  // Resolve the active account's boardId from local storage.
  const resolveActiveBoard = useCallback(async () => {
    const accountId = await getCurrentAccountId();
    const meta = await getLocalAccount(accountId);
    boardIdRef.current = meta?.boardId ?? null;
    setBoardId(meta?.boardId ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await resolveActiveBoard();
      if (cancelled) return;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolveActiveBoard]);

  // Reset lastAppliedAt when boardId switches to avoid using stale pull guards from other boards.
  useEffect(() => {
    lastAppliedAt.current = 0;
  }, [boardId]);

  // Push timer (debounce local edits).
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const flushQueue = useCallback(async () => {
    if (!isOnline()) return;
    const q = getQueue();
    if (q.length === 0) return;

    const remaining: QueuedPush[] = [];
    setSyncing(true);
    for (const item of q) {
      try {
        await pushBoard({
          boardId: item.boardId,
          data: item.data as never,
          updatedAt: item.updatedAt,
        });
      } catch (e) {
        console.error("Failed to push queued board:", item.boardId, e);
        remaining.push(item);
      }
    }
    setQueue(remaining);
    setSyncing(false);
    setPushPending(remaining.length > 0);
  }, [pushBoard]);

  const doPush = async () => {
    const bid = boardIdRef.current;
    if (!bid) return;

    if (isOnline()) {
      await flushQueue();
    }

    const updatedAt = Date.now();
    const data = await serializeBoardForSync();

    if (isOnline()) {
      try {
        setSyncing(true);
        await pushBoard({ boardId: bid, data: data as never, updatedAt });
        setLastError(null);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "Push failed");
        // Queue for retry
        const q = getQueue();
        q.push({ boardId: bid, data, updatedAt });
        setQueue(q);
      } finally {
        setSyncing(false);
        setPushPending(false);
      }
    } else {
      const q = getQueue();
      const filtered = q.filter((item) => item.boardId !== bid);
      filtered.push({ boardId: bid, data, updatedAt });
      setQueue(filtered);
      setPushPending(true);
    }
  };

  const schedulePush = () => {
    pendingRef.current = true;
    setPushPending(true);
    
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void doPush();
    }, PUSH_DEBOUNCE_MS);
  };

  // Listen for local board edits → schedule a push. Attached unconditionally;
  // doPush/schedulePush no-op until boardId resolves, so an edit made in the
  // first tick after mount is still captured (no stale-closure loss).
  useEffect(() => {
    const onChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === "switch") {
        void resolveActiveBoard();
        return;
      }
      if (customEvent.detail?.source === "remote") {
        return;
      }
      schedulePush();
    };
    window.addEventListener(BOARD_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(BOARD_CHANGED_EVENT, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveActiveBoard]);

  // Replay queued pushes when back online or requested by SW.
  useEffect(() => {
    const onOnline = () => {
      if (isOnline()) {
        void flushQueue();
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("budgetbitch:flushQueues", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("budgetbitch:flushQueues", onOnline);
    };
  }, [flushQueue]);

  // Pull: apply a newer remote board into local storage.
  useEffect(() => {
    if (!boardId || getBoard === undefined) return;
    if (getBoard === null) return; // no remote board yet
    const remote = getBoard as {
      boardId: string;
      updatedAt: number;
      data: Record<string, { value: unknown; updatedAt: number }> | null;
    };
    if (!remote.data) return;
    if (remote.updatedAt <= lastAppliedAt.current) return;
    if (applyingRemote.current) return;

    (async () => {
      applyingRemote.current = true;
      try {
        setSyncing(true);
        await applyRemoteBoard(remote.data as Record<string, { value: unknown; updatedAt: number }>);
        lastAppliedAt.current = remote.updatedAt;
        setLastError(null);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "Pull failed");
      } finally {
        applyingRemote.current = false;
        setSyncing(false);
      }
    })();
  }, [boardId, getBoard]);

  return { boardId, loading, syncing, pushPending, lastError };
}
