import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: vi.fn().mockResolvedValue({
        blueprintJson: {
          priorityStack: ["cover_essentials", "reduce_debt_damage"],
          riskWarnings: ["high_debt_pressure"],
          learnModuleKeys: ["budgeting_basics", "debt_triage"],
        },
      }),
    },
  }),
}));

describe("POST /api/v1/learn/recommendations", () => {
  it("returns lesson recommendations for the latest blueprint", async () => {
    const request = new Request(
      "http://localhost/api/v1/learn/recommendations",
      {
        method: "POST",
        body: JSON.stringify({ workspaceId: "demo_workspace" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.primary[0].key).toBe("budgeting_basics");
    expect(json.primary[1].key).toBe("debt_triage");
  });
});
