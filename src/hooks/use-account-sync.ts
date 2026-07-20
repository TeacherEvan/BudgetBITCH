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

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  serializeBoardForSync,
  applyRemoteBoard,
} from "@/lib/db/local-db";
import {
  getCurrentAccountId,
  getLocalAccount,
} from "@/lib/db/accountStorage";
import { BOARD_CHANGED_EVENT } from "@/lib/types/budget";

const BOARD_QUEUE_KEY = "budgetbitch:accountBoardQueue";
const PUSH_DEBOUNCE_MS = 800;

export interface UseAccountSync {
  boardId: string | null;
  loading: boolean;
  syncing: boolean;
  pushPending: boolean;
  lastError: string | null;
}

function getQueue(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOARD_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(q: unknown[]): void {
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
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const accountId = await getCurrentAccountId();
      const meta = await getLocalAccount(accountId);
      if (cancelled) return;
      boardIdRef.current = meta?.boardId ?? null;
      setBoardId(meta?.boardId ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Push timer (debounce local edits).
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  const doPush = async () => {
    const bid = boardIdRef.current;
    if (!bid || !isOnline()) return;
    try {
      setSyncing(true);
      const data = await serializeBoardForSync();
      await pushBoard({ boardId: bid, data: data as never, updatedAt: Date.now() });
      setLastError(null);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Push failed");
      // Queue for retry while offline / on error.
      const q = getQueue();
      q.push({ boardId: bid, at: Date.now() });
      setQueue(q);
    } finally {
      setSyncing(false);
      setPushPending(false);
    }
  };

  const schedulePush = () => {
    const bid = boardIdRef.current;
    pendingRef.current = true;
    setPushPending(true);
    // Offline: queue the edit; it replays on the 'online' event.
    if (!isOnline()) {
      const q = getQueue();
      q.push({ boardId: bid, at: Date.now() });
      setQueue(q);
      return;
    }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void doPush();
    }, PUSH_DEBOUNCE_MS);
  };

  // Listen for local board edits → schedule a push. Attached unconditionally;
  // doPush/schedulePush no-op until boardId resolves, so an edit made in the
  // first tick after mount is still captured (no stale-closure loss).
  useEffect(() => {
    const onChanged = () => schedulePush();
    window.addEventListener(BOARD_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(BOARD_CHANGED_EVENT, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replay queued pushes when back online.
  useEffect(() => {
    const onOnline = () => {
      const q = getQueue();
      if (q.length && isOnline() && boardIdRef.current) {
        setQueue([]);
        void doPush();
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // NOTE: intentionally do NOT call notifyBoardChanged() here. A remote
        // pull must not re-trigger the local push listener (that would echo
        // push → server → pull → push … forever). UI reads local data on its
        // own queries and refreshes on the next render.
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
