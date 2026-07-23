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
  adoptRemoteAccount,
  getLocalAccounts,
  saveLocalAccount,
  removeLocalAccount,
  removeStashedAccount,
  getCurrentAccountId,
} from "@/lib/db/accountStorage";
import type { 
  WizardProfile, 
  NetWorthSnapshot,
  Debt 
} from "@/lib/types/budget";
import { 
  saveWizardProfile, 
  getWizardProfile, 
  clearWizardProfile,
  saveNetWorthSnapshot,
  getLatestNetWorthSnapshot,
  addDebt,
  updateDebt,
  deleteDebt,
  getAllDebts,
  generateId,
} from "@/lib/db/local-db";
import { BOARD_CHANGED_EVENT } from "@/lib/types/budget";

type Asset = NetWorthSnapshot['assets'][number];
type Liability = NetWorthSnapshot['liabilities'][number];

export type { Asset, Liability };

/**
 * Helper hook to register a window event listener that re-fetches local DB state
 * whenever the local board data changes (e.g. from partner sync pulls or account switches).
 */
export function useDatabaseListener(callback: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(BOARD_CHANGED_EVENT, callback);
    return () => window.removeEventListener(BOARD_CHANGED_EVENT, callback);
  }, [callback]);
}

// Wizard Profile
export function useWizardProfile() {
  const [profile, setProfile] = useState<WizardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getWizardProfile().then(p => {
      if (mounted) {
        setProfile(p || null);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

  const save = useCallback(async (newProfile: WizardProfile) => {
    await saveWizardProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const clear = useCallback(async () => {
    await clearWizardProfile();
    setProfile(null);
  }, []);

  return { profile, loading, save, clear };
}

// Net Worth
export function useNetWorth() {
  const [snapshot, setSnapshot] = useState<NetWorthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getLatestNetWorthSnapshot().then(s => {
      if (mounted) {
        setSnapshot(s ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

  const addAsset = useCallback(async (asset: Asset) => {
    if (!snapshot) return;
    const newAssets = [...snapshot.assets, { ...asset, id: generateId() }];
    const newSnapshot = { ...snapshot, assets: newAssets };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const updateAsset = useCallback(async (asset: Asset) => {
    if (!snapshot) return;
    const newAssets = snapshot.assets.map(a => a.id === asset.id ? asset : a);
    const newSnapshot = { ...snapshot, assets: newAssets };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const removeAsset = useCallback(async (id: string) => {
    if (!snapshot) return;
    const newAssets = snapshot.assets.filter(a => a.id !== id);
    const newSnapshot = { ...snapshot, assets: newAssets };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const addLiability = useCallback(async (liability: Liability) => {
    if (!snapshot) return;
    const newLiabilities = [...snapshot.liabilities, { ...liability, id: generateId() }];
    const newSnapshot = { ...snapshot, liabilities: newLiabilities };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const updateLiability = useCallback(async (liability: Liability) => {
    if (!snapshot) return;
    const newLiabilities = snapshot.liabilities.map(l => l.id === liability.id ? liability : l);
    const newSnapshot = { ...snapshot, liabilities: newLiabilities };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const removeLiability = useCallback(async (id: string) => {
    if (!snapshot) return;
    const newLiabilities = snapshot.liabilities.filter(l => l.id !== id);
    const newSnapshot = { ...snapshot, liabilities: newLiabilities };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const totalAssets = snapshot?.assets.reduce((sum, a) => sum + a.value, 0) || 0;
  const totalLiabilities = snapshot?.liabilities.reduce((sum, l) => sum + l.value, 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  return { 
    snapshot, 
    loading, 
    addAsset, 
    updateAsset, 
    removeAsset, 
    addLiability, 
    updateLiability, 
    removeLiability,
    totalAssets,
    totalLiabilities,
    netWorth
  };
}

// Debt Payoff
export function useDebtPayoff() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getAllDebts().then(d => {
      if (mounted) {
        setDebts(d);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

  const add = useCallback(async (debt: Debt) => {
    await addDebt(debt);
    setDebts(prev => [...prev, debt]);
  }, []);

  const update = useCallback(async (debt: Debt) => {
    await updateDebt(debt);
    setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteDebt(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  return { debts, loading, add, update, remove };
}

export interface AccountView extends LocalAccountMeta {
  hasLocalData: boolean;
  memberCount: number;
  isLegacyCouple?: boolean;
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
    if (server === undefined) return;
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
        merged.push({
          accountId: s.accountId,
          umbrella: s.umbrella as LocalAccountMeta["umbrella"],
          name: s.name,
          boardId: s.boardId,
          inviteCode: s.inviteCode ?? null,
          role: s.role,
          hasLocalData: existing?.hasLocalData ?? s.role === "member",
          memberCount: s.memberCount ?? 1,
          isLegacyCouple: s.umbrella === "couple" && !existing,
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
            await adoptRemoteAccount(meta, board.data);
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
    switchTo,
    refresh,
  };
}
