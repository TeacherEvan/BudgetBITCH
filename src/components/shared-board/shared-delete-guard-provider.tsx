'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  useSharedDeleteGuard,
  type UseSharedDeleteGuard,
  type PendingStore,
} from '@/hooks/use-shared-delete-guard';

interface SharedDeleteGuardContextValue {
  isShared: boolean;
  /** True once the pending list has loaded (or resolved to empty). */
  loaded: boolean;
  /** Route a delete through two-party consent when the active board is shared. */
  requestDelete: (store: PendingStore, itemId: string, snapshot?: Record<string, unknown>) => Promise<void>;
  /** Approve a partner's pending delete request (executes the delete). */
  approve: (pendingId: string) => Promise<void>;
  /** Reject/cancel a pending delete request. */
  reject: (pendingId: string) => Promise<void>;
  /** Pending requests the current user can act on (the partner's requests). */
  pendingForMe: UseSharedDeleteGuard['pendingForMe'];
  /** Pending requests this user raised (awaiting partner approval). */
  pendingByMe: UseSharedDeleteGuard['pendingByMe'];
}

const SharedDeleteGuardContext = createContext<SharedDeleteGuardContextValue | null>(null);

/**
 * App-wide provider. Mounted once (in the shared-board mount) so the central
 * `use-local-db` delete facades can consult it. When the active board is NOT
 * shared, `requestDelete` throws — callers must fall back to a local delete.
 */
export function SharedDeleteGuardProvider({
  boardId,
  isShared,
  children,
}: {
  boardId: string | null;
  isShared: boolean;
  children: ReactNode;
}) {
  const guard = useSharedDeleteGuard(boardId, isShared);
  const value: SharedDeleteGuardContextValue = {
    isShared: guard.isShared,
    requestDelete: guard.requestDelete,
    pendingForMe: guard.pendingForMe,
    pendingByMe: guard.pendingByMe,
    approve: guard.approve,
    reject: guard.reject,
    loaded: guard.loaded,
  };

  // Register a stable module-level accessor so plain (non-component) store
  // functions can consult the guard without calling a React hook.
  setActiveGuard(value);

  return (
    <SharedDeleteGuardContext.Provider value={value}>
      {children}
    </SharedDeleteGuardContext.Provider>
  );
}

// Module-level accessor. Mirrors the currentMember pattern in current-member.ts:
// the provider writes it on render, plain functions read it. Avoids calling
// useContext inside a useCallback (rules-of-hooks violation).
let activeGuard: SharedDeleteGuardContextValue | null = null;

export function setActiveGuard(g: SharedDeleteGuardContextValue | null): void {
  activeGuard = g;
}

/** Non-hook accessor for the active shared-delete guard (for store delete facades). */
export function getActiveSharedDeleteGuard(): SharedDeleteGuardContextValue | null {
  return activeGuard;
}

export function useSharedDeleteGuardContext(): SharedDeleteGuardContextValue | null {
  return useContext(SharedDeleteGuardContext);
}
