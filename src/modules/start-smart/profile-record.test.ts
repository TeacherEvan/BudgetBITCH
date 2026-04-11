import { describe, expect, it } from "vitest";
import { buildProfileRecord } from "./profile-record";

describe("buildProfileRecord", () => {
  it("serializes onboarding inputs into a stable storage record", () => {
    const result = buildProfileRecord({
      workspaceId: "ws_123",
      templateId: "young_adult",
      regionKey: "us-ca",
      householdKind: "solo",
      profile: {
        countryCode: "US",
        stateCode: "CA",
        cityCode: "los-angeles",
        locationKey: "us-ca-los-angeles",
        ageBand: "young_adult",
        housing: "renting",
        dependents: 0,
        pets: 0,
        incomePattern: "steady",
        debtLoad: "moderate",
        goals: ["emergency_fund"],
      },
    });

    expect(result).toMatchObject({
      workspaceId: "ws_123",
      templateId: "young_adult",
      regionKey: "us-ca",
      householdKind: "solo",
      status: "draft",
    });
    expect(result.profileJson).toMatchObject({
      cityCode: "los-angeles",
      locationKey: "us-ca-los-angeles",
    });
  });
});
