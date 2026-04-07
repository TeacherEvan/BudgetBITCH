import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();

const expectedLatestBlueprintQuery = {
  where: {
    workspaceId: "ws_123",
    status: "generated",
  },
  orderBy: {
    createdAt: "desc",
  },
  select: {
    blueprintJson: true,
  },
};

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: findFirstMock,
    },
  }),
}));

import {
  getLatestBlueprintForWorkspace,
  getLatestBlueprintSignalsForWorkspace,
} from "./latest-blueprint";

describe("getLatestBlueprintForWorkspace", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("loads the newest workspace blueprint and normalizes summary arrays", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["cover_essentials", "cover_essentials", 42, "stabilize_cash_flow"],
        riskWarnings: ["high_debt_pressure", null, "high_debt_pressure"],
        next7Days: ["List all fixed bills", "", "List all fixed bills", "Pause non-essentials"],
        learnModuleKeys: ["budgeting_basics", "budgeting_basics", "debt_triage", false],
      },
    });

    await expect(getLatestBlueprintForWorkspace("ws_123")).resolves.toEqual({
      priorityStack: ["cover_essentials", "stabilize_cash_flow"],
      riskWarnings: ["high_debt_pressure"],
      next7Days: ["List all fixed bills", "Pause non-essentials"],
      learnModuleKeys: ["budgeting_basics", "debt_triage"],
    });

    expect(findFirstMock).toHaveBeenCalledWith(expectedLatestBlueprintQuery);
  });

  it("returns null when the workspace has no saved blueprint", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(getLatestBlueprintForWorkspace("ws_empty")).resolves.toBeNull();
  });

  it("only queries dashboard-eligible generated snapshots", async () => {
    findFirstMock.mockResolvedValue(null);

    await getLatestBlueprintForWorkspace("ws_123");

    expect(findFirstMock).toHaveBeenCalledWith(expectedLatestBlueprintQuery);
  });

  it("returns null when the saved blueprint summary is malformed", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: "not valid json",
    });

    await expect(getLatestBlueprintForWorkspace("ws_123")).resolves.toBeNull();
  });

  it("accepts a saved blueprint when risk warnings normalize to empty", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["cover_essentials", "stabilize_cash_flow"],
        riskWarnings: ["", null, ""],
        next7Days: ["List all fixed bills", "Pause non-essentials"],
        learnModuleKeys: ["budgeting_basics", "debt_triage"],
      },
    });

    await expect(getLatestBlueprintForWorkspace("ws_123")).resolves.toEqual({
      priorityStack: ["cover_essentials", "stabilize_cash_flow"],
      riskWarnings: [],
      next7Days: ["List all fixed bills", "Pause non-essentials"],
      learnModuleKeys: ["budgeting_basics", "debt_triage"],
    });
  });

  it("returns null when the saved blueprint summary is partial", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["cover_essentials"],
        riskWarnings: ["high_debt_pressure"],
      },
    });

    await expect(getLatestBlueprintForWorkspace("ws_123")).resolves.toBeNull();
  });

  it("returns null when the saved blueprint summary normalizes to empty sections", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["", 42],
        riskWarnings: [null],
        next7Days: [],
        learnModuleKeys: [false],
      },
    });

    await expect(getLatestBlueprintForWorkspace("ws_123")).resolves.toBeNull();
  });

  it("returns partial normalized signals for the newest generated snapshot", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["reduce_debt_damage", "reduce_debt_damage", 42],
        riskWarnings: ["benefits_change_risk", "", "benefits_change_risk"],
        next7Days: [],
        learnModuleKeys: ["benefits_protection", false],
      },
    });

    await expect(getLatestBlueprintSignalsForWorkspace("ws_123")).resolves.toEqual({
      priorityStack: ["reduce_debt_damage"],
      riskWarnings: ["benefits_change_risk"],
      next7Days: [],
      learnModuleKeys: ["benefits_protection"],
    });

    expect(findFirstMock).toHaveBeenCalledWith(expectedLatestBlueprintQuery);
  });

  it("returns null when the latest generated snapshot has no usable signals", async () => {
    findFirstMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["", 42],
        riskWarnings: [null],
        next7Days: [],
        learnModuleKeys: [false],
      },
    });

    await expect(getLatestBlueprintSignalsForWorkspace("ws_123")).resolves.toBeNull();
  });
});