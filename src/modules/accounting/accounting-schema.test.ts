import { describe, expect, it } from "vitest";
import {
  normalizeExpenseEntryInput,
  normalizeHomeAreaInput,
} from "./accounting-schema";

describe("normalizeExpenseEntryInput", () => {
  it("normalizes a manual expense entry for durable app-owned tracking", () => {
    const result = normalizeExpenseEntryInput({
      workspaceId: "workspace-1",
      budgetCategoryId: "category-1",
      accountId: "account-1",
      merchantName: " Corner Store ",
      amount: "12.45",
      occurredAt: "2026-05-01",
      note: " snacks ",
    });

    expect(result.workspaceId).toBe("workspace-1");
    expect(result.merchantName).toBe("Corner Store");
    expect(result.amount).toBe(12.45);
    expect(result.note).toBe("snacks");
  });

  it("rejects non-positive expense amounts", () => {
    expect(() =>
      normalizeExpenseEntryInput({
        workspaceId: "workspace-1",
        amount: 0,
        occurredAt: "2026-05-01",
      }),
    ).toThrow(/amount/i);
  });
});

describe("normalizeHomeAreaInput", () => {
  it("keeps only city-state-country level location fields", () => {
    const result = normalizeHomeAreaInput({
      city: "Austin",
      stateCode: "tx",
      countryCode: "us",
      consented: true,
    });

    expect(result).toEqual({
      city: "Austin",
      stateCode: "TX",
      countryCode: "US",
      consented: true,
    });
  });

  it("rejects precise coordinates so they cannot be stored", () => {
    expect(() =>
      normalizeHomeAreaInput({
        city: "Austin",
        stateCode: "TX",
        countryCode: "US",
        consented: true,
        latitude: 30.2672,
      }),
    ).toThrow(/coordinate|latitude|longitude/i);
  });
});