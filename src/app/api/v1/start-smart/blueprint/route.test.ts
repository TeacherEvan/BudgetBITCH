import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/start-smart/blueprint", () => {
  it("returns a generated blueprint payload", async () => {
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
  });
});
