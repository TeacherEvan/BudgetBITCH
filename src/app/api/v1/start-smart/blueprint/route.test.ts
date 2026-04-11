import { beforeEach, describe, expect, it, vi } from "vitest";

const createProfileMock = vi.fn();
const createRegionalSnapshotMock = vi.fn();
const createBlueprintSnapshotMock = vi.fn();

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
            cityCode: "los-angeles",
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
    expect(json.profile.locationKey).toBe("us-ca-los-angeles");
    expect(json.regional.locationKey).toBe("us-ca-los-angeles");
    expect(json.regional.housing.monthly).toBe(2550);
    expect(json.blueprint.priorityStack.length).toBeGreaterThan(0);
    expect(json.persistence).toEqual({
      persisted: true,
      profileId: "profile_123",
    });
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
            cityCode: "los-angeles",
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
});
