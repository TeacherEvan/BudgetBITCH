// lib/db/data-owner.ts
//
// Binds the on-device IndexedDB to ONE signed-in identity so two people using
// the same browser profile can never see (or sync) each other's data.
//
// The DB name is shared per origin, so ownership is recorded in `bbMeta`. When
// a different identity signs in, every local store is wiped before any cloud
// restore or sync runs. Only the opaque Convex tokenIdentifier is stored.

import { clearAllData, getDB } from "./local-db";

export const DATA_OWNER_KEY = "bb:dataOwner";

// Per-device sync bookkeeping that must not leak across identities.
const PER_USER_LOCALSTORAGE_KEYS = [
  "bb:lastCloudSnapshotAt",
  "bb:lastResetAt",
];

export type ClaimResult = "claimed" | "unchanged" | "switched";

export async function claimLocalDataOwner(
  tokenIdentifier: string,
): Promise<ClaimResult> {
  if (!tokenIdentifier) throw new Error("claimLocalDataOwner: empty identity");
  const db = await getDB();
  const current = (await db.get("bbMeta", DATA_OWNER_KEY)) as
    | string
    | undefined;
  if (current === tokenIdentifier) return "unchanged";

  // Legacy data (no owner recorded) is adopted by the first identity to sign
  // in, preserving pre-existing local-first data. A *different* owner wipes.
  if (current !== undefined) {
    await clearAllData();
    try {
      for (const k of PER_USER_LOCALSTORAGE_KEYS) localStorage.removeItem(k);
    } catch {
      // localStorage unavailable; best-effort.
    }
  }
  await db.put("bbMeta", tokenIdentifier, DATA_OWNER_KEY);
  return current === undefined ? "claimed" : "switched";
}

/**
 * Clears local state and data stores upon user sign-out to prevent sensitive
 * financial records or cached boards from lingering on a shared device.
 */
export async function clearLocalDataOnSignOut(): Promise<void> {
  await clearAllData();
  try {
    for (const k of PER_USER_LOCALSTORAGE_KEYS) localStorage.removeItem(k);
  } catch {
    // localStorage unavailable; best-effort.
  }
}
