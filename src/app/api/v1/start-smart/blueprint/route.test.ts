import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentWorkspaceAccessMock } = vi.hoisted(() => ({
  getCurrentWorkspaceAccessMock: vi.fn(),
}));

const createProfileMock = vi.fn();
const createRegionalSnapshotMock = vi.fn();
const createBlueprintSnapshotMock = vi.fn();

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: getCurrentWorkspaceAccessMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    startSmartProfile: {
      create: createProfileMock,
    },
    regionalSnapshot: {
      create: createRegionalSnapshotMock,
    },
    moneyBlueprintSnapshot: {
      create: createBlueprintSnapshotMock,
    },
  }),
}));

import { POST } from "./route";

describe("POST /api/v1/start-smart/blueprint", () => {
  beforeEach(() => {
    createProfileMock.mockReset();
    createRegionalSnapshotMock.mockReset();
    createBlueprintSnapshotMock.mockReset();
    getCurrentWorkspaceAccessMock.mockReset();
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_123",
      userProfileId: "profile_user_123",
    });
  });

  it("returns a generated blueprint payload", async () => {
    createProfileMock.mockResolvedValue({ id: "profile_123" });
    createRegionalSnapshotMock.mockResolvedValue({ id: "regional_123" });
    createBlueprintSnapshotMock.mockResolvedValue({ id: "blueprint_123" });

    const request = new Request(
      "http://localhost/api/v1/start-smart/blueprint",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_123",
          templateId: "young_adult",
          answers: {
            countryCode: "US",
            stateCode: "CA",
            ageBand: "young_adult",
            housing: "renting",
            dependents: 0,
            pets: 0,
            incomePattern: "steady",
            debtLoad: "low",
            goals: ["emergency_fund"],
            benefitsSupport: ["none"],
            preferredIntegrations: [],
          },
        }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.blueprint.priorityStack.length).toBeGreaterThan(0);
    expect(json.persistence).toEqual({
      persisted: true,
      profileId: "profile_123",
    });
    expect(getCurrentWorkspaceAccessMock).toHaveBeenCalledWith("ws_123");
  });

  it("returns a non-persisted result when profile persistence fails", async () => {
    createProfileMock.mockRejectedValueOnce(new Error("profile write failed"));
    createRegionalSnapshotMock.mockResolvedValue({ id: "regional_123" });
    createBlueprintSnapshotMock.mockResolvedValue({ id: "blueprint_123" });

    const request = new Request(
      "http://localhost/api/v1/start-smart/blueprint",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_123",
          templateId: "young_adult",
          answers: {
            countryCode: "US",
            stateCode: "CA",
            ageBand: "young_adult",
            housing: "renting",
            dependents: 0,
            pets: 0,
            incomePattern: "steady",
            debtLoad: "low",
            goals: ["emergency_fund"],
            benefitsSupport: ["none"],
            preferredIntegrations: [],
          },
        }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.persistence).toEqual({
      persisted: false,
      reason: "profile write failed",
    });
    expect(createRegionalSnapshotMock).not.toHaveBeenCalled();
    expect(createBlueprintSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns 403 and does not persist when the user cannot access the workspace", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValueOnce({
      allowed: false,
      status: 403,
      reason: "workspace_forbidden",
    });

    const request = new Request(
      "http://localhost/api/v1/start-smart/blueprint",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_forbidden",
          templateId: "young_adult",
          answers: {
            countryCode: "US",
            stateCode: "CA",
            ageBand: "young_adult",
            housing: "renting",
            dependents: 0,
            pets: 0,
            incomePattern: "steady",
            debtLoad: "low",
            goals: ["emergency_fund"],
            benefitsSupport: ["none"],
            preferredIntegrations: [],
          },
        }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: "workspace_forbidden" });
    expect(createProfileMock).not.toHaveBeenCalled();
    expect(createRegionalSnapshotMock).not.toHaveBeenCalled();
    expect(createBlueprintSnapshotMock).not.toHaveBeenCalled();
  });
});
