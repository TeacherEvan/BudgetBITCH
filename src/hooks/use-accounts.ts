// hooks/use-accounts.ts
//
// Client-side orchestration for the Accounts feature: lists the user's accounts
// (owned + joined + legacy couple board), and exposes create / invite / accept /
// decline / leave / remove / rename / delete / switch actions. Built on the Convex
// `api.accounts.*` functions and the local multi-board swap (accountStorage).
//
// "Switch" stashes the outgoing board and adopts the target's remote snapshot
// into the 8 flat stores (the active board). useAccountSync then drives
// incremental pull/push. The dashboard reads those 8 stores, so no component
// changes are needed for data to follow the active board.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { PERSONAL_ACCOUNT_ID } from "@/lib/types/accounts";
import type { LocalAccountMeta } from "@/lib/types/accounts";
import {
  switchAccount as localSwitch,
  adoptRemoteBoardMap,
  getLocalAccounts,
  saveLocalAccount,
  removeLocalAccount,
  removeStashedAccount,
  getCurrentAccountId,
} from "@/lib/db/accountStorage";
import {
  useDatabaseListener,
  useWizardProfile,
  useNetWorth,
  useDebtPayoff,
} from "./use-local-db";

export { useDatabaseListener, useWizardProfile, useNetWorth, useDebtPayoff };

export interface AccountView extends LocalAccountMeta {
  hasLocalData: boolean;
  memberCount: number;
  isLegacyCouple?: boolean;
  displayName?: string;
  memberDisplayNames?: Record<string, string>;
}

export interface UseAccounts {
  accounts: AccountView[];
  currentAccountId: string;
  loading: boolean;
  ready: boolean;
  createAccount: (input: {
    umbrella: LocalAccountMeta["umbrella"];
    name: string;
  }) => Promise<{ accountId: string; boardId: string }>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  createInviteToken: (accountId: string) => Promise<string>;
  redeemInviteToken: (token: string) => Promise<{ accountId: string; boardId: string }>;
  leaveAccount: (accountId: string) => Promise<void>;
  removeMember: (accountId: string, userId: string) => Promise<void>;
  renameAccount: (accountId: string, name: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  setDisplayName: (displayName: string) => Promise<void>;
  switchTo: (accountId: string) => Promise<void>;
  refresh: () => void;
}

type ServerAccount = {
  accountId: string;
  umbrella: string;
  name: string;
  role: "owner" | "member";
  boardId: string | null;
  inviteCode: string | null;
  memberCount?: number;
  displayName?: string;
  memberDisplayNames?: Record<string, string>;
};

export function useAccounts(): UseAccounts {
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>(PERSONAL_ACCOUNT_ID);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const server = useQuery(api.accounts.listMyAccounts, isAuthenticated ? {} : "skip");
  const createMut = useMutation(api.accounts.createAccount);
  const inviteMut = useMutation(api.accounts.createInviteToken);
  const acceptMut = useMutation(api.accounts.acceptInvite);
  const redeemMut = useMutation(api.accounts.redeemInviteToken);
  const declineMut = useMutation(api.accounts.declineInvite);
  const leaveMut = useMutation(api.accounts.leaveAccount);
  const removeMut = useMutation(api.accounts.removeMember);
  const renameMut = useMutation(api.accounts.renameAccount);
  const deleteMut = useMutation(api.accounts.deleteAccount);
  const setDisplayNameMut = useMutation(api.accounts.setDisplayName);
  const convex = useConvex();

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Hydrate local listing + current selection (seeds personal if absent).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [local, current] = await Promise.all([
        getLocalAccounts(),
        getCurrentAccountId(),
      ]);
      if (cancelled) return;
      setCurrentAccountId(current);
      const hasPersonal = local.find((a) => a.accountId === PERSONAL_ACCOUNT_ID);
      if (!hasPersonal) {
        const personal: LocalAccountMeta = {
          accountId: PERSONAL_ACCOUNT_ID,
          umbrella: "personal",
          name: "Personal",
          boardId: null,
          inviteCode: null,
          role: "owner",
        };
        await saveLocalAccount({ ...personal, hasLocalData: true });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
     
  }, [nonce]);

  // Merge server accounts into the local listing view.
  useEffect(() => {
    // useQuery returns `undefined` ("skip") or `null` (still loading) before
    // data resolves — neither is iterable. Guard both so the effect degrades
    // gracefully instead of throwing an unhandled rejection.
    if (server === undefined || server === null) return;
    (async () => {
      const local = await getLocalAccounts();
      if (!local.find((a) => a.accountId === PERSONAL_ACCOUNT_ID)) {
        const personal: LocalAccountMeta = {
          accountId: PERSONAL_ACCOUNT_ID,
          umbrella: "personal",
          name: "Personal",
          boardId: null,
          inviteCode: null,
          role: "owner",
        };
        await saveLocalAccount({ ...personal, hasLocalData: true });
        local.push(personal);
      }
      const merged: AccountView[] = [];
      const seen = new Set<string>();
      for (const s of server as ServerAccount[]) {
        seen.add(s.accountId);
        const existing = local.find((l) => l.accountId === s.accountId);
        const serverMeta: LocalAccountMeta = {
          accountId: s.accountId,
          umbrella: s.umbrella as LocalAccountMeta["umbrella"],
          name: s.name,
          boardId: s.boardId,
          inviteCode: s.inviteCode ?? null,
          role: s.role,
          hasLocalData: existing?.hasLocalData ?? s.role === "member",
        };
        if (!existing || existing.boardId !== s.boardId || existing.name !== s.name || existing.role !== s.role) {
          await saveLocalAccount(serverMeta);
        }
        merged.push({
          ...serverMeta,
          hasLocalData: existing?.hasLocalData ?? s.role === "member",
          memberCount: s.memberCount ?? 1,
          isLegacyCouple: s.umbrella === "couple" && !existing,
          displayName: s.displayName,
          memberDisplayNames: s.memberDisplayNames,
        });
      }
      const personal = local.find((l) => l.accountId === PERSONAL_ACCOUNT_ID);
      if (personal && !seen.has(PERSONAL_ACCOUNT_ID)) {
        merged.push({
          ...personal,
          hasLocalData: personal.hasLocalData ?? true,
          memberCount: 1,
        });
      }
      setAccounts(merged);
    })();
     
  }, [server, nonce]);

  const switchTo = useCallback(
    async (accountId: string) => {
      const local = await getLocalAccounts();
      const meta = local.find((l) => l.accountId === accountId);
      try {
        if (meta?.boardId) {
          const board = (await convex.query(api.accounts.getAccountBoard, {
            boardId: meta.boardId,
          })) as {
            boardId: string;
            updatedAt: number;
            data: Record<string, { value: unknown; updatedAt: number }> | null;
          } | null;
          if (board?.data) {
            await adoptRemoteBoardMap(meta, board.data);
          } else {
            await localSwitch(accountId);
          }
        } else {
          await localSwitch(accountId);
        }
      } catch (e) {
        console.error("Convex board fetch failed, falling back to local switch:", e);
        await localSwitch(accountId);
      }
      setCurrentAccountId(accountId);
    },
    [convex],
  );

  const createAccount = useCallback(
    async (input: { umbrella: LocalAccountMeta["umbrella"]; name: string }) => {
      if (!isAuthenticated) {
        throw new Error("Authentication required. Please sign in to create or share account boards.");
      }
      const res = (await createMut({
        umbrella: input.umbrella as string,
        name: input.name,
      })) as { accountId: string; boardId: string };
      await saveLocalAccount({
        accountId: res.accountId,
        umbrella: input.umbrella,
        name: input.name,
        boardId: res.boardId,
        inviteCode: null,
        role: "owner",
        hasLocalData: true,
      });
      await switchTo(res.accountId);
      refresh();
      return res;
    },
    [createMut, switchTo, refresh, isAuthenticated],
  );

  const createInviteToken = useCallback(
    async (accountId: string): Promise<string> => {
      if (!isAuthenticated) {
        throw new Error("Authentication required. Please sign in to generate invite tokens.");
      }
      const res = await inviteMut({ accountId });
      refresh();
      return (res as { token: string }).token;
    },
    [inviteMut, refresh, isAuthenticated],
  );

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      await acceptMut({ inviteId });
      refresh();
    },
    [acceptMut, refresh],
  );

  const redeemInviteToken = useCallback(
    async (token: string) => {
      const res = (await redeemMut({ token })) as {
        accountId: string;
        boardId: string;
      };
      await localSwitch(res.accountId);
      refresh();
      return { accountId: res.accountId, boardId: res.boardId };
    },
    [redeemMut, refresh],
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      await declineMut({ inviteId });
      refresh();
    },
    [declineMut, refresh],
  );

  const leaveAccount = useCallback(
    async (accountId: string) => {
      await leaveMut({ accountId });
      await removeLocalAccount(accountId);
      const current = await getCurrentAccountId();
      if (current === accountId) {
        await localSwitch(PERSONAL_ACCOUNT_ID);
        setCurrentAccountId(PERSONAL_ACCOUNT_ID);
      }
      refresh();
    },
    [leaveMut, refresh],
  );

  const removeMember = useCallback(
    async (accountId: string, userId: string) => {
      await removeMut({ accountId, userId });
      refresh();
    },
    [removeMut, refresh],
  );

  const renameAccount = useCallback(
    async (accountId: string, name: string) => {
      await renameMut({ accountId, name });
      const local = await getLocalAccounts();
      const existing = local.find((l) => l.accountId === accountId);
      if (existing) {
        await saveLocalAccount({ ...existing, name });
      }
      refresh();
    },
    [renameMut, refresh],
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      const current = await getCurrentAccountId();
      await deleteMut({ accountId });
      if (current === accountId) {
        await localSwitch(PERSONAL_ACCOUNT_ID);
      }
      await removeLocalAccount(accountId);
      await removeStashedAccount(accountId);
      setCurrentAccountId(current === accountId ? PERSONAL_ACCOUNT_ID : current);
      refresh();
    },
    [deleteMut, refresh],
  );

  const setDisplayName = useCallback(
    async (displayName: string) => {
      await setDisplayNameMut({ displayName });
      refresh();
    },
    [setDisplayNameMut, refresh],
  );

  return {
    accounts,
    currentAccountId,
    loading,
    ready: !loading && server !== undefined,
    createAccount,
    createInviteToken,
    redeemInviteToken,
    acceptInvite,
    declineInvite,
    leaveAccount,
    removeMember,
    renameAccount,
    deleteAccount,
    setDisplayName,
    switchTo,
    refresh,
  };
}
