import { describe, it, expect } from "vitest";
import {
  mergeRecords,
  validateBoardPayload,
  TOMBSTONE_TTL_MS,
  type StoredRecord,
} from "./boardMerge";

describe("validateBoardPayload (Task 11)", () => {
  it("rejects unknown prefixes, malformed keys, Infinity/NaN/negative timestamps", () => {
    const bad = validateBoardPayload({
      "garbage:key": { value: 1, updatedAt: 100 },
      "expenses:ok": { value: 1, updatedAt: 100 },
      "no-colon": { value: 1, updatedAt: 100 },
      "expenses:inf": { value: 1, updatedAt: Infinity },
      "expenses:nan": { value: 1, updatedAt: NaN },
      "expenses:neg": { value: 1, updatedAt: -5 },
      ":empty": { value: 1, updatedAt: 100 },
    });
    expect(bad).toContain("garbage:key");
    expect(bad).toContain("no-colon");
    expect(bad).toContain("expenses:inf");
    expect(bad).toContain("expenses:nan");
    expect(bad).toContain("expenses:neg");
    expect(bad).toContain(":empty");
    expect(bad).not.toContain("expenses:ok");
  });

  it("mergeRecords drops non-finite-timestamp entries but keeps internal meta keys", () => {
    const { merged } = mergeRecords({}, {
      "expenses:ok": { value: { amount: 10 }, updatedAt: 100 },
      "expenses:inf": { value: { amount: 99 }, updatedAt: Infinity },
      "expenses:nan": { value: { amount: 99 }, updatedAt: NaN },
      "__purchaseNotes__": { value: { exp_1: { note: "hi" } }, updatedAt: 100 },
    });
    expect(Object.keys(merged).sort()).toEqual(["__purchaseNotes__", "expenses:ok"]);
  });
});

describe("mergeRecords (LWW + 30-day tombstone compaction)", () => {
  const NOW = 1_750_000_000_000;

  it("keeps newer incoming records and ignores older incoming records", () => {
    const existing: Record<string, StoredRecord> = {
      "expenses:1": { value: { amount: 100 }, updatedAt: NOW - 5000 },
      "expenses:2": { value: { amount: 200 }, updatedAt: NOW - 1000 },
    };
    const incoming: Record<string, StoredRecord> = {
      "expenses:1": { value: { amount: 150 }, updatedAt: NOW - 2000 }, // newer -> wins
      "expenses:2": { value: { amount: 180 }, updatedAt: NOW - 3000 }, // older -> ignored
    };

    const { merged, changed } = mergeRecords(existing, incoming, NOW);
    expect(changed).toBe(true);
    expect(merged["expenses:1"].value).toEqual({ amount: 150 });
    expect(merged["expenses:2"].value).toEqual({ amount: 200 });
  });

  it("retains tombstones younger than 30 days so offline peers observe deletions", () => {
    const recentDeleteTs = NOW - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const existing: Record<string, StoredRecord> = {
      "expenses:deleted-recent": { value: null, updatedAt: recentDeleteTs, deleted: true },
    };

    const { merged, changed } = mergeRecords(existing, {}, NOW);
    expect(changed).toBe(false);
    expect(merged["expenses:deleted-recent"]).toBeDefined();
    expect(merged["expenses:deleted-recent"].deleted).toBe(true);
  });

  it("evicts expired tombstones older than 30 days while keeping live records of any age", () => {
    const expiredDeleteTs = NOW - TOMBSTONE_TTL_MS - 1000; // 30 days + 1s ago
    const oldLiveTs = NOW - 365 * 24 * 60 * 60 * 1000; // 1 year old live record
    const existing: Record<string, StoredRecord> = {
      "expenses:deleted-old": { value: null, updatedAt: expiredDeleteTs, deleted: true },
      "expenses:live-old": { value: { amount: 500 }, updatedAt: oldLiveTs },
    };

    const { merged, changed } = mergeRecords(existing, {}, NOW);
    expect(changed).toBe(true);
    expect(merged["expenses:deleted-old"]).toBeUndefined();
    expect(merged["expenses:live-old"]).toEqual({
      value: { amount: 500 },
      updatedAt: oldLiveTs,
    });
  });
});
