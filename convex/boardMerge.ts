// convex/boardMerge.ts
// Shared per-key Last-Write-Wins merge used by BOTH the legacy couple
// sharedBoards and the new multi-member accountBoards. Extracted so the two
// engines can't drift apart.

export interface StoredRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  updatedAt: number;
  deleted?: boolean;
}

/** Stores whose keys `store:itemId` are allowed on the wire. */
export const VALID_BOARD_STORES = [
  "expenses",
  "incomes",
  "budgets",
  "bills",
  "savingsGoals",
  "netWorthSnapshots",
  "debts",
  "criticalExpenseCommitments",
] as const;

/**
 * Validate an incoming board-map payload. Rejects unknown key prefixes,
 * malformed `store:itemId` shapes, and non-finite/negative timestamps
 * (Infinity/NaN poison comparisons and never evict). Returns the list of
 * invalid entries; an empty list means the payload is clean.
 */
export function validateBoardPayload(
  incoming: Record<string, StoredRecord>,
): string[] {
  const invalid: string[] = [];
  for (const [key, rec] of Object.entries(incoming)) {
    const colon = key.indexOf(":");
    if (colon <= 0 || colon === key.length - 1) {
      invalid.push(key);
      continue;
    }
    const store = key.slice(0, colon);
    if (!(VALID_BOARD_STORES as readonly string[]).includes(store)) {
      invalid.push(key);
      continue;
    }
    const ts = rec?.updatedAt;
    if (typeof ts !== "number" || !Number.isFinite(ts) || ts < 0) {
      invalid.push(key);
    }
  }
  return invalid;
}

/**
 * Tombstones (`deleted: true`) are retained for 30 days so offline devices can
 * observe deletions before the tombstone is garbage-collected from the board map.
 */
export const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Merge an incoming set of keyed records into the existing board map.
 * Per key, the incoming record wins only when its updatedAt is strictly newer
 * than the stored one; otherwise the stored record is kept. This gives true
 * 2-way sync — every member's edits survive rather than last-push-wins.
 * Expired tombstones (> 30 days old) are evicted during merge to prevent
 * unbounded document growth toward Convex's 1MB document limit.
 */
export function mergeRecords(
  existing: Record<string, StoredRecord> | null,
  incoming: Record<string, StoredRecord>,
  now: number = Date.now(),
): { merged: Record<string, StoredRecord>; changed: boolean } {
  // Reject malformed/poisoned entries outright: they must never enter the
  // board map (Infinity/NaN break LWW comparisons and tombstone eviction).
  const invalid = validateBoardPayload(incoming);
  const cleanIncoming: Record<string, StoredRecord> = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (!invalid.includes(k)) cleanIncoming[k] = v;
  }

  const base: Record<string, StoredRecord> = { ...(existing ?? {}) };
  let changed = false;
  for (const [key, rec] of Object.entries(cleanIncoming)) {
    const prev = base[key];
    // Incoming wins when newer; ties keep the incoming value (deterministic).
    if (!prev || rec.updatedAt >= prev.updatedAt) {
      if (
        prev &&
        prev.updatedAt === rec.updatedAt &&
        prev.value === rec.value &&
        Boolean(prev.deleted) === Boolean(rec.deleted)
      ) {
        continue; // identical — no change
      }
      base[key] = rec;
      changed = true;
    }
  }

  // Evict tombstones older than TOMBSTONE_TTL_MS (30 days)
  for (const [key, rec] of Object.entries(base)) {
    if (
      rec.deleted === true &&
      rec.updatedAt > 0 &&
      now - rec.updatedAt > TOMBSTONE_TTL_MS
    ) {
      delete base[key];
      changed = true;
    }
  }

  return { merged: base, changed };
}
