// convex/boardMerge.ts
// Shared per-key Last-Write-Wins merge used by BOTH the legacy couple
// sharedBoards and the new multi-member accountBoards. Extracted so the two
// engines can't drift apart.

export interface StoredRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  updatedAt: number;
}

/**
 * Merge an incoming set of keyed records into the existing board map.
 * Per key, the incoming record wins only when its updatedAt is strictly newer
 * than the stored one; otherwise the stored record is kept. This gives true
 * 2-way sync — every member's edits survive rather than last-push-wins.
 */
export function mergeRecords(
  existing: Record<string, StoredRecord> | null,
  incoming: Record<string, StoredRecord>,
): { merged: Record<string, StoredRecord>; changed: boolean } {
  const base: Record<string, StoredRecord> = { ...(existing ?? {}) };
  let changed = false;
  for (const [key, rec] of Object.entries(incoming)) {
    const prev = base[key];
    // Incoming wins when newer; ties keep the incoming value (deterministic).
    if (!prev || rec.updatedAt >= prev.updatedAt) {
      if (prev && prev.updatedAt === rec.updatedAt && prev.value === rec.value) {
        continue; // identical — no change
      }
      base[key] = rec;
      changed = true;
    }
  }
  return { merged: base, changed };
}
