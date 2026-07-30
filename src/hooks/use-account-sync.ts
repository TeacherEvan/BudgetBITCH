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
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import {
  serializeBoardForSync,
  applyRemoteBoard,
} from "@/lib/db/local-db";
import {
  getCurrentAccountId,
  getLocalAccount,
  saveLocalAccount,
} from "@/lib/db/accountStorage";
import { PERSONAL_ACCOUNT_ID, UmbrellaKey } from "@/lib/types/accounts";
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
  /** Force an immediate push of the active board and drain any queued pushes. */
  syncNow: () => Promise<void>;
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
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [boardId, setBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pushPending, setPushPending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const getBoard = useQuery(
    api.accounts.getAccountBoard,
    boardId && isAuthenticated ? { boardId } : "skip"
  );
  const pushBoard = useMutation(api.accounts.pushAccountBoard);
  // Listing of the user's accounts (with server boardId) — used as a fallback
  // when the local accounts cache hasn't been populated yet (e.g. on the
  // dashboard, where useAccounts() isn't mounted). Without this, boardId can
  // resolve to null and every auto-push is silently dropped.
  const myAccounts = useQuery(
    api.accounts.listMyAccounts,
    isAuthenticated ? {} : "skip"
  );

  // Guard so a reactive re-fire of getAccountBoard (e.g. our own push echoed
  // back) doesn't re-apply an already-applied board and clobber local edits.
  const lastAppliedAt = useRef<number>(0);
  const applyingRemote = useRef<boolean>(false);
  // Latest boardId in a ref so the push path always reads the current value
  // (avoids stale closures when the edit listener fires before a re-render).
  const boardIdRef = useRef<string | null>(null);
  // Push timer (debounce local edits).
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  // Resolve the active account's boardId from local storage, falling back to
  // the Convex account listing when the local cache is empty.
  const resolveActiveBoard = useCallback(async () => {
    const accountId = await getCurrentAccountId();
    if (accountId === PERSONAL_ACCOUNT_ID) {
      boardIdRef.current = "personal";
      setBoardId("personal");
      return;
    }

    const meta = await getLocalAccount(accountId);
    if (meta?.boardId) {
      boardIdRef.current = meta.boardId;
      setBoardId(meta.boardId);
      return;
    }

    // Local cache miss — ask the server for this account's boardId.
    const remote = (myAccounts as Array<{ accountId: string; boardId: string | null }> | undefined)
      ?.find((a) => a.accountId === accountId);
    if (remote?.boardId) {
      // Cache it locally so subsequent resolves are instant.
      await saveLocalAccount({
        accountId,
        umbrella: "personal" as UmbrellaKey,
        name: accountId,
        boardId: remote.boardId,
        inviteCode: null,
        role: "member",
      });
      boardIdRef.current = remote.boardId;
      setBoardId(remote.boardId);
      return;
    }

    boardIdRef.current = null;
    setBoardId(null);
  }, [myAccounts]);

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

  // Reset lastAppliedAt and clear pending push timers when boardId switches.
  useEffect(() => {
    lastAppliedAt.current = 0;
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }
    pendingRef.current = false;
  }, [boardId]);

  const flushQueue = useCallback(async () => {
    if (!isAuthenticated || !isOnline()) return;
    const q = getQueue();
    if (q.length === 0) return;

    const remaining: QueuedPush[] = [];
    setSyncing(true);
    for (const item of q) {
      try {
        const res = (await pushBoard({
          boardId: item.boardId,
          data: item.data as never,
          updatedAt: item.updatedAt,
        })) as { success?: boolean; reason?: string } | undefined;

        if (res && res.success === false) {
          console.warn("Skipping unpushable queued board:", item.boardId, res.reason);
          continue;
        }
      } catch (e) {
        console.error("Failed to push queued board:", item.boardId, e);
        const errStr = e instanceof Error ? e.message : String(e);
        if (!errStr.includes("Board not found") && !errStr.includes("Not a member")) {
          remaining.push(item);
        }
      }
    }
    setQueue(remaining);
    setSyncing(false);
    setPushPending(remaining.length > 0);
  }, [isAuthenticated, pushBoard]);

  const doPush = useCallback(async () => {
    if (!isAuthenticated) return;
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
        // Set lastAppliedAt to client's push timestamp. If server merged remote
        // partner changes (bumping server updatedAt), the pull effect sees
        // remote.updatedAt > lastAppliedAt and applies the merged partner records.
        lastAppliedAt.current = updatedAt;
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
  }, [isAuthenticated, pushBoard, flushQueue]);

  const schedulePush = useCallback(() => {
    pendingRef.current = true;
    setPushPending(true);
    
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void doPush();
    }, PUSH_DEBOUNCE_MS);
  }, [doPush]);

  // Manual "Sync Now": force an immediate push of the active board's current
  // state and drain any queued pushes. Mirrors useSharedBoard.syncNow so the
  // Accounts feature has the same on-demand control the couple board has.
  const syncNow = useCallback(async () => {
    if (!isAuthenticated) return;
    const bid = boardIdRef.current;
    if (!bid) return;
    await doPush();
    await flushQueue();
  }, [isAuthenticated, doPush, flushQueue]);

  // Listen for local board edits → schedule a push. Attached unconditionally;
  // doPush/schedulePush no-op until boardId resolves, so an edit made in the
  // first tick after mount is still captured (no stale-closure loss).
  useEffect(() => {
    const onChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === "switch") {
        if (pushTimer.current) {
          clearTimeout(pushTimer.current);
          pushTimer.current = null;
        }
        pendingRef.current = false;
        lastAppliedAt.current = 0;
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
  }, [resolveActiveBoard, schedulePush]);

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

  return { boardId, loading, syncing, pushPending, lastError, syncNow };
}
